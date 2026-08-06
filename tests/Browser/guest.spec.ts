import { expect, test } from '@playwright/test';

import { resetDatabase } from './support/test-environment';

test('guest can search procurement and open an announcement detail page', async ({
    page,
}) => {
    resetDatabase();

    const announcement = {
        id: 1,
        title: 'Khon Kaen Smart Traffic Upgrade',
    };

    await page.goto('/procurement');

    await expect(
        page.locator('[data-test="nav-saved-searches-link"]:visible'),
    ).toHaveCount(0);

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
    await expect(
        page.getByRole('heading', { name: announcement.title }),
    ).toBeVisible();
    await expect(
        page.getByText('รายละเอียดประกาศจัดซื้อจัดจ้าง'),
    ).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'เอกสารข้อกำหนด (TOR)' }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'ดาวน์โหลดเอกสาร PDF' }),
    ).toBeVisible();
    await expect(
        page.locator('iframe[title="Smart-Traffic-TOR-demo.pdf"]'),
    ).toBeVisible();
    await expect(page.locator('button:has(svg.lucide-bookmark)')).toHaveCount(
        0,
    );
    await expect(page.getByRole('button', { name: 'บันทึก' })).toHaveCount(0);
});
