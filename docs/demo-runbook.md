# Demo Runbook: Three-Actor Presentation

This document provides the exact steps and commands for the three-actor demo of the Khon Kaen Procurement Docs Portal.

## 1. Environment Reset

Before starting the demo, reset the database to the clean seeded state.

```bash
./vendor/bin/sail artisan migrate:fresh --seed
```

**Note:** If not using Sail, use `php artisan migrate:fresh --seed`.

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

## 4. Smoke-Rehearsal Proof

Run these commands to validate the demo story before the presentation:

```bash
# 1. Reset and Seed (canonical demo reset command)
./vendor/bin/sail artisan migrate:fresh --seed

# 2. Run Backend Tests (Pest) - must pass all 130+ tests
./vendor/bin/sail artisan test

# 3. Run Frontend Browser Tests (Playwright) - must pass all guest/member/admin journeys
./vendor/bin/sail npm run test:e2e
```

### Expected Results

- **Reset:** Both consecutive resets should exit successfully with the same seeded data.
- **Pest:** 132 tests passed, covering Search, Announcement, SavedSearch, Notification, Admin, and Auth suites.
- **Playwright:** All guest, member, admin, and redirect browser journeys pass.
- **Seeded Data:** 5 announcements (3 published, 1 draft, 1 hidden), 2 users (admin + registered).

## 5. Fallback Notes

- **Database Reset:** If the database becomes inconsistent during the demo, run the reset command again.
- **2FA:** Two-Factor Authentication is implemented but excluded from the live walkthrough to save time.
- **OCR/Scraping:** These features are part of the research vision and are not included in the current portal scope.
