# Khon Kaen Procurement Docs Portal

A Thai public-procurement demonstration portal built with Laravel 12, Inertia.js, React 19, PostgreSQL, and Tailwind CSS. It supports public announcement discovery, member search history and saved searches, administrative publication controls, PDF attachments, and an admin-only extraction review workflow.

## Demo Scope

Document extraction is currently a deterministic, filename-driven fake behind a replaceable interface. It does not inspect PDF bytes and must not be described as OCR. Real OCR, live procurement scraping, RAG/vector search, and WER/F1 evaluation remain future work. Seeded `demo.invalid` URLs are non-official demo identifiers.

Approval of extracted candidate data is separate from announcement publication. Extraction candidates, confidence values, warnings, raw text, errors, processing state, and processing tokens remain private to administrators.

## Canonical portal import mapping (SYNC-D1)

This is the shared target contract between `portal-ocr` and `portal-app`. Import is
row-atomic: a rejected row creates no announcement, attachment, or extraction.
Blank optional values become `null`; placeholders and inferred procurement facts
must not be invented.

| Portal import JSON | Laravel destination | Mapping and fallback policy |
|---|---|---|
| `record_key` | `announcements.source_reference` | Required non-blank idempotency key. Laravel matches imports by this value; a missing key rejects the row. The database column is indexed but is not currently unique, so the importer must enforce one-record semantics transactionally. |
| `publication_status`, `published_at` | `announcements.publication_status`, `announcements.published_at` | The exporter must emit `publication_status = "draft"` and `published_at = null`. The importer forces those values even if input disagrees. Only an explicit admin publish action may set `published` and a timestamp. |
| `pdf_path` | `announcement_attachments` plus local attachment storage | Required path relative to the sibling `portal_attachments/` directory; absolute paths and traversal are invalid. Copy the readable PDF into managed local storage and derive `filename`, `stored_filename`, `file_size`, `mime_type = "application/pdf"`, `sha256`, and `document_kind`. A missing, unreadable, non-PDF, or duplicate-content file rejects the row without partial writes. |
| `source_url` | `announcements.source_url` | Preserve a non-blank source URL; blank becomes `null`. Never manufacture a URL. This provenance is not part of the editable extraction candidate. |
| `budget` | `announcements.budget` and `document_extractions.candidate.budget` | Required canonical decimal from an explicitly extracted budget. Empty or invalid values reject the row because the column is non-null. Do not substitute `reference_price`/`base_price` or `0.00`. |
| `deadline`, `status` | `announcements.deadline`, `announcements.status`, and the same fields in `document_extractions.candidate` | `deadline` is required ISO `YYYY-MM-DD` sourced from an explicitly extracted end date; missing or invalid values reject the row. Do not substitute announcement/bid-open dates or synthesize `+30 days`. `status` is derived from that accepted deadline and must be one of `open`, `urgent`, `closing`, or `closed`. |
| `validation_flags` | `document_extractions.warnings` | Canonical JSON type is `list[str]`; preserve every flag in order. Missing becomes `[]`. Flags never auto-publish or silently rewrite candidate facts. |
| `raw_text` | `document_extractions.raw_text` | Preserve the complete first-pass extracted/OCR text byte-for-byte as a private admin-review value. Missing becomes `null`; never substitute the cleaned/truncated `raw_text_snippet`, and never modify the source OCR cache. |
| `organization` | `announcements.organization` and `document_extractions.candidate.organization` | Use explicitly extracted agency/department text. If absent, use the trusted general organization for a known `source_id`; an unknown source with no organization rejects the row. |
| `contact_name`, `contact_phone` | matching nullable announcement columns and extraction candidate keys | Use only explicitly extracted contact values. Blank becomes `null`; do not copy `organization`, infer a person/department, or invent a phone number. Both keys remain present in the candidate even when null. |
| `title`, `category`, `method`, `location`, `reference_price`, `description` | matching announcement columns and extraction candidate keys | Copy validated values into both places for admin review. Nullable values become `null`; required/taxonomy-invalid values reject the row rather than receiving placeholders. Raw OCR does not belong in `description`. |
| Derived import metadata | `document_extractions` | Create one row per attachment with `status = "review"`, `method = "portal-ocr"`, the complete reviewable candidate above, `confidence = {}`, and the mapped warnings/raw text. Approval may update the announcement but must leave it as a draft. |

Current implementation gaps are explicit: `PortalRow` still emits published rows,
synthesizes budget/date/title fallbacks, omits `validation_flags` and full
`raw_text`, and puts a cleaned snippet in `description`. Laravel has no JSON
importer yet, and the current `document_extractions.method` enum does not admit
`portal-ocr`. These are blockers for the implementation tasks, not alternate
fallbacks to this contract.

## Requirements

- PHP 8.4.1 or 8.5 and Composer 2
- Node.js 22 and npm when running frontend commands outside Sail
- Docker Desktop for the Laravel Sail/PostgreSQL environment

## Setup

```bash
cp .env.example .env
composer install
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm ci
./vendor/bin/sail npm run build
```

If a compatible host PHP/Composer is unavailable, bootstrap `vendor/` with a PHP 8.4/8.5 Composer container before starting Sail.

For local development:

```bash
./vendor/bin/sail composer dev
```

The deterministic seed creates demo-only users documented in `docs/demo-runbook.md`. Do not reuse those credentials for a deployment. Environment-driven automatic admin bootstrap is disabled in production.

## Verification

```bash
./vendor/bin/sail composer test
./vendor/bin/sail npm run types
./vendor/bin/sail npm run build
./vendor/bin/sail npm run format:check
./vendor/bin/sail npx eslint .
./vendor/bin/sail npm run test:e2e -- --project=chromium --workers=1
./vendor/bin/sail composer audit --locked
./vendor/bin/sail npm audit
```

See `docs/demo-runbook.md` for the guarded PostgreSQL queue rehearsal and `docs/demo-feature-matrix.md` for the implemented-versus-future capability matrix.

## Production Limitations

The repository does not include a production deployment workflow, hosting configuration, secrets contract, rollback procedure, supervised queue-worker configuration, or production observability setup. Passing local and CI checks does not by itself make the application production-ready.

## License

Licensed under the MIT License. See `LICENSE`.
