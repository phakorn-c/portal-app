import { defineConfig, devices } from '@playwright/test';

const webServerEnv = Object.fromEntries(
    Object.entries(process.env).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
);

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
            'php artisan optimize:clear && ' +
            'php artisan migrate:fresh --seed && ' +
            'php artisan serve --host=127.0.0.1 --port=8000',
        env: webServerEnv,
        url: 'http://localhost:8000',
        reuseExistingServer: false,
        timeout: 120_000,
    },
});
