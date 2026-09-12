# Demo Feature Status Matrix

This matrix classifies the capabilities of the Khon Kaen Procurement Docs Portal for the three-actor presentation.

## Capability Classification

| Feature                                   | Status                                | Notes                                                                                                                                                              |
| :---------------------------------------- | :------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Public Search & Filtering**             | Implemented                           | Core "Public Discovery" journey                                                                                                                                    |
| **Announcement Detail View**              | Implemented                           | Core "Public Discovery" journey                                                                                                                                    |
| **User Registration & Login**             | Implemented                           | Core auth flow                                                                                                                                                     |
| **Saved Searches**                        | Implemented                           | Core "Personalized Procurement" journey                                                                                                                            |
| **Search History**                        | Implemented                           | Core "Personalized Procurement" journey                                                                                                                            |
| **Alerts/Notifications**                  | Implemented                           | Core "Personalized Procurement" journey                                                                                                                            |
| **Admin Announcement Management**         | Implemented                           | Core "Governance" journey                                                                                                                                          |
| **Admin User/Role Management**            | Implemented                           | Core "Governance" journey                                                                                                                                          |
| **PDF Attachments**                       | Implemented                           | Upload, preview, download, hashing, and queued review preparation                                                                                                  |
| **portal-ocr JSON draft import**          | Implemented                           | Row-atomic Artisan import, idempotent `record_key`, managed original PDF, and `portal-ocr` review rows; importer always forces draft/null publication timestamp    |
| **Real OCR export to admin review**       | Implemented with current data blocker | 90 draft rows/90 PDFs exported on 2026-09-11; Laravel accepted 70 and rejected 20 OCR-contaminated organization values outside its taxonomy                        |
| **Two-Factor Authentication (2FA)**       | Implemented                           | **Out of live walkthrough**                                                                                                                                        |
| **Upload extraction contract**            | Implemented (fake)                    | `FakeDocumentExtractor` remains the filename-driven deterministic upload fixture; it does not inspect PDF bytes and is separate from imported `portal-ocr` results |
| **Admin extraction review and approval**  | Implemented                           | Both imported real candidates and fake upload fixtures use review/correction/approval; approval remains separate from publication                                  |
| **Approved-source public attribution**    | Implemented                           | Visible only after approval and publication when a valid source URL exists; extraction internals remain private                                                    |
| **OCR engine and extraction pipeline**    | Implemented in `portal-ocr`           | PyMuPDF/Tesseract plus rule-based extraction produce the import artifacts; this status is not an accuracy claim and scanned WER remains a known limitation         |
| **Live scraping during the demo**         | Out of walkthrough                    | Scrapers exist in `portal-ocr`, but the canonical demo uses the existing 90-record corpus to avoid source-site availability and markup drift                       |
| **RAG / embeddings / vector database**    | Future Work/Pending                   | Research direction only                                                                                                                                            |
| **WER/F1 extraction accuracy evaluation** | Future Work/Pending                   | No benchmark dataset, WER, F1, or quality score is claimed                                                                                                         |

## Three Actor Journeys

1.  **Public Discovery Journey (Guest)**: Focuses on transparency and accessibility for the general public.
2.  **Personalized Procurement Journey (Member)**: Focuses on productivity and monitoring for registered users.
3.  **Governance & Content Management Journey (Admin)**: Focuses on platform integrity and data curation.

## Explicit Scope Statement

The cross-repository flow now imports real `portal-ocr` output into the same governance workflow: draft import, administrator review/correction, approval, explicit publication, guest search/detail, and original-PDF streaming. The separate upload path still uses the deterministic `FakeDocumentExtractor`; it does not inspect PDF bytes and must not be presented as OCR. Seeded `demo.invalid` URLs remain demonstration-only identifiers, not official sources.

The 2026-09-11 rehearsal exported 90 draft rows with 90 original PDFs, preserved the raw-OCR aggregate hash, imported 70 rows, and rejected 20 rows at the explicit organization-taxonomy boundary. One accepted real row was observed through browser approval, separate publish, guest search/detail, and byte-identical PDF streaming. Full 90-row import remains blocked by the exporter organization mapping; separate `raw_text` and `validation_flags` fields are also absent from the current export. RAG/vector search remains out of scope, and OCR/WER/F1 numbers must be reported from the evaluation artifacts rather than inferred from this successful integration path. See the runbook for exact commands and recovery notes.
