# Khon Kaen Procurement Docs Portal

A Thai public-procurement demonstration portal built with Laravel 12, Inertia.js, React 19, PostgreSQL, and Tailwind CSS. It supports public announcement discovery, member search history and saved searches, administrative publication controls, PDF attachments, and an admin-only extraction review workflow.

## Demo Scope

Document extraction is currently a deterministic, filename-driven fake behind a replaceable interface. It does not inspect PDF bytes and must not be described as OCR. Real OCR, live procurement scraping, RAG/vector search, and WER/F1 evaluation remain future work. Seeded `demo.invalid` URLs are non-official demo identifiers.

Approval of extracted candidate data is separate from announcement publication. Extraction candidates, confidence values, warnings, raw text, errors, processing state, and processing tokens remain private to administrators.

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
