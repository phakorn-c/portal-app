import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));

const defaultDatabasePath = fileURLToPath(
    new URL('../../../database/database.sqlite', import.meta.url),
);

export const databasePath =
    process.env.PLAYWRIGHT_DB_DATABASE ?? defaultDatabasePath;

export const sailDatabasePath = '/var/www/html/database/database.sqlite';

export const testingEnv = {
    APP_ENV: 'testing',
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: databasePath,
    SESSION_DRIVER: 'file',
    CACHE_STORE: 'file',
    QUEUE_CONNECTION: 'sync',
};

export const artisanEnv = {
    ...process.env,
    ...testingEnv,
};

export const phpTestingEnv = Object.entries(testingEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');

export const sailTestingArgs = [
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
];
