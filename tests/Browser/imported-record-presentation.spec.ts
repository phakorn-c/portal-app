import {
    copyFileSync,
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import {
    artisan,
    projectRoot,
    resetDatabase,
} from './support/test-environment';

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
    test.setTimeout(120_000);
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
    await page.goto('/');
    await expect(
        page.getByRole('heading', { name: importedRecord.title }),
    ).toBeVisible();
    await expect(
        page.getByRole('slider', { name: 'งบประมาณสูงสุด' }),
    ).toBeVisible();
    await page.goto('/procurement', { waitUntil: 'domcontentloaded' });
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
    await expect(page.getByPlaceholder('สูงสุด')).toHaveValue('ไม่จำกัด');

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
        page.getByText(importedRecord.budget, { exact: true }).first(),
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

test('agreed raw OCR fields remain reviewable and render without invented prices or mobile overflow', async ({
    page,
}, testInfo) => {
    test.setTimeout(120_000);
    resetDatabase();
    const root = mkdtempSync(join(tmpdir(), 'portal-ocr-browser-'));
    const sourceUrl = 'https://example.test/raw-award-2569';
    const title = 'ประกาศผู้ชนะงานก่อสร้างศูนย์บริการประชาชน';
    const tag = `${title} รายละเอียดการจัดซื้อจัดจ้างโครงการประจำปีงบประมาณ พ.ศ. 2569`;

    try {
        mkdirSync(join(root, 'outputs'));
        mkdirSync(join(root, 'data', 'pdfs'), { recursive: true });
        copyFileSync(
            join(
                projectRoot,
                'tests/Fixtures/Procurement/portal-import-round-trip/portal_attachments/drainage-project.pdf',
            ),
            join(root, 'data', 'pdfs', 'raw-award.pdf'),
        );
        writeFileSync(
            join(root, 'outputs', 'output.json'),
            `\uFEFF${JSON.stringify([
                {
                    record_key: 'raw-award-2569',
                    source_id: 'test_source',
                    source_url: sourceUrl,
                    pdf_path: 'raw-award.pdf',
                    title,
                    agency: 'มหาวิทยาลัยขอนแก่น',
                    notice_type: 'award',
                    procurement_category: 'works',
                    method: 'ประกวดราคา',
                    tags: [tag],
                    province: 'ขอนแก่น',
                    budget: null,
                    base_price: '99999.00',
                    reference_price: null,
                    display_price: null,
                    display_price_source: 'none',
                    announced_at: '2569-10-06',
                    submission_deadline: null,
                    end_date: '15/10/2569',
                    process_status: 'unknown',
                    winner_name: 'บริษัท ตัวอย่าง จำกัด',
                    winning_price: 96300,
                    bidders: [],
                    validation_flags: ['review_sensitive_amount'],
                    raw_text: 'PRIVATE_RAW_OCR_MARKER',
                },
            ])}`,
        );

        artisan('portal:import', join(root, 'outputs', 'output.json'));
        const importedId = Number.parseInt(
            artisan(
                'tinker',
                '--execute',
                `print(\\App\\Models\\Announcement::query()->where('source_url', '${sourceUrl}')->value('id'));`,
            ).trim(),
            10,
        );
        expect(Number.isInteger(importedId)).toBe(true);
        expect(
            (
                await page.goto(`/procurement/announcements/${importedId}`)
            )?.status(),
        ).toBe(404);

        await loginAsAdmin(page);
        await page.goto('/admin');
        await page
            .locator(`[data-test="extraction-review-link-${importedId}"]`)
            .first()
            .click();
        await expect(page.locator('#budget')).toHaveValue('');
        await expect(page.locator('#deadline')).toHaveValue('');
        await expect(page.locator('#announced_at')).toHaveValue('2026-10-06');
        await page.locator('#display_price').fill('96300');
        await page
            .locator('#display_price_source')
            .selectOption('winning_price');
        await page.locator('[data-test="extraction-approve-submit"]').click();
        await expect(
            page.locator('[data-test="extraction-approved"]'),
        ).toBeVisible();

        await page.goto('/admin');
        const row = page
            .locator('[data-test="admin-announcement-row"]')
            .filter({
                hasText: title,
            });
        await row.locator('[data-test="admin-announcement-publish"]').click();
        await expect(
            row.locator('[data-test="admin-announcement-publish"]'),
        ).toHaveAttribute('title', 'ซ่อน');
        await logout(page);

        await page.goto(`/procurement?query=${encodeURIComponent(title)}`, {
            waitUntil: 'domcontentloaded',
        });
        const card = page.locator('article').filter({ hasText: title });
        await expect(card).toContainText('฿ 96,300.00');
        await expect(card).toContainText('ประกาศผู้ชนะ');
        await page.goto(`/procurement/announcements/${importedId}`, {
            waitUntil: 'domcontentloaded',
        });
        await expect(page.getByText('บริษัท ตัวอย่าง จำกัด')).toBeVisible();
        await expect(
            page.getByText('ไม่ทราบสถานะ', { exact: true }).first(),
        ).toBeVisible();
        await expect(page.getByText(tag)).toBeVisible();
        await expect(page.getByText('PRIVATE_RAW_OCR_MARKER')).toHaveCount(0);
        await expect(page.getByText('review_sensitive_amount')).toHaveCount(0);

        for (const width of [375, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            await expectNoHorizontalOverflow(page);
            await page.screenshot({
                path: testInfo.outputPath(`raw-ocr-detail-${width}.png`),
                fullPage: true,
            });
        }
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
