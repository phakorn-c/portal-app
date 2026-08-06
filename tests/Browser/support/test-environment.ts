import { execFileSync } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));

const defaultDatabasePath = fileURLToPath(
    new URL('../../../database/playwright.sqlite', import.meta.url),
);

export const databasePath =
    process.env.PLAYWRIGHT_DB_DATABASE ?? defaultDatabasePath;

closeSync(openSync(databasePath, 'a'));

export const testingEnv = {
    APP_ENV: 'testing',
    BROADCAST_CONNECTION: 'null',
    CACHE_STORE: 'file',
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: databasePath,
    DB_URL: '',
    MAIL_MAILER: 'array',
    QUEUE_CONNECTION: 'sync',
    SESSION_DRIVER: 'file',
} satisfies NodeJS.ProcessEnv;

export const artisanEnv = {
    ...process.env,
    ...testingEnv,
};

export function artisan(...args: string[]): string {
    return execFileSync('php', ['artisan', ...args], {
        cwd: projectRoot,
        encoding: 'utf8',
        env: artisanEnv,
    });
}

export function resetDatabase(): void {
    artisan('migrate:fresh', '--seed', '--force');
    artisan('cache:clear');
}
