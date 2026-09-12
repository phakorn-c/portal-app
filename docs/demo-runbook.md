# Demo Runbook: Three-Actor Presentation

This document provides the exact steps and commands for the three-actor demo of the Khon Kaen Procurement Docs Portal.

## Day 5 Real-Data Rehearsal (Canonical)

This is the canonical cross-repository demo path. It uses the existing 90-record OCR corpus, not a live scrape, so source-site availability cannot interrupt the presentation. The upload path described later still uses `FakeDocumentExtractor`; imported records instead arrive with `document_extractions.method = portal-ocr` and do not run that fake.

### Prerequisites and directories

- Docker Desktop, Laravel Sail dependencies, Python 3.10+, and `uv` are installed.
- `portal-app/` and `portal-ocr/` are sibling directories.
- `portal-ocr/.env` exists and `uv sync --locked --extra dev` has completed.
- The existing corpus contains `portal-ocr/outputs/output.json` and 90 matching PDFs under `portal-ocr/data/pdfs/`.
- Run each block from the directory named immediately above it. Do not run a destructive database command unless the guard below proves the active database is exactly `testing`.

### 1. Regenerate the portal export without changing raw OCR

From `portal-ocr/`:

```bash
shasum data/ocr_texts/*.txt | shasum
uv run --locked python portal_export.py
jq '{rows:length,drafts:([.[]|select(.publication_status=="draft" and .published_at==null)]|length),with_pdf:([.[]|select(.pdf_path!="")]|length),with_raw_text:([.[]|select(has("raw_text"))]|length),with_flags:([.[]|select(has("validation_flags"))]|length)}' outputs/portal_import.json
printf 'attachments=' && ls outputs/portal_attachments | wc -l
shasum data/ocr_texts/*.txt | shasum
```

Measured on 2026-09-11:

```text
exported 90 portal rows
rows=90, drafts=90, with_pdf=90, with_raw_text=0, with_flags=0
attachments=90
raw OCR aggregate SHA-1 before and after: 47c8a4eaf97c7de5d37f9701a42896bb6b5b1df9
```

The two raw-OCR hashes must match. `portal_export.py` replaces only generated `outputs/portal_import.json`, `outputs/portal_import.sql`, and `outputs/portal_attachments/`; it does not write `data/ocr_texts/`. The current export does not include separate `raw_text` or `validation_flags` keys, so imported review rows have null raw text and empty warnings. Do not describe the cleaned summary in `description` as full raw OCR.

### 2. Stage the sibling export inside Sail

From `portal-app/`:

```bash
./vendor/bin/sail up -d
docker compose exec laravel.test mkdir -p /tmp/portal-demo
docker compose cp ../portal-ocr/outputs/portal_import.json laravel.test:/tmp/portal-demo/portal_import.json
docker compose cp ../portal-ocr/outputs/portal_attachments laravel.test:/tmp/portal-demo/portal_attachments
```

The JSON and `portal_attachments/` directory must remain siblings. The importer rejects absolute paths, traversal, missing/unreadable files, non-PDF signatures, and duplicate PDF content.

### 3. Guard and reset only PostgreSQL `testing`

```bash
./vendor/bin/sail exec pgsql sh -lc 'psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '\''testing'\''" | grep -qx 1 || createdb -U "$POSTGRES_USER" testing'

./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=sync laravel.test php artisan tinker --execute='$db = \Illuminate\Support\Facades\DB::selectOne("select current_database() AS name")->name; throw_unless($db === "testing", "Refusing DB: ".$db);'

./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=sync laravel.test php artisan migrate:fresh --seed --force
```

The seed baseline is 8 announcements, 4 attachments, and 3 extractions.

### 4. Import and measure the current corpus

```bash
./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=sync laravel.test php artisan portal:import /tmp/portal-demo/portal_import.json
```

Current expected terminal output is:

```text
Import complete: imported=70 skipped=0 errors=20
```

The command intentionally exits nonzero when any row is rejected. The 20 errors are all `The selected organization is invalid.` at export rows 8, 15, 22, 28, 37, 38, 43, 44, 46, 47, 50, 57, 61, 65, 71, 73, 77, 78, 85, and 86. The affected contract is `portal-ocr/portal_ocr/adapters/portal_serialization.py` `organization` output versus `portal-app/app/Support/Procurement/Taxonomy.php`. Several values contain OCR-contaminated department text; do not coerce or invent organization/contact facts during the demo.

Confirm the accepted rows are still private drafts and capture one runtime ID tuple:

