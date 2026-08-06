import { defineConfig, devices } from '@playwright/test';

import { testingEnv } from './tests/Browser/support/test-environment';

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
            'php artisan serve --host=127.0.0.1 --port=8000 --no-reload',
        env: testingEnv,
        url: 'http://localhost:8000',
        reuseExistingServer: false,
        timeout: 120_000,
    },
});
