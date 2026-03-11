import { expect, test } from '@playwright/test';

test('guest is redirected to login from saved searches', async ({ page }) => {
    await page.goto('/user/saved-searches');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
});

test('guest is redirected to login from user dashboard', async ({ page }) => {
    await page.goto('/user/dashboard');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
});
