import { expect, type Page, test } from '@playwright/test';

import { artisan, resetDatabase } from './support/test-environment';

const importedRecord = {
    title: 'ประกวดราคาจ้างปรับปรุงระบบระบายน้ำภายในมหาวิทยาลัย',
    query: 'ระบบระบายน้ำ',
    organization: 'มหาวิทยาลัยขอนแก่น',
    budget: '฿ 9,876,543.21',
    deadline: '18 กันยายน 2569',
    contactName: 'กองคลัง งานพัสดุ',
    contactPhone: '043-202-555',
    sourceUrl: 'https://example.test/procurement/drainage-2569',
    sourceReference: 'kku:drainage-2569-001',
    filename: 'drainage-project.pdf',
} as const;

async function loginAsAdmin(page: Page): Promise<void> {
    await page.goto('/login');
    await page.locator('[name="email"]').fill('admin@example.com');
    await page.locator('[name="password"]').fill('password');
    await page.locator('[data-test="login-button"]').click();
    await page.waitForURL(/\/admin$/);
}

async function logout(page: Page): Promise<void> {
    const userMenuTrigger = page.locator('button').filter({
        has: page.locator('[data-slot="avatar"]'),
    });

    await userMenuTrigger.click();
    await page.locator('[data-test="logout-button"]').click();
    await expect(userMenuTrigger).toHaveCount(0);
}

function importRecord(): number {
    artisan(
        'portal:import',
        'tests/Fixtures/Procurement/portal-import-round-trip/portal_import.json',
    );
    const output = artisan(
        'tinker',
        '--execute',
        `print(\\App\\Models\\Announcement::query()->where('source_reference', '${importedRecord.sourceReference}')->value('id'));`,
    ).trim();
    const announcementId = Number.parseInt(output, 10);

    if (!Number.isInteger(announcementId)) {
        throw new Error(
            `Unable to resolve imported announcement ID: ${output}`,
        );
    }

    return announcementId;
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
    const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
        offenders: Array.from(document.querySelectorAll('body *'))
            .map((element) => {
                const bounds = element.getBoundingClientRect();

                return {
                    tag: element.tagName,
                    text: element.textContent?.trim().slice(0, 80) ?? '',
                    right: Math.round(bounds.right),
                    scrollWidth: element.scrollWidth,
                    clientWidth: element.clientWidth,
                };
            })
            .filter(
                (element) =>
                    element.right > document.documentElement.clientWidth ||
                    element.scrollWidth > element.clientWidth,
            )
            .slice(-10),
    }));

    expect(
        dimensions.content,
        JSON.stringify(dimensions.offenders),
    ).toBeLessThanOrEqual(dimensions.viewport);
}

