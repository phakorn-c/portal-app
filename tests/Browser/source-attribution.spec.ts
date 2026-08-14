import { expect, type Page, test } from '@playwright/test';

import { resetDatabase } from './support/test-environment';

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

test('admin publishes approved source and guest sees attribution while the public page hides extraction internals', async ({
    page,
}, testInfo) => {
    resetDatabase();
    const announcement = {
        id: 7,
        title: 'จ้างปรับปรุงระบบระบายน้ำเทศบาล',
        sourceUrl: 'https://demo.invalid/kkmuni/PROC-2569-002',
        sourceReference: 'PROC-2569-002',
        filename: 'khon-kaen-municipality-scanned-demo.pdf',
    };

    await loginAsAdmin(page);
    await page.getByPlaceholder('ค้นหาประกาศ...').fill(announcement.title);

    const announcementRow = page
        .locator('[data-test="admin-announcement-row"]')
        .filter({ hasText: announcement.title });
    const publicationButton = announcementRow.locator(
        '[data-test="admin-announcement-publish"]',
    );

    await expect(announcementRow).toHaveCount(1);
    await expect(publicationButton).toHaveAttribute('title', 'เผยแพร่');
    await publicationButton.click();
    await expect(publicationButton).toHaveAttribute('title', 'ซ่อน');

    await logout(page);
    await page.goto('/procurement');
    await page
        .getByPlaceholder('ค้นหาด้วยคำสำคัญ, เลขที่โครงการ หรือชื่อหน่วยงาน...')
        .fill(announcement.title);
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();

    const announcementCard = page.locator('article').filter({
        has: page.getByRole('heading', { name: announcement.title }),
    });
    await expect(announcementCard).toHaveCount(1);
    await announcementCard
        .getByRole('link', { name: /ดูรายละเอียด|ดูผลการจัดซื้อ/ })
        .click();

    await expect(page).toHaveURL(
        new RegExp(`/procurement/announcements/${announcement.id}$`),
    );
    const sourceLink = page.locator('[data-test="source-attribution-link"]');
    await expect(sourceLink).toHaveAttribute('href', announcement.sourceUrl);
    await expect(sourceLink).toHaveAttribute('target', '_blank');
    await expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(
        page.locator('[data-test="source-attribution-reference"]'),
    ).toContainText(announcement.sourceReference);
    await expect(
        page.locator('[data-test="source-attribution-invalid-label"]'),
    ).toContainText('.invalid');
    await expect(
        page.locator('[data-test="source-attribution-notice"]'),
    ).toContainText(
        'ข้อมูลนี้เป็นข้อมูลสาธิตแบบกำหนดผลลัพธ์แน่นอน ไม่ใช่ผลลัพธ์จาก OCR หรือโมเดล',
    );
    await expect(
        page.locator(`iframe[title="${announcement.filename}"]`),
    ).toBeVisible();

    const publicPage = page.locator('body');
    await expect(publicPage).not.toContainText('fake_ocr_placeholder');
    await expect(publicPage).not.toContainText(
        'deterministic OCR placeholder; not model output',
    );
    await expect(publicPage).not.toContainText('DEMO_EXTRACTION_FAILURE');
    await expect(publicPage).not.toContainText('ข้อความดิบจากการสกัด');
    await expect(publicPage).not.toContainText('ค่าความมั่นใจ');
    await expect(publicPage).not.toContainText('คำเตือนจากการสกัด');

    for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.screenshot({
            path: testInfo.outputPath(`source-attribution-${width}.png`),
            fullPage: true,
        });
    }
});
