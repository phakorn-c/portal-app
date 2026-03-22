# Demo Runbook

## Reset Command

```bash
./vendor/bin/sail artisan migrate:fresh --seed
```

## Seeded Actor Credentials

- **Admin**: `admin@example.com` / `password`
- **Member**: `test@example.com` / `password`

## Live Walkthrough Sequence

### 1. Public Discovery

- Visit `/procurement`
- Search for seeded announcements
- View announcement detail and PDF

### 2. Registered User Journey

- Login as `test@example.com`
- Create a saved search from `/procurement`
- View saved searches and notifications

### 3. Admin Curation

- Login as `admin@example.com`
- Manage announcements
- Manage user roles

## Note on Two-Factor Authentication (2FA)

2FA is implemented in code and fully functional (as verified by tests), but it is **excluded from the live walkthrough** to ensure a smooth demo flow.
The `/settings/two-factor` route is accessible but not part of the assessed demo path.