```bash
./vendor/bin/sail exec -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=sync laravel.test php artisan tinker --execute='$a=\App\Models\Announcement::where("source_reference","kku_plan:201b887d_kku_plan")->firstOrFail(); $attachment=$a->attachments()->firstOrFail(); $e=$attachment->extraction()->firstOrFail(); throw_unless($a->publication_status === "draft" && $a->published_at === null && $e->status === "review" && $e->method === "portal-ocr", "Unsafe import state"); dump(["announcement_id"=>$a->id,"attachment_id"=>$attachment->id,"extraction_id"=>$e->id,"title"=>$a->title]);'
```

This row is suitable for the safety-sensitive walkthrough because source output row 90 contains both an explicitly extracted `budget = 1180000.00` and `end_date = 23/12/2568`; it does not depend on the exporter’s missing-value fallbacks. On the 2026-09-11 clean reset it returned announcement `78`, attachment `74`, and extraction `73`. IDs are runtime values; use the command output instead of assuming those numbers after a different seed/import.

### 5. Review, approve, and publish in the admin UI

Expose the guarded `testing` database on a separate demo port while leaving the normal Sail app untouched:

```bash
DEMO_WEB_CONTAINER=$(APP_PORT=8001 VITE_PORT=5174 docker compose run -d --rm --service-ports -e APP_ENV=testing -e DB_CONNECTION=pgsql -e DB_HOST=pgsql -e DB_DATABASE=testing -e QUEUE_CONNECTION=sync laravel.test php artisan serve --host=0.0.0.0 --port=80 --no-reload)
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:8001/procurement
```

Expect HTTP `200`, then:

1. Open `http://localhost:8001/login` and sign in as `admin@example.com` / `password`.
2. Open `/admin/announcements/{announcement_id}/extractions/{extraction_id}` using the IDs printed above.
3. Inspect the real candidate and original filename, make only source-supported corrections, and click `อนุมัติข้อมูลที่แก้ไข`.
4. Confirm the page shows `อนุมัติแล้ว`. Approval changes extraction `review -> approved` but the announcement remains `draft` with `published_at = null`.
5. Return to `/admin`. Imported rows with matching timestamps are ordered by descending ID, so this selected record is on the first page; use the title filter and click its publish control. This explicit action changes `draft -> published` and sets `published_at`.

### 6. Verify the guest search, detail, and original PDF

Log out, then:

1. Search `/procurement?query=เครื่องทดสอบความชัดเจน` and confirm the imported title appears.
2. Open `/procurement/announcements/{announcement_id}` and confirm the Thai budget (`฿ 1,180,000.00`), source date (`23 ธันวาคม 2568`), organization, and `201b887d_kku_plan.pdf` attachment. This corpus row has a blank `source_url`, so the public page correctly omits linked source attribution; do not invent one.
3. Open `/procurement/announcements/{announcement_id}/pdf/{attachment_id}` and use the download link ending in `/download`.
4. Confirm the inline response is HTTP `200`, `Content-Type: application/pdf`, and its bytes match the exported original:

```bash
curl -sS -o /tmp/portal-demo-pdf-check.pdf http://localhost:8001/procurement/announcements/{announcement_id}/pdf/{attachment_id}
shasum /tmp/portal-demo-pdf-check.pdf ../portal-ocr/outputs/portal_attachments/201b887d_kku_plan.pdf
```

The two hashes must match. The 2026-09-11 rehearsal produced `f680689ba8da7dd93fb29a25ede35110b175fc4e` for both and no guest-page browser console errors. Stop the temporary server afterward with `docker stop "$DEMO_WEB_CONTAINER"`.

### Recovery and known blocker

- **Partial import:** after the measured 70/20 result, rerunning without reset yields `imported=0 skipped=70 errors=20`; accepted rows are idempotently skipped. Use the guarded reset before another clean attempt.
- **Full 90-row acceptance blocker:** fix and test the exporter’s organization mapping against Laravel taxonomy upstream. After that dependency lands, repeat from step 1 and update the expected count; do not silently edit generated JSON.
- **Draft safety:** approval never publishes. If a record is visible to guests before the explicit publish action, stop the demo and run the guarded reset.
- **Raw OCR:** compare the aggregate hashes again after recovery. Never edit or replace `portal-ocr/data/ocr_texts/` to make an import pass.
- **Temporary server:** if port 8001 is occupied, stop the prior `$DEMO_WEB_CONTAINER`; do not point the normal port-80 app at `testing` implicitly.

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
