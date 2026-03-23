import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const databasePath = fileURLToPath(
    new URL('./database/database.sqlite', import.meta.url),
);
const sailDatabasePath = '/var/www/html/database/database.sqlite';
const phpTestingEnv = [
    'APP_ENV=testing',
    'DB_CONNECTION=sqlite',
    `DB_DATABASE=${databasePath}`,
    'SESSION_DRIVER=file',
    'CACHE_STORE=file',
    'QUEUE_CONNECTION=sync',
].join(' ');
const sailTestingExec = [
    './vendor/bin/sail',
    'exec',
    '-T',
    '-u',
    'sail',
    '-e',
    'APP_ENV=testing',
    '-e',
    'DB_CONNECTION=sqlite',
    '-e',
    `DB_DATABASE=${sailDatabasePath}`,
    '-e',
    'SESSION_DRIVER=file',
    '-e',
    'CACHE_STORE=file',
    '-e',
    'QUEUE_CONNECTION=sync',
    'laravel.test',
].join(' ');
const resetArtisanCommand = `${phpTestingEnv} php artisan`;

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
            `${resetArtisanCommand} optimize:clear && ` +
            `${resetArtisanCommand} migrate:fresh --seed && ` +
            `${phpTestingEnv} php artisan serve --host=127.0.0.1 --port=8000`,
        url: 'http://localhost:8000',
        reuseExistingServer: false,
        timeout: 120_000,
    },
});
