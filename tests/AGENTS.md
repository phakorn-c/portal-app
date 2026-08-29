# TESTS KNOWLEDGE BASE

## OVERVIEW
Dual-stack testing: PestPHP for backend (Feature/Unit) and Playwright for browser (E2E).

## STRUCTURE
```
.
├── Feature/               # Backend domain tests (Pest)
│   ├── Admin/             # Admin panel logic
│   ├── Auth/              # Login, registration, 2FA
│   ├── Procurement/       # Search and announcement logic
│   ├── Settings/          # Profile and appearance
│   └── User/              # Saved searches and history
├── Unit/                  # Isolated logic tests
├── Browser/               # Playwright E2E tests
│   ├── support/           # Test environment helpers
│   └── *.spec.ts          # Browser test files
├── Pest.php               # Pest bootstrap & TestCase binding
└── TestCase.php           # Base Laravel test class
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add backend test | `tests/Feature/{Domain}/` | Use `it()` or `test()` syntax |
| Add browser test | `tests/Browser/` | Playwright `.spec.ts` files |
| Modify test setup | `tests/Pest.php` | Binds `RefreshDatabase` to `Feature/` |
| Browser helpers | `tests/Browser/support/` | Environment and auth helpers |
| DB Config | `phpunit.xml` | Uses `:memory:` SQLite |

## CONVENTIONS
- **Naming**: Backend files must end in `Test.php`. Browser files must end in `.spec.ts`.
- **Database**: `RefreshDatabase` trait is auto-applied to all `Feature/` tests via `Pest.php`.
- **Playwright**: Runs Chromium-only with a single worker. Auto-triggers `migrate:fresh --seed` on start.
- **Execution**:
  - Backend: `./vendor/bin/pest`
  - Browser: `npm run test:e2e`
- **Isolation**: Unit tests should not touch the database or boot the Laravel app.
- **CI**: Both suites run for pushes and pull requests targeting `develop`, `main`, `master`, `staging`, or `workos` via GitHub Actions.
