import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const projectRoot = fileURLToPath(new URL('../..', import.meta.url));

function artisan(...args: string[]) {
    return execFileSync('php', ['artisan', ...args], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: process.env,
    });
}

function resetDatabase() {
    artisan('migrate:fresh', '--seed', '--force');
}

function createPublishedAnnouncement() {
    const output = artisan(
        'tinker',
        '--execute',
        `
            $announcement = \\App\\Models\\Announcement::factory()->published()->create([
                'title' => 'Playwright Guest Procurement Notice',
                'organization' => 'Khon Kaen Playwright Office',
                'category' => 'Construction',
                'method' => 'e-bidding',
                'status' => 'open',
                'budget' => 250000,
                'deadline' => now()->addDays(14)->format('Y-m-d'),
            ]);

            print(json_encode([
                'id' => $announcement->id,
                'title' => $announcement->title,
            ]));
        `,
    ).trim();

    return JSON.parse(output) as { id: number; title: string };
}

test('guest can search procurement and open an announcement detail page', async ({
    page,
}) => {
    resetDatabase();
    const announcement = createPublishedAnnouncement();

    await page.goto('/procurement');

    await expect(
        page.locator('[data-test="nav-saved-searches-link"]:visible'),
    ).toHaveCount(0);

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
    await expect(
        page.getByRole('heading', { name: announcement.title }),
    ).toBeVisible();
    await expect(
        page.getByText('รายละเอียดประกาศจัดซื้อจัดจ้าง'),
    ).toBeVisible();
});
