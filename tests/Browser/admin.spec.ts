import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';

const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
const databasePath = fileURLToPath(
    new URL('../../database/database.sqlite', import.meta.url),
);
const artisanEnv = {
    ...process.env,
    APP_ENV: 'testing',
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: databasePath,
    SESSION_DRIVER: 'file',
    CACHE_STORE: 'file',
    QUEUE_CONNECTION: 'sync',
};

function artisan(...args: string[]) {
    return execFileSync('php', ['artisan', ...args], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: artisanEnv,
    });
}

function resetDatabase() {
    artisan('migrate:fresh', '--seed', '--force');
}

function createAdminFixtures() {
    artisan(
        'tinker',
        '--execute',
        `
            \\App\\Models\\Announcement::factory()->published()->create([
                'title' => 'Playwright Admin Procurement Notice',
                'organization' => 'Khon Kaen Admin Office',
                'category' => 'Construction',
                'method' => 'e-bidding',
                'status' => 'open',
                'budget' => 550000,
                'deadline' => now()->addDays(30)->format('Y-m-d'),
            ]);
        `,
    );
}

async function loginAs(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="password"]').fill(password);
    await page.locator('[data-test="login-button"]').click();
    await page.waitForURL(/\/(user\/dashboard|admin)$/);
}

async function expectListOrEmptyState(
    page: Page,
    selector: string,
    emptyTexts: string[],
) {
    await expect
        .poll(async () => {
            if ((await page.locator(selector).count()) > 0) {
                return true;
            }

            for (const text of emptyTexts) {
                if ((await page.getByText(text).count()) > 0) {
                    return true;
                }
            }

            return false;
        })
        .toBe(true);
}

test('admin user sees admin navigation and can open admin dashboards', async ({
    page,
}) => {
    resetDatabase();
    createAdminFixtures();

    await loginAs(page, 'admin@example.com', 'password');

    await expect(
        page.locator('[data-test="nav-admin-link"]:visible'),
    ).toBeVisible();

    await page.goto('/admin');
    await expectListOrEmptyState(page, '[data-test="admin-announcement-row"]', [
        'ไม่พบประกาศที่ตรงกับการค้นหา',
    ]);

    await page.goto('/admin/users');
    await expectListOrEmptyState(page, '[data-test="admin-user-row"]', [
        'ไม่พบผู้ใช้งาน',
    ]);
});

test('registered user cannot access the admin dashboard', async ({ page }) => {
    resetDatabase();

    await loginAs(page, 'test@example.com', 'password');

    const response = await page.goto('/admin');

    if (response?.status() === 403) {
        await expect(page.getByText('403')).toBeVisible();
        return;
    }

    await expect(page).not.toHaveURL(/\/admin$/);
    await expect(
        page.locator('[data-test="nav-admin-link"]:visible'),
    ).toHaveCount(0);
});
