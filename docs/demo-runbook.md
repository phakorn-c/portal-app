# Demo Runbook: Three-Actor Presentation

This document provides the exact steps and commands for the three-actor demo of the Khon Kaen Procurement Docs Portal.

## 1. Environment Reset

Start Sail, provision only the PostgreSQL database named `testing`, prove the active database name, and only then reset it. The five environment variables on every PostgreSQL application command are mandatory; never aim this rehearsal at the development database.

```bash
./vendor/bin/sail up -d

./vendor/bin/sail exec pgsql sh -lc 'psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '\''testing'\''" | grep -qx 1 || createdb -U "$POSTGRES_USER" testing'

./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=database laravel.test php artisan tinker --execute='$db = \Illuminate\Support\Facades\DB::selectOne("select current_database() AS name")->name; throw_unless($db === "testing", "Refusing DB: ".$db);'

./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=database laravel.test php artisan migrate:fresh --seed --force
```

The guard throws and exits nonzero unless `current_database()` is exactly `testing`. Do not bypass it and do not use a non-Sail fallback for this rehearsal.

## 2. Actor Credentials

| Actor      | Email               | Password   | Role            |
| :--------- | :------------------ | :--------- | :-------------- |
| **Admin**  | `admin@example.com` | `password` | Administrator   |
| **Member** | `test@example.com`  | `password` | Registered User |
| **Guest**  | (No login)          | (N/A)      | Public Visitor  |

## 3. Demo Journeys

### Journey 1: Public Discovery (Guest)

**Goal:** Demonstrate search, filtering, and detail view for the general public.

1.  **Navigate** to `/procurement`.
2.  **Search** for "Smart Traffic" in the search bar.
3.  **Filter** by Category (Services) or Method (e-bidding).
4.  **Click** "ดูรายละเอียด" (View Details) on the "Khon Kaen Smart Traffic Upgrade" card.
5.  **Verify** the detail page shows project budget, location, and contact information.
6.  **Verify** the PDF attachment is visible in the TOR section and can be downloaded.

### Journey 2: Personalized Procurement (Member)

**Goal:** Demonstrate saved searches, search history, and dashboard features.

1.  **Login** as `test@example.com` / `password`.
2.  **Navigate** to `/procurement`.
3.  **Perform** a search (e.g., "School").
4.  **Click** the "บันทึกการค้นหา" (Save Search) button.
5.  **Navigate** to the User Dashboard (`/user/dashboard`).
6.  **Verify** the saved search appears in the "Saved Searches" card.
7.  **Navigate** to "Search History" (`/user/history`) and verify it shows the recent search activity.

### Journey 3: Governance & Content Management (Admin)

**Goal:** Demonstrate announcement management and user role control.

1.  **Login** as `admin@example.com` / `password`.
2.  **Navigate** to the Admin Dashboard (`/admin`).
3.  **Toggle** the publication status of an announcement (e.g., "Internal ERP Discovery Workshop").
4.  **Navigate** to User Management (`/admin/users`).
5.  **Change** a user's role (e.g., promote a registered user to admin or vice versa).
6.  **Verify** the change is reflected in the user list.

### Journey 4: Deterministic Extraction Review (Admin to Guest)

**Goal:** Demonstrate the implemented extraction contract and governance flow honestly, without presenting the deterministic fake as OCR.

1. **Login** as `admin@example.com` / `password` and open the Admin Dashboard (`/admin`).
2. **Upload** a PDF on an announcement to create a pending extraction and database-queue job. The production boundary is replaceable, but the current extractor is filename-driven deterministic fake data.
3. **Review ID 6**: open announcement `6` and its review link for `kku-text-demo.pdf`; inspect candidate fields, confidence, warnings, and private raw text.
4. **Correct and approve ID 6**: change at least one candidate-backed field and approve. Confirm approval does not publish the announcement.
5. **Review seeded ID 7**: it is already approved. Use the separate announcement publication control to publish it.
6. **Switch to a guest/public view** and open announcement `7`. Confirm source/reference and the deterministic-demo notice appear, while extraction status, method, candidate, confidence, warnings, raw text, and errors do not.
7. **Exercise recovery with ID 8**: the seeded failure shows `DEMO_EXTRACTION_FAILURE`; retry reaches a terminal failed state again under the deterministic fixture. The retry ceiling is three attempts.

The seeded `https://demo.invalid/...` values are demonstration-only and are not official sources. Real OCR, live scraping, RAG, and accuracy evaluation are pending future work.

## 4. Smoke-Rehearsal Proof

### 4.1 PostgreSQL database-queue proof

After the guarded reset in section 1, run these Todo-4 commands verbatim:

```bash
./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=database laravel.test php artisan tinker --execute='$a = \App\Models\Announcement::findOrFail(1)->attachments()->firstOrFail(); $e = \App\Models\DocumentExtraction::firstOrCreate(["announcement_attachment_id" => $a->id], ["status" => "pending"]); throw_unless(\App\Jobs\ProcessDocumentExtraction::dispatchFor($e->id), "Dispatch refused");'

./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=database laravel.test php artisan tinker --execute='throw_unless(\Illuminate\Support\Facades\DB::table("jobs")->count() === 1, "Expected one queued job");'

./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=database laravel.test php artisan queue:work database --queue=default --stop-when-empty --tries=1 --timeout=120

./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=database laravel.test php artisan tinker --execute='$e = \App\Models\DocumentExtraction::query()->whereHas("attachment", fn($q) => $q->where("announcement_id", 1))->firstOrFail(); throw_unless($e->status === "review" && $e->error_message === null, "Extraction did not succeed"); throw_unless(\Illuminate\Support\Facades\DB::table("jobs")->count() === 0 && \Illuminate\Support\Facades\DB::table("failed_jobs")->count() === 0, "Queue failure detected");'
```

