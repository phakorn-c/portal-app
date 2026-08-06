import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { artisan, resetDatabase } from './support/test-environment';

function evidencePath(fileName: string) {
    const evidenceDirectory = fileURLToPath(
        new URL('../../.sisyphus/evidence/', import.meta.url),
    );

    mkdirSync(evidenceDirectory, { recursive: true });

    return fileURLToPath(
        new URL(`../../.sisyphus/evidence/${fileName}`, import.meta.url),
    );
}

function createUserFixtures() {
    const output = artisan(
        'tinker',
        '--execute',
        `
            $announcement = \\App\\Models\\Announcement::factory()->published()->create([
                'title' => 'Playwright Auth Procurement Notice',
                'organization' => 'องค์การบริหารส่วนจังหวัด',
                'category' => 'construction',
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

    const jsonPayload = output.match(/\{[\s\S]*\}$/)?.[0];

    if (!jsonPayload) {
        throw new Error(`Unable to parse fixture JSON payload: ${output}`);
    }

    return JSON.parse(jsonPayload) as { id: number; title: string };
}

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

async function selectOption(
    page: Page,
    container: Locator,
    index: number,
    optionLabel: string,
) {
    await container.getByRole('combobox').nth(index).click();
    await page.getByRole('option', { name: optionLabel, exact: true }).click();
}

async function createAdminAnnouncement(page: Page, title: string) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
        await page.goto('/admin');
        await page.getByRole('button', { name: 'เพิ่มประกาศใหม่' }).click();

        const announcementDialog = page.getByRole('dialog');

        await expect(
            announcementDialog.getByRole('heading', {
                name: 'เพิ่มประกาศใหม่',
            }),
        ).toBeVisible();

        await announcementDialog.locator('#title').fill(title);
        await announcementDialog
            .locator('#description')
            .fill('Playwright alert flow announcement');
        await selectOption(page, announcementDialog, 0, 'เทศบาลนครขอนแก่น');
        await announcementDialog.locator('#budget').fill('450000');
        await announcementDialog.locator('#deadline').fill('2031-12-31');

        const createResponsePromise = page.waitForResponse(
            (response) =>
                response.url().includes('/admin/announcements') &&
                response.request().method() === 'POST',
        );

        await announcementDialog
            .getByRole('button', { name: 'บันทึก' })
            .click();

        const status = (await createResponsePromise).status();

        if ([302, 303].includes(status)) {
            await expect(announcementDialog).not.toBeVisible();

            return;
        }

        if (status !== 500) {
            throw new Error(`Unexpected announcement create status: ${status}`);
        }
    }

    throw new Error('Unable to create admin announcement');
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
    createUserFixtures();
    const seededAnnouncementTitle = 'Khon Kaen Smart Traffic Upgrade';

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
        .fill(seededAnnouncementTitle);
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();

    const announcementCard = page.locator('article').filter({
        has: page.getByRole('heading', { name: seededAnnouncementTitle }),
    });

    await expect(announcementCard).toHaveCount(1);
    await announcementCard
        .getByRole('link', { name: /ดูรายละเอียด|ดูผลการจัดซื้อ/ })
        .click();
    await expect(page).toHaveURL(/\/procurement\/announcements\/\d+$/);

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

    await emailSwitch.click({ force: true });
    await expect(page).toHaveURL(/\/user\/notifications/);

    await emailSwitch.click({ force: true });
});

test('registered user can save current procurement search', async ({
    page,
}) => {
    resetDatabase();
    const announcement = createUserFixtures();
    const searchName = `Demo Saved Search ${Date.now()}`;

    await loginAs(page, 'test@example.com', 'password');

    await page.goto('/procurement');
    await expect(
        page.locator('[data-test="procurement-save-search-trigger"]'),
    ).toBeVisible();

    await page
        .getByPlaceholder('ค้นหาด้วยคำสำคัญ, เลขที่โครงการ หรือชื่อหน่วยงาน...')
        .fill(announcement.title);
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();

    await page.locator('[data-test="procurement-save-search-trigger"]').click();
    await page
        .locator('[data-test="procurement-save-search-name"]')
        .fill(searchName);

    const alertToggle = page.locator(
        '[data-test="procurement-save-search-alert-enabled"]',
    );
    await expect(alertToggle).toHaveAttribute('data-state', 'checked');
    await alertToggle.click();
    await expect(alertToggle).toHaveAttribute('data-state', 'unchecked');
    await alertToggle.click();
    await expect(alertToggle).toHaveAttribute('data-state', 'checked');

    const saveResponsePromise = page.waitForResponse(
        (response) =>
            response.url().includes('/user/saved-searches') &&
            response.request().method() === 'POST',
    );

    await page.locator('[data-test="procurement-save-search-submit"]').click();
    expect((await saveResponsePromise).status()).toBe(201);

    await page.goto('/user/saved-searches');

    const savedSearchRow = page
        .locator('[data-test="saved-search-row"]')
        .filter({
            has: page.getByRole('heading', { name: searchName }),
        });

    await expect(savedSearchRow).toHaveCount(1);
    await expect(savedSearchRow).toContainText('เปิดแจ้งเตือน');

    await page.screenshot({
        path: evidencePath('task-4-save-search.png'),
        fullPage: true,
    });

    await savedSearchRow
        .locator('[data-test="run-saved-search-button"]')
        .click();

    await expect(page).toHaveURL(/\/procurement\?/);
    expect(new URL(page.url()).searchParams.get('query')).toBe(
        announcement.title,
    );
    await expect(
        page.getByPlaceholder(
            'ค้นหาด้วยคำสำคัญ, เลขที่โครงการ หรือชื่อหน่วยงาน...',
        ),
    ).toHaveValue(announcement.title);
});

test('guest cannot save procurement search from public results', async ({
    page,
}) => {
    resetDatabase();

    await page.goto('/procurement');
    await expect(
        page.locator('[data-test="procurement-save-search-trigger"]'),
    ).toHaveCount(0);

    await page.screenshot({
        path: evidencePath('task-4-save-search-guest.png'),
        fullPage: true,
    });
});

test('admin publish creates notification for saved search', async ({
    page,
}) => {
    resetDatabase();

    const uniqueSuffix = Date.now();
    const announcementTitle = `Playwright Alert Flow ${uniqueSuffix}`;
    const searchName = `Alert Flow ${uniqueSuffix}`;

    await loginAs(page, 'test@example.com', 'password');

    await page.goto('/procurement');
    await page
        .getByPlaceholder('ค้นหาด้วยคำสำคัญ, เลขที่โครงการ หรือชื่อหน่วยงาน...')
        .fill(announcementTitle);
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
    await page.locator('[data-test="procurement-save-search-trigger"]').click();
    await page
        .locator('[data-test="procurement-save-search-name"]')
        .fill(searchName);

    const alertToggle = page.locator(
        '[data-test="procurement-save-search-alert-enabled"]',
    );
    await expect(alertToggle).toHaveAttribute('data-state', 'checked');

    const saveResponsePromise = page.waitForResponse(
        (response) =>
            response.url().includes('/user/saved-searches') &&
            response.request().method() === 'POST',
    );

    await page.locator('[data-test="procurement-save-search-submit"]').click();
    expect((await saveResponsePromise).status()).toBe(201);

    await page.goto('/user/saved-searches');

    const savedSearchRow = page
        .locator('[data-test="saved-search-row"]')
        .filter({
            has: page.getByRole('heading', { name: searchName }),
        });

    await expect(savedSearchRow).toHaveCount(1);
    await expect(savedSearchRow).toContainText('เปิดแจ้งเตือน');

    await logout(page);

    await loginAs(page, 'admin@example.com', 'password');
    await createAdminAnnouncement(page, announcementTitle);

    await page.getByPlaceholder('ค้นหาประกาศ...').fill(announcementTitle);

    const announcementRow = page.locator('tbody tr').filter({
        has: page.getByText(announcementTitle, { exact: true }),
    });

    await expect(announcementRow).toHaveCount(1);

    const publishResponsePromise = page.waitForResponse(
        (response) =>
            response.url().includes('/publish') &&
            response.request().method() === 'PATCH',
    );

    await announcementRow
        .locator('[data-test="admin-announcement-publish"]')
        .click();
    expect([302, 303]).toContain((await publishResponsePromise).status());

    await expect(
        announcementRow.locator('[data-test="admin-announcement-publish"]'),
    ).toHaveAttribute('title', 'ซ่อน');

    await logout(page);

    await loginAs(page, 'test@example.com', 'password');
    await page.goto('/user/notifications');

    const alertRow = page
        .locator('[data-test="notification-alert-row"]')
        .filter({
            has: page.getByText(searchName, { exact: true }),
        });

    await expect(alertRow).toHaveCount(1);
    await expect(alertRow).not.toContainText('ยังไม่เคยแจ้งเตือน');
    await expect(
        page.getByText(announcementTitle, { exact: true }),
    ).toBeVisible();
    await expect(
        page.getByText(`จากการค้นหา: ${searchName}`, { exact: true }),
    ).toBeVisible();

    await page.screenshot({
        path: evidencePath('task-5-alert-flow.png'),
        fullPage: true,
    });
});
