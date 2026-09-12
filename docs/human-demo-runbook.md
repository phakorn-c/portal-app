# Human-Friendly Website Demo

A presenter-first walkthrough of the whole website. Keep this page open while presenting; use [the technical runbook](demo-runbook.md) only for setup, OCR import, queue proof, tests, and recovery.

## At a glance

| Act | Persona | Story | Time |
| --- | --- | --- | ---: |
| 1 | Guest | Find and inspect an opportunity | 5 min |
| 2 | Member | Save, track, and revisit opportunities | 7 min |
| 3 | Member | Control account, security, and appearance | 3 min |
| 4 | Admin | Govern content, extraction, and access | 8 min |
| 5 | Member | Receive a matching alert | 2 min |

**Cue format:** **DO** the action · **SAY** the point · Continue when the **GREEN LIGHT** is visible.

## Ready the demo

| Window | Start | Account |
| --- | --- | --- |
| Guest | `/procurement` | No login |
| Member | `/login` | `test@example.com` / `password` |
| Admin | `/login` | `admin@example.com` / `password` |

- [ ] Complete the guarded reset or canonical import in `demo-runbook.md`.
- [ ] Confirm `/procurement` shows announcement cards.
- [ ] Keep Member and Admin in separate browser profiles.
- [ ] Use only disposable records for delete actions.
- [ ] If using imported OCR data, note its runtime IDs. Never assume historical IDs.

> Core message: approving extracted data does **not** publish an announcement. Publication is a separate admin decision.

---

## Act 1: Guest discovery

| Step | DO | SAY | GREEN LIGHT |
| ---: | --- | --- | --- |
| 1 | Open `/procurement`; search `Smart Traffic`; press **ค้นหา**. | “Public procurement can be searched without an account.” | **Khon Kaen Smart Traffic Upgrade** appears with status, organization, method, budget, and deadline. |
| 2 | Apply an organization, method, or category filter; move the budget range; sort by **งบประมาณสูงสุด**. | “Official filters and sorting turn a large catalogue into a shortlist.” | Result count/order changes and active filters appear. |
| 3 | Remove one filter; press **ล้างทั้งหมด**. | “Every filter is visible and reversible.” | The full result set returns. |
| 4 | Search `Smart Traffic` again; press **ดูรายละเอียด**. | “The detail view puts decision-making facts in one place.” | Budget, organization, category, method, deadline, contact, description, timeline, and status appear. |
| 5 | Scroll to the TOR/document section. Point out the inline PDF, **เปิดเอกสาร PDF ในแท็บใหม่**, and **ดาวน์โหลดเอกสาร PDF**. | “The original document stays available for verification.” | The PDF is visible; one preview/download action opens successfully. |

**Optional:** If seeded announcement 7 is already published, show its source reference and `.invalid` demo-domain warning. Otherwise return here after Act 4.

---

## Act 2: Member productivity

| Step | DO | SAY | GREEN LIGHT |
| ---: | --- | --- | --- |
| 1 | Sign in as `test@example.com`; open `/procurement`; search `School`. | “Signing in adds personal tools without removing public access.” | Member menu and **บันทึกการค้นหานี้** are visible. |
| 2 | Press **บันทึกการค้นหานี้**; name it `School opportunities`; keep alerts enabled; save. | “A useful query becomes a reusable alert.” | Save succeeds. |
| 3 | Open `/user/dashboard`. | “The dashboard summarizes saved searches, views, searches, and notifications.” | Summary counts, saved search, and recent activity appear. |
| 4 | Open `/user/saved-searches`; run the search; return; edit its name; toggle the bell once. | “Members can rerun, rename, alert, or delete their own searches.” | Criteria reopen on Procurement; the row updates; bell text changes between **เปิดแจ้งเตือน** and **ปิดแจ้งเตือน**. Leave alerts enabled. |
| 5 | Open an announcement; go to `/user/history`; switch between both tabs. | “Viewed announcements and prior searches remain easy to revisit.” | **ประวัติการดูประกาศ** shows the item; **ประวัติการค้นหา** shows the query and result count. |
| 6 | Open `/user/notifications`; toggle website or email off and back on. | “Alert rules, delivered messages, and channel preferences live together.” | The `School` alert and two preference switches appear; the switch state persists. |

Do not delete `School opportunities`; Act 5 uses it.

---

## Act 3: Account and security

Open **Settings** from the user menu.

| Stop | DO | SAY | Finish safely |
| --- | --- | --- | --- |
| Profile | Change the name, **Save**, then restore it. | “Members control their identity details.” | Confirm the saved state. |
| Password | Open `/settings/password`; show current/new/confirmation fields. | “Changing a password requires the current password.” | Do not submit on the shared account. |
| Appearance | Open `/settings/appearance`; select Light, Dark, and System. | “Appearance follows the member’s preference.” | Leave the clearest option selected. |
| 2FA | Open `/settings/two-factor`; if redirected, enter the current password and press **Confirm password**; show **Enable 2FA**. | “Sensitive settings require password confirmation; TOTP, recovery codes, challenge login, and disable controls are implemented.” | Complete setup only with a disposable account and authenticator. |
| Account deletion | Return to Profile; point out deletion. | “Account deletion is available and protected.” | Never confirm on the shared account. |

