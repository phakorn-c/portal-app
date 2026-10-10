import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

import { resetDatabase } from './support/test-environment';

test('guest sees the public overview from the navigation', async ({ page }) => {
    // Given three published demo announcements from the canonical agencies.
    resetDatabase();

    // When a guest opens the public overview through the site navigation.
    await page.goto('/procurement');
    await page.getByRole('link', { name: 'ภาพรวม' }).click();

    // Then the summary and comparisons reflect the published records.
    await expect(page).toHaveURL(/\/overview$/);
    await expect(
        page.getByRole('heading', { name: 'ภาพรวมข้อมูลในระบบ' }),
    ).toBeVisible();
    await expect(page.getByRole('meter')).toHaveCount(6);
    await expect(page.locator('tbody tr')).toHaveCount(3);
    await expect(page.getByText('฿ 6.99 ล้าน')).toBeVisible();
});

test('guest filters the overview to one agency and can reset it', async ({
    page,
}) => {
    // Given the public overview with all three agencies.
    resetDatabase();
    await page.goto('/overview');

    // When the guest filters to the university.
    await page
        .getByLabel('หน่วยงาน', { exact: true })
        .selectOption('มหาวิทยาลัยขอนแก่น');
    await page.getByRole('button', { name: 'แสดงผล' }).click();

    // Then only the university's published announcement contributes.
    await expect(page).toHaveURL(/agency=/);
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByText('฿ 0.89 ล้าน')).toBeVisible();
    await expect(page.locator('#overview-agency option')).toHaveCount(4);
    await page.getByRole('link', { name: 'ล้างตัวกรอง' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(3);
});

test('recent period with no published records shows an empty state', async ({
    page,
}) => {
    // Given demo records published earlier than the recent period.
    resetDatabase();

    // When a guest selects the last 30 days with all agencies.
    await page.goto('/overview');
    await page.getByLabel('ช่วงวันที่ประกาศ').selectOption('30d');
    await page.getByRole('button', { name: 'แสดงผล' }).click();

    // Then no zero-valued agency rows masquerade as published data.
    await expect(page).toHaveURL(/period=30d/);
    await expect(page.locator('[data-test="overview-empty"]')).toHaveCount(3);
    await expect(page.getByRole('meter')).toHaveCount(0);
    await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('guest downloads the visible comparison rows as Thai CSV', async ({
    page,
}) => {
    // Given the public comparison of three published agencies.
    resetDatabase();
    await page.goto('/overview');

    // When the guest downloads the current table.
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'ดาวน์โหลดตาราง CSV' }).click();
    const download = await downloadEvent;
    const csv = await readFile(await download.path(), 'utf8');

    // Then the UTF-8 export contains the three real visible agency rows.
    expect(download.suggestedFilename()).toBe('procurement-overview.csv');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const rows = csv.trim().split('\r\n');
    expect(rows).toHaveLength(4);
    expect(rows[1]).toContain('เทศบาลนครขอนแก่น');
    expect(rows[1]).toContain('"2.45"');
});
