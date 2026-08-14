# Demo Feature Status Matrix

This matrix classifies the capabilities of the Khon Kaen Procurement Docs Portal for the three-actor presentation.

## Capability Classification

| Feature                                      | Status              | Notes |
| :------------------------------------------- | :------------------ | :---- |
| **Public Search & Filtering**                | Implemented         | Core "Public Discovery" journey |
| **Announcement Detail View**                 | Implemented         | Core "Public Discovery" journey |
| **User Registration & Login**                | Implemented         | Core auth flow |
| **Saved Searches**                           | Implemented         | Core "Personalized Procurement" journey |
| **Search History**                           | Implemented         | Core "Personalized Procurement" journey |
| **Alerts/Notifications**                     | Implemented         | Core "Personalized Procurement" journey |
| **Admin Announcement Management**            | Implemented         | Core "Governance" journey |
| **Admin User/Role Management**               | Implemented         | Core "Governance" journey |
| **PDF Attachments**                          | Implemented         | Upload, preview, download, hashing, and queued review preparation |
| **Two-Factor Authentication (2FA)**          | Implemented         | **Out of live walkthrough** |
| **Replaceable extraction contract**          | Implemented (fake)  | Deterministic filename-driven fake; no PDF parsing or OCR |
| **Admin extraction review and approval**     | Implemented (fake)  | Review, correction, approval, retry, and separate publication demonstration |
| **Approved-source public attribution**       | Implemented (fake)  | Visible only after approval and publication; extraction internals remain private |
| **Real OCR / model-backed extraction**       | Future Work/Pending | No OCR engine or accuracy claim is implemented |
| **Live scraping / external ingestion**       | Future Work/Pending | No live external-source scraper is implemented |
| **RAG / embeddings / vector database**       | Future Work/Pending | Research direction only |
| **WER/F1 extraction accuracy evaluation**    | Future Work/Pending | No benchmark dataset, WER, F1, or quality score is claimed |

## Three Actor Journeys

1.  **Public Discovery Journey (Guest)**: Focuses on transparency and accessibility for the general public.
2.  **Personalized Procurement Journey (Member)**: Focuses on productivity and monitoring for registered users.
3.  **Governance & Content Management Journey (Admin)**: Focuses on platform integrity and data curation.

## Explicit Scope Statement

The implemented extraction milestone is an **interface and governance demonstration**: deterministic fake results exercise queueing, review, correction, approval, publication, and safe source attribution. It does not inspect PDF bytes and is not real OCR. The seeded `demo.invalid` URLs are demonstration-only identifiers; they are not official government or university sources.

Real OCR, live scraping/ingestion, RAG or vector search, and WER/F1 accuracy evaluation remain **Future Work/Pending**. The 2026-08-14 rehearsal measured 265 passing backend tests (1,934 assertions), 77 passing PostgreSQL-focused tests (943 assertions), and 15 passing Chromium tests. See the runbook for the exact commands and the recorded PostgreSQL test-harness limitation.
