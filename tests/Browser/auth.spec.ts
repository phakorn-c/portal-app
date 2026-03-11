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

function createUserFixtures() {
    const output = artisan(
        'tinker',
        '--execute',
        `
            $announcement = \\App\\Models\\Announcement::factory()->published()->create([
                'title' => 'Playwright Auth Procurement Notice',
                'organization' => 'Khon Kaen Registered User Office',
                'category' => 'Construction',
                'method' => 'e-bidding',
                'status' => 'open',
                'budget' => 325000,
                'deadline' => now()->addDays(21)->format('Y-m-d'),
            ]);

            $userId = \\App\\Models\\User::query()->where('email', 'test@example.com')->value('id');

            \\App\\Models\\SavedSearch::factory()->create([
                'user_id' => $userId,
                'name' => 'Playwright Saved Search',
                'criteria' => [
                    'query' => 'Playwright Auth Procurement Notice',
                    'budgetRange' => [0, 10000000],
                    'organizations' => [],
                    'methods' => [],
                    'categories' => [],
                    'sortBy' => 'latest',
                ],
            ]);

            print(json_encode([
                'id' => $announcement->id,
                'title' => $announcement->title,
            ]));
        `,
    ).trim();

    return JSON.parse(output) as { id: number; title: string };
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

test('registered user sees member navigation and can open saved searches and history', async ({
    page,
}) => {
    resetDatabase();
    const announcement = createUserFixtures();

    await loginAs(page, 'test@example.com', 'password');

    await expect(
        page.locator('[data-test="nav-saved-searches-link"]:visible'),
    ).toBeVisible();
    await expect(
        page.locator('[data-test="nav-history-link"]:visible'),
    ).toBeVisible();
    await expect(
        page.locator('[data-test="nav-notifications-link"]:visible'),
    ).toBeVisible();
    await expect(
        page.locator('[data-test="nav-admin-link"]:visible'),
    ).toHaveCount(0);

    await page.goto('/user/saved-searches');
    await expectListOrEmptyState(page, '[data-test="saved-search-row"]', [
        'ยังไม่มีการค้นหาที่บันทึกไว้',
    ]);

    await page.goto('/procurement');
    await page
        .getByPlaceholder('ค้นหาด้วยคำสำคัญ, เลขที่โครงการ หรือชื่อหน่วยงาน...')
        .fill(announcement.title);

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

    await page.goto('/user/history');
    await expectListOrEmptyState(page, '[data-test="history-row"]', [
        'ยังไม่มีประวัติการดูประกาศ',
    ]);

    await page.getByRole('tab', { name: 'ประวัติการค้นหา' }).click();
    await expectListOrEmptyState(page, '[data-test="history-row"]', [
        'ยังไม่มีประวัติการค้นหา',
    ]);
});

test('registered user can view saved searches and toggle notification settings', async ({
    page,
}) => {
    resetDatabase();
    createUserFixtures();

    await loginAs(page, 'test@example.com', 'password');

    await page.goto('/user/saved-searches');
    await expect(
        page.locator('[data-test="saved-search-row"]').first(),
    ).toBeVisible();

    await page.goto('/user/notifications');
    const emailSwitch = page.locator(
        '[data-test="notification-channel-email"]',
    );
    await expect(emailSwitch).toBeVisible();

    await emailSwitch.click();
    await expect(page).toHaveURL(/\/user\/notifications/);

    await emailSwitch.click();
});
