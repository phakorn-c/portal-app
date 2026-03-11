import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const databasePath = fileURLToPath(
    new URL('./database/database.sqlite', import.meta.url),
);
const phpTestingEnv = [
    'APP_ENV=testing',
    'DB_CONNECTION=sqlite',
    `DB_DATABASE=${databasePath}`,
    'SESSION_DRIVER=file',
    'CACHE_STORE=file',
    'QUEUE_CONNECTION=sync',
].join(' ');

export default defineConfig({
    testDir: './tests/Browser',
    fullyParallel: false,
    workers: 1,
    use: {
        baseURL: 'http://localhost:8000',
        headless: true,
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],
    webServer: {
        command:
            `${phpTestingEnv} php artisan optimize:clear && ` +
            `${phpTestingEnv} php artisan migrate:fresh --seed && ` +
            `${phpTestingEnv} php artisan serve --port=8000`,
        url: 'http://localhost:8000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