**If asked:** Registration is at `/register`; login supports remember-me; reset and verification need the configured mail channel; 2FA login uses `/two-factor-challenge`.

---

## Act 4: Admin governance

| Step | DO | SAY | GREEN LIGHT |
| ---: | --- | --- | --- |
| 1 | Sign in as `admin@example.com`; open `/admin`. | “Admins see publication health, content controls, and review work.” | Announcement and user statistics plus the content table appear. |
| 2 | Use **ค้นหาประกาศ...**; open **ตัวกรอง**; choose a publication status. | “The content queue is searchable and filterable.” | The table narrows. |
| 3 | Press **เพิ่มประกาศใหม่**; create draft `School Demo Opportunity` with a valid taxonomy, budget `450000`, and future deadline; then edit one field. | “New content starts under admin control.” | A draft row appears and reflects the edit. |
| 4 | Point out **เอกสารแนบ (PDF)** and a seeded extraction-review link. | “PDF upload, preview, download, and review preparation are implemented.” | An attachment/review link is visible. |
| 5 | Open seeded announcement 6’s review; correct a source-supported field; press **อนุมัติข้อมูลที่แก้ไข**. | “A human corrects candidates before approval; approval still does not publish.” | Status changes **รอตรวจสอบ** → **อนุมัติแล้ว** while the announcement remains draft. |
| 6 | Return to `/admin`; publish seeded announcement 7. In Guest, search `จ้างปรับปรุงระบบระบายน้ำเทศบาล` and open it. | “Public users see approved facts, provenance, and the PDF, not extraction internals.” | Admin control changes **เผยแพร่** → **ซ่อน**; guest sees source/reference but no raw text, confidence, warnings, method, or errors. |
| 7 | Open seeded announcement 8’s failed extraction; retry once. | “Failed processing is recoverable, with a three-attempt ceiling.” | `DEMO_EXTRACTION_FAILURE` remains deterministic and attempts increase from 1/3 to 2/3. |
| 8 | Open `/admin/users`; change a disposable user’s role and restore it. | “Access is role-controlled from the website.” | Role changes between **ผู้ดูแลระบบ** and **ผู้ใช้ทั่วไป**. |
| 9 | Return to `/admin`; point out edit, publish/hide, and delete on the disposable announcement. | “Admins control the full announcement lifecycle.” | Delete only after Act 5, if desired. |

### Extraction wording to use

- Normal upload demo: **filename-driven deterministic fixture**, not OCR.
- Imported corpus: **precomputed `portal-ocr` output** reviewed by a human.
- Current measured import: 70 accepted, 20 rejected at the organization-taxonomy boundary.
- Import success is not an OCR accuracy score.

---

## Act 5: Close the alert loop

| Step | DO | SAY | GREEN LIGHT |
| ---: | --- | --- | --- |
| 1 | Ensure `School opportunities` has alerts enabled. In Admin, publish `School Demo Opportunity`. Return to Member → `/user/notifications`. | “A saved search becomes active monitoring when matching content is published.” | A notification names the announcement and saved search. |
| 2 | Press **ทำเครื่องหมายว่าอ่านแล้ว**. | “Members control their notification state.” | The unread action disappears or the item becomes read. |

---

## Full coverage check

### Public

- [ ] Search; organization, method, category, and budget filters
- [ ] Sort, active-filter removal, clear all, and pagination when enough data exists
- [ ] Detail, status, provenance, PDF preview, and PDF download

### Member and authentication

- [ ] Registration, login/logout, remember-me, mail-dependent reset/verification
- [ ] Dashboard; saved-search run/edit/alert/delete controls
- [ ] View/search history; alert criteria; notification read state; channel preferences
- [ ] Profile, password, appearance, 2FA, password confirmation, account deletion

### Admin

- [ ] Statistics and filters; announcement create/edit/publish/hide/delete
- [ ] PDF upload; extraction correction/approval; public-data isolation
- [ ] Failed-extraction retry and ceiling; user role/delete controls

### Do not claim

- [ ] Live scraping in this walkthrough
- [ ] RAG or vector search
- [ ] WER/F1 or OCR accuracy without evaluation artifacts
- [ ] Production deployment from a local rehearsal

## Recovery card

| Problem | Response |
| --- | --- |
| Seeded item missing | Stop changing data; run the guarded reset in `demo-runbook.md`. |
| Member page empty | Create one search, saved search, and announcement view in Act 2. |
| Notification missing | Confirm alert + website notifications are on; use the tested queue/sync setup in `demo-runbook.md`. |
| PDF blocked | Show the inline preview; check pop-up/download permission later. |
| Imported IDs differ | Use runtime IDs from the technical runbook. |
| Port 8001 busy | Stop the old temporary demo container; never repoint the normal app to `testing`. |
| Extraction fails | Identify deterministic fixture vs. imported data; do not call it an OCR outage. |

## Closing line

“The portal connects public discovery, member monitoring, and human-governed publication in one traceable workflow, while keeping original documents accessible and internal extraction evidence private.”