test('real imported record renders polished Thai facts on responsive guest pages after explicit review and publish', async ({
    page,
}, testInfo) => {
    resetDatabase();
    const announcementId = importRecord();

    const draftResponse = await page.goto(
        `/procurement/announcements/${announcementId}`,
    );
    expect(draftResponse?.status()).toBe(404);

    await loginAsAdmin(page);
    await page.goto('/admin');
    const reviewLink = page
        .locator(`[data-test="extraction-review-link-${announcementId}"]`)
        .first();
    await expect(reviewLink).toBeVisible();
    await reviewLink.click();
    await page.locator('[data-test="extraction-approve-submit"]').click();
    await expect(
        page.locator('[data-test="extraction-approved"]'),
    ).toBeVisible();

    await page.goto('/admin');
    await page.getByPlaceholder('ค้นหาประกาศ...').fill(importedRecord.title);
    const announcementRow = page
        .locator('[data-test="admin-announcement-row"]')
        .filter({ hasText: importedRecord.title });
    const publishButton = announcementRow.locator(
        '[data-test="admin-announcement-publish"]',
    );
    await expect(publishButton).toHaveAttribute('title', 'เผยแพร่');
    await publishButton.click();
    await expect(publishButton).toHaveAttribute('title', 'ซ่อน');
    await logout(page);

    const browserErrors: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') {
            browserErrors.push(message.text());
        }
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));

    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/procurement');
    const minimumBudget = page.getByRole('slider', {
        name: 'งบประมาณต่ำสุด',
    });
    const maximumBudget = page.getByRole('slider', {
        name: 'งบประมาณสูงสุด',
    });
    await expect(minimumBudget).toBeVisible();
    await expect(maximumBudget).toBeVisible();
    await maximumBudget.focus();
    await maximumBudget.press('ArrowLeft');
    await expect(page.getByPlaceholder('สูงสุด')).toHaveValue('9900000');
    await maximumBudget.press('ArrowRight');
    await expect(page.getByPlaceholder('สูงสุด')).toHaveValue('10000000');

    await page
        .getByPlaceholder('ค้นหาด้วยคำสำคัญ, เลขที่โครงการ หรือชื่อหน่วยงาน...')
        .fill(importedRecord.query);
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();

    const announcementCard = page.locator('article').filter({
        has: page.getByRole('heading', { name: importedRecord.title }),
    });
    await expect(announcementCard).toContainText(importedRecord.organization);
    await expect(announcementCard).toContainText(importedRecord.budget);
    await expect(announcementCard).toContainText(importedRecord.deadline);
    const methodCheckbox = page.getByRole('checkbox', {
        name: /e-bidding/,
    });
    await methodCheckbox.click();
    const removeMethodFilter = page.getByRole('button', {
        name: /ลบตัวกรอง.*e-bidding/,
    });
    await expect(removeMethodFilter).toBeVisible();
    await removeMethodFilter.click();
    await expect(removeMethodFilter).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    const titleBox = await announcementCard
        .getByRole('heading', { name: importedRecord.title })
        .boundingBox();
    if (titleBox === null) {
        throw new Error('Imported announcement title is not rendered.');
    }
    expect(titleBox.height).toBeGreaterThan(30);

    for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await expectNoHorizontalOverflow(page);
        await page.screenshot({
            path: testInfo.outputPath(`imported-search-${width}.png`),
            fullPage: true,
        });
    }

    await announcementCard.getByRole('link', { name: 'ดูรายละเอียด' }).click();
    await expect(page).toHaveURL(
        new RegExp(`/procurement/announcements/${announcementId}$`),
    );
    await expect(
        page.getByRole('heading', { name: importedRecord.title }),
    ).toBeVisible();
    await expect(
        page.getByRole('heading', {
            name: 'รายละเอียดประกาศจัดซื้อจัดจ้าง',
            level: 2,
        }),
    ).toBeVisible();
    await expect(
        page.getByRole('heading', {
            name: 'ข้อมูลติดต่อ & เอกสารที่ต้องใช้',
            level: 2,
        }),
    ).toBeVisible();
    await expect(
        page.getByText(importedRecord.budget, { exact: true }),
    ).toBeVisible();
    await expect(
        page.getByText(importedRecord.deadline, { exact: true }),
    ).toHaveCount(2);
    await expect(
        page.getByText(importedRecord.organization, { exact: true }),
    ).toBeVisible();
    await expect(
        page.getByText(importedRecord.contactName, { exact: true }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: importedRecord.contactPhone }),
    ).toHaveAttribute('href', `tel:${importedRecord.contactPhone}`);
    await expect(
        page.locator('[data-test="source-attribution-link"]'),
    ).toHaveAttribute('href', importedRecord.sourceUrl);
    await expect(
        page.locator('[data-test="source-attribution-reference"]'),
    ).toContainText(importedRecord.sourceReference);
    await expect(
        page.locator('[data-test="source-attribution-notice"]'),
    ).toContainText('โปรดตรวจสอบรายละเอียดกับเว็บไซต์ต้นทาง');
    await expect(
        page.locator(`iframe[title="${importedRecord.filename}"]`),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'เปิดเอกสาร PDF ในแท็บใหม่' }),
    ).toBeVisible();
    await expect(page.getByText('เผยแพร่แล้ว', { exact: true })).toBeVisible();
    await expect(page.getByText('published', { exact: true })).toHaveCount(0);
    await expect(page.getByText('closing', { exact: true })).toHaveCount(0);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'ดาวน์โหลดเอกสาร PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(importedRecord.filename);

    for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await expectNoHorizontalOverflow(page);
        await page.screenshot({
            path: testInfo.outputPath(`imported-detail-${width}.png`),
            fullPage: true,
        });
    }

    expect(browserErrors).toEqual([]);
});