The queued-row assertion must see exactly one job. The terminal assertion requires `review`, a null error, and empty `jobs` and `failed_jobs` tables. Re-run the guard and guarded PostgreSQL reset afterward so `testing` ends at the deterministic 8 announcements / 4 attachments / 3 extractions state.

### 4.2 SQLite reset used before every verification gate

This is the container equivalent of `tests/Browser/support/test-environment.ts`: the file database is reset/reseeded and its file cache is cleared immediately before each command in section 4.3.

```bash
./vendor/bin/sail exec -e APP_ENV=testing -e BROADCAST_CONNECTION=null -e CACHE_STORE=file -e DB_CONNECTION=sqlite -e DB_DATABASE=/var/www/html/database/playwright.sqlite -e DB_URL= -e MAIL_MAILER=array -e QUEUE_CONNECTION=sync -e SESSION_DRIVER=file laravel.test php artisan migrate:fresh --seed --force
./vendor/bin/sail exec -e APP_ENV=testing -e BROADCAST_CONNECTION=null -e CACHE_STORE=file -e DB_CONNECTION=sqlite -e DB_DATABASE=/var/www/html/database/playwright.sqlite -e DB_URL= -e MAIL_MAILER=array -e QUEUE_CONNECTION=sync -e SESSION_DRIVER=file laravel.test php artisan cache:clear
```

### 4.3 Verification gates

Run the two SQLite commands above before **each** command below. The PostgreSQL-focused command additionally requires the section-1 name guard and reset; restore PostgreSQL with the guarded reset afterward.

```bash
./vendor/bin/sail composer test

./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=database laravel.test php artisan test --filter='ProcessDocumentExtraction|DemoAnnouncementSeeder|AttachmentReconciliation|ExtractionReview|PublicExtractionDataIsolation'

./vendor/bin/sail npm run types

./vendor/bin/sail npm run build

./vendor/bin/sail npm run format:check

./vendor/bin/sail npx eslint .

./vendor/bin/sail npx playwright test --workers=1 --trace=on
```

### Historical local results — 2026-08-14 rehearsal

- Sail startup, PostgreSQL provisioning/name guard/reset, producer, exactly-one-row assertion, worker, and terminal assertion: all exited 0. The worker processed one `ProcessDocumentExtraction` job; the terminal state was `review`, error was null, and both queue tables were empty.
- Full backend: **265 passed / 1,934 assertions**, exit 0.
- PostgreSQL-focused queue/recovery/review/isolation set shown above: **77 passed / 943 assertions**, exit 0.
- Types: exit 0. Production build: exit 0, 2,864 modules transformed in 4.50 seconds.
- `format:check`: exit 0. Repository ESLint: exit 0 with no diagnostics.
- Chromium Playwright: **15 passed** using one worker with trace-on, exit 0 in 30.3 seconds. This includes 3 extraction-review cases and 1 source-attribution case.
- Final PostgreSQL guard/reset/count assertion: exit 0 at **8 announcements / 4 attachments / 3 extractions**.
- Limitation observed during this run: a broader PostgreSQL filter that also included all `DocumentExtraction` constraint tests produced **87 passes and 1 failure**. The expected duplicate-key exception aborts PostgreSQL's surrounding test transaction, so the test's subsequent count query receives SQLSTATE `25P02`; the same repository-wide SQLite suite remains green. This is a test-harness portability limitation, not evidence of real OCR or extraction accuracy.

The command transcripts and traces from this rehearsal were local, ignored agent-workspace artifacts. They are not tracked repository evidence. Re-run the commands in section 4.3 to produce current evidence for a review.

## 5. Fallback Notes

- **Database Reset:** If PostgreSQL becomes inconsistent, rerun the exact name guard and guarded reset from section 1. Never reset without proving the database is `testing`.
- **Chromium:** Playwright uses bundled Chromium. If the live browser is unavailable, run the trace-on command from section 4.3 and present its trace; do not substitute a browser that has not passed the rehearsal.
- **2FA:** Two-Factor Authentication is implemented but excluded from the live walkthrough to save time.
- **OCR/Scraping:** The extraction contract and review workflow use deterministic fake data. Real OCR, scraping, RAG, and WER/F1 evaluation remain future work.

## 6. Recovery

- **Storage reconciliation:** preview aged managed-root orphans with `./vendor/bin/sail artisan procurement:reconcile-attachments` (dry-run by default). After reviewing its output, delete eligible files with `./vendor/bin/sail artisan procurement:reconcile-attachments --delete`. The minimum age is 24 hours; referenced, fresh, legacy, outside-root, and symlinked paths are protected.
- **Stale processing:** processing becomes recoverable after 360 seconds. The same `ProcessDocumentExtraction::dispatchFor()` path used by retry resets stale state under a row lock and queues a fresh token; a non-stale row is not taken over.
- **Retry ceiling:** use the admin review page's retry action for `review` or `failed` rows. Attempt 3 is the hard ceiling; a stale third attempt is finalized as failed and no fourth dispatch occurs.
- **Failed demo fixture:** seeded ID 8 is intentionally deterministic failure evidence. Retry may fail again by design; do not describe it as an OCR outage.

## 7. Deployment Limitations

This repository documents local Sail operation, deterministic demo data, and CI validation. It does not currently include a production or staging deployment workflow, hosting configuration, secrets contract, migration rollback procedure, supervised queue-worker configuration, or production observability setup. A successful local build or rehearsal is not evidence that a production-ready or deployed staging environment exists.
