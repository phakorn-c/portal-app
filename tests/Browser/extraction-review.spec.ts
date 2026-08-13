import { expect, type Page, test } from '@playwright/test';

import { resetDatabase } from './support/test-environment';

async function loginAs(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.locator('[data-test="login-button"]').click();
    await page.waitForURL(/\/(user\/dashboard|admin|dashboard|)$/);
}

async function logout(page: Page) {
    const userMenuTrigger = page.locator('button').filter({
        has: page.locator('[data-slot="avatar"]'),
    });

    await userMenuTrigger.click();

    const logoutResponsePromise = page.waitForResponse(
        (response) =>
            response.url().includes('/logout') &&
            response.request().method() === 'POST',
    );

    await page.locator('[data-test="logout-button"]').click();
    await logoutResponsePromise;
    await page.waitForLoadState('networkidle');
    await expect(userMenuTrigger).toHaveCount(0);
}

async function openReviewFromDashboard(page: Page, announcementId: number) {
    await page.goto('/admin');
    const link = page.locator(
        `[data-test="extraction-review-link-${announcementId}"]`,
    );
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    await link.click();
    await expect(
        page.locator('[data-test="extraction-review-page"]'),
    ).toBeVisible();
    return href as string;
}

test('admin approves a seeded review extraction with one corrected field', async ({
    page,
}) => {
    resetDatabase();
    await loginAs(page, 'admin@example.com', 'password');
    await openReviewFromDashboard(page, 6);

    await expect(page.locator('[data-test="extraction-status"]')).toHaveText(
        'รอตรวจสอบ',
    );
    await expect(
        page.locator('[data-test="extraction-approve-form"]'),
    ).toBeVisible();

    await page.locator('#contact_name').fill('งานพัสดุ (แก้ไข)');
    await page.locator('[data-test="extraction-approve-submit"]').click();

    await expect(page.locator('[data-test="extraction-status"]')).toHaveText(
        'อนุมัติแล้ว',
    );
    await expect(
        page.locator('[data-test="extraction-approved"]'),
    ).toBeVisible();
    await expect(
        page.locator('[data-test="extraction-approved-note"]'),
    ).toBeVisible();
    await expect(
        page.locator('[data-test="extraction-approve-form"]'),
    ).toHaveCount(0);

    await page.reload();
    await expect(page.locator('[data-test="extraction-status"]')).toHaveText(
        'อนุมัติแล้ว',
    );
    await expect(
        page.locator('[data-test="extraction-approved-note"]'),
    ).toBeVisible();
});

test('seeded failure shows the error and retry reaches terminal failed again', async ({
    page,
}) => {
    resetDatabase();
    await loginAs(page, 'admin@example.com', 'password');
    await openReviewFromDashboard(page, 8);

    await expect(page.locator('[data-test="extraction-status"]')).toHaveText(
        'ล้มเหลว',
    );
    await expect(page.locator('[data-test="extraction-error"]')).toContainText(
        'DEMO_EXTRACTION_FAILURE',
    );
    await expect(page.locator('[data-test="extraction-attempts"]')).toHaveText(
        'ความพยายาม 1/3',
    );
    await expect(
        page.locator('[data-test="extraction-candidates"]'),
    ).toHaveText('ไม่มีข้อมูลที่สกัดได้');
    await expect(page.locator('[data-test="extraction-retry"]')).toBeVisible();

    await page.locator('[data-test="extraction-retry"]').click();

    await expect(page.locator('[data-test="extraction-status"]')).toHaveText(
        'ล้มเหลว',
    );
    await expect(page.locator('[data-test="extraction-error"]')).toContainText(
        'DEMO_EXTRACTION_FAILURE',
    );
    await expect(page.locator('[data-test="extraction-attempts"]')).toHaveText(
        'ความพยายาม 2/3',
    );

    await page.reload();
    await expect(page.locator('[data-test="extraction-status"]')).toHaveText(
        'ล้มเหลว',
    );
    await expect(page.locator('[data-test="extraction-attempts"]')).toHaveText(
        'ความพยายาม 2/3',
    );
});

test('registered user is denied access to the extraction review page', async ({
    page,
}) => {
    resetDatabase();
    await loginAs(page, 'admin@example.com', 'password');

    await page.goto('/admin');
    const link = page.locator('[data-test="extraction-review-link-6"]');
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();

    await logout(page);
    await loginAs(page, 'test@example.com', 'password');

    const response = await page.goto(href as string);

    if (response?.status() === 403) {
        await expect(page.getByText('403')).toBeVisible();
        return;
    }

    expect(response?.status()).toBe(403);
});
