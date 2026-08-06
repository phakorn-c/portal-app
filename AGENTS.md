# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-16
**Commit:** 9f4510d
**Branch:** main

## OVERVIEW

Thai public-procurement portal built on Laravel 12 + Inertia.js + React 19. Frontend lives under `resources/js/` (not `src/`), uses Tailwind CSS v4, shadcn/ui, and Wayfinder for typed routes. Backend is domain-organized into `Admin`, `Procurement`, `User`, and `Settings` groups.

## STRUCTURE

```
.
├── app/                     # PHP backend (domain-grouped controllers, models, support)
├── bootstrap/               # Laravel app bootstrap
├── config/                  # Laravel config
├── database/                # Migrations, factories, seeders
├── docs/                    # Demo runbook and project docs
├── public/                  # Laravel front controller
├── resources/               # Frontend assets + Blade host
│   ├── css/app.css          # Tailwind v4 theme + custom CSS
│   └── js/                  # React/Inertia app, pages, components, hooks
├── routes/                  # web.php + settings.php split
├── tests/                   # Pest (backend) + Playwright (browser)
├── compose.yaml             # Laravel Sail dev stack
├── composer.json            # PHP deps + Pint/composer scripts
├── eslint.config.js         # Flat ESLint config
├── package.json             # Vite/React scripts
├── playwright.config.ts     # E2E test config
└── vite.config.ts           # Vite + Laravel + React + Tailwind v4
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add a route | `routes/web.php` | Split files: `routes/settings.php` is included from web |
| Add a page | `resources/js/pages/{domain}/` | Inertia resolves `pages/<name>.tsx` via `import.meta.glob` |
| Add a UI component | `resources/js/components/ui/` | shadcn/ui-style Radix components; import from `@/components/ui/*` |
| Add a backend controller | `app/Http/Controllers/{Domain}/` | One controller per domain: Admin, Procurement, User, Settings |
| Add a model | `app/Models/` | Eloquent models with factories |
| Add a service/query builder | `app/Support/{Domain}/` | Domain-specific support classes (e.g., `AnnouncementSearch`) |
| Add a frontend hook | `resources/js/hooks/` | React hooks; theme handling lives in `use-appearance.tsx` |
| Add shared types | `resources/js/types/` | Barrel export via `resources/js/types/index.ts` |
| Add a backend test | `tests/Feature/` | Pest syntax; `RefreshDatabase` auto-applied via `tests/Pest.php` |
| Add a browser test | `tests/Browser/` | Playwright `.spec.ts` files |
| Change global layout | `resources/js/layouts/` | `app-layout.tsx`, `auth-layout.tsx`, settings layout |
| Change theme/colors | `resources/css/app.css` | Tailwind v4 `@theme` block; Sarabun font loaded from Google Fonts |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `createInertiaApp` | bootstrap | `resources/js/app.tsx` | Client React/Inertia entry |
| `createServer` | bootstrap | `resources/js/ssr.tsx` | SSR Inertia entry |
| `AppServiceProvider` | class | `app/Providers/AppServiceProvider.php` | Global defaults: CarbonImmutable, destructive-command guard, password rules, ensures admin exists |
| `SearchController` | class | `app/Http/Controllers/Procurement/SearchController.php` | Main procurement search page; stores history |
| `AnnouncementSearch` | class | `app/Support/Procurement/AnnouncementSearch.php` | Query builder for filtered/paginated announcements |
| `FilterState` | class | `app/Support/Procurement/FilterState.php` | Validation/normalization for search criteria |
| `User` | class | `app/Models/User.php` | Auth model; roles: `admin`, `registered` |
| `ProcurementSearch` | component | `resources/js/pages/procurement/search.tsx` | Home page (`/`); main search UI |
| `useAppearance` | hook | `resources/js/hooks/use-appearance.tsx` | Light/dark/system theme + SSR cookie |
| `cn` | function | `resources/js/lib/utils.ts` | `clsx` + `tailwind-merge` utility used everywhere |

## CONVENTIONS

- **Frontend source root is `resources/js/`**, not `src/`. Path alias `@/*` maps to `./resources/js/*`.
- **ESLint flat config** (`eslint.config.js`): no `.eslintrc*`. Enforces sorted `import/order`, `consistent-type-imports`, and turns off `react/react-in-jsx-scope`/`react/prop-types`/`react/no-unescaped-entities`.
- **Tailwind v4 configured in CSS**: `resources/css/app.css` uses `@import 'tailwindcss'`, `@theme`, and `@source`. No standalone `tailwind.config.*`.
- **Prettier targets only `resources/`**: `npm run format` runs `prettier --write resources/`. `resources/js/components/ui/*` is excluded by `.prettierignore`.
- **PHP linting uses Laravel Pint** (`pint.json` preset: `laravel`); `composer lint` runs `pint --parallel`.
- **shadcn/ui aliases** (`components.json`): `@/components/ui`, `@/lib`, `@/hooks`, `@/components`.
- **Domain route grouping**: `web.php` groups routes by `admin`, `procurement`, `user`, and `settings` (the latter split to `routes/settings.php`).
- **Controllers are domain-nested**: `app/Http/Controllers/{Admin,Procurement,User,Settings}/`.
- **Auth pages wired via Fortify** in `app/Providers/FortifyServiceProvider.php`, not in `routes/web.php`.
- **Composer `dev` script orchestrates the full stack**: `php artisan serve`, `queue:listen`, `pail`, and `npm run dev` via `concurrently`.

## ANTI-PATTERNS (THIS PROJECT)

- **Do not add a standalone `tailwind.config.*` file.** Tailwind v4 is configured inside `resources/css/app.css`.
- **Do not use `src/` for frontend code.** The project uses `resources/js/`.
- **Do not format `resources/js/components/ui/*`** — they are excluded from Prettier to match shadcn/ui conventions.
- **Do not route auth pages in `routes/web.php`.** Use `FortifyServiceProvider` for login/register/reset/2FA mapping.
- **Do not add destructive commands in production.** `AppServiceProvider` prohibits them; `DB::prohibitDestructiveCommands(app()->isProduction())`.
- **Do not use `php artisan route:list` as a map of all pages.** Some pages are rendered dynamically via Fortify and Inertia page resolution.
- **TODO present in `routes/web.php`:** `// TODO: add role:admin middleware - Task 3` on the `admin/users` group — already has the middleware; verify before acting on it.

## UNIQUE STYLES

- **Thai-localized UI**: Copy and dates use Thai locale (`th-TH`) and Bangkok timezone (`Asia/Bangkok`). Budgets are formatted as `฿ {amount}`.
- **Status-driven card styling**: `procurement/search.tsx` applies opacity and hover styles based on announcement status (`open`, `urgent`, `closing`, `closed`).
- **Custom save-search dialog**: The search page posts directly to `/user/saved-searches` with manually gathered CSRF tokens instead of using Inertia forms.
- **Theme system**: `use-appearance.tsx` uses a global module-level `currentAppearance` state synchronized with a cookie for SSR and `localStorage` for client persistence.
- **Wayfinder enabled**: `vite.config.ts` has `wayfinder({ formVariants: true })` for typed Inertia routes/links.
- **React compiler**: Babel plugin `babel-plugin-react-compiler` is enabled in Vite React plugin.
- **Playwright auto-starts the app**: `playwright.config.ts` runs `optimize:clear`, `migrate:fresh --seed`, and `php artisan serve` before tests.

## COMMANDS

```bash
# Install & setup
composer setup                  # composer install, .env, key, migrate, npm install, build

# Development
composer dev                    # server + queue + pail + vite concurrently
npm run dev                     # Vite dev server only
php artisan serve             # Laravel server only

# Build
npm run build                   # Vite production build
npm run build:ssr               # Build client + SSR

# Lint / Format
npm run lint                    # ESLint --fix
npm run format                  # Prettier --write resources/
npm run format:check            # Prettier --check resources/
npm run types                   # tsc --noEmit
composer lint                   # Pint --parallel
composer test:lint              # Pint --parallel --test

# Test
./vendor/bin/pest               # Backend tests
npm run test:e2e                # Playwright browser tests

# Sail
vendor/bin/sail up              # Laravel Sail (compose.yaml)
```

## NOTES

- **No monorepo**: single app, no workspaces/Turbo/Nx.
- **SSR enabled**: `resources/js/ssr.tsx` + `composer dev:ssr` for SSR dev.
- **Home route is `/procurement/search`**: `routes/web.php` renders `procurement/search` for `/`.
- **Roles are simple strings** (`admin`, `registered`) checked via `role:admin` middleware and `isAdmin()`/`isRegistered()` on `User`.
- **Database**: Sail defaults to Postgres; tests use SQLite (PHPUnit in-memory, Playwright file-based via `tests/Browser/support/test-environment.ts`).
- **CI runs PHP 8.4 and 8.5** in `.github/workflows/tests.yml` and also runs Playwright + Pest.
- **Lint CI auto-formats** (`npm run format`) but does not auto-commit (auto-commit action is commented out).
- **TypeScript includes only `resources/js/`**: `tsconfig.json` `include` is scoped to `resources/js/**/*.ts`, `**.tsx`, `**.d.ts`.
