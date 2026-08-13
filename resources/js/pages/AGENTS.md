# PAGES KNOWLEDGE BASE

## OVERVIEW

Inertia.js page components resolved via `import.meta.glob` and rendered by backend controllers.

## STRUCTURE

```
.
├── admin/               # Admin dashboard and user management
├── auth/                # Fortify-wired authentication pages
├── procurement/         # Search and announcement details
├── settings/            # User profile and security settings
├── user/                # User dashboard, history, and saved searches
├── dashboard.tsx        # Generic dashboard entry
└── AGENTS.md            # This file
```

## WHERE TO LOOK

| Domain      | Location       | Role                                        |
| ----------- | -------------- | ------------------------------------------- |
| Admin       | `admin/`       | System administration and user oversight    |
| Auth        | `auth/`        | Login, registration, and password recovery  |
| Procurement | `procurement/` | Public search and announcement viewing      |
| Settings    | `settings/`    | Account preferences and 2FA configuration   |
| User        | `user/`        | Personal dashboard and saved search history |

## CONVENTIONS

- **Backend Linkage**: Every page requires a Laravel route and controller calling `Inertia::render('Domain/Page')`.
- **Auth Wiring**: Auth pages are mapped in `FortifyServiceProvider`, not `routes/web.php`.
- **Layouts**: Import shared layouts from `@/layouts/` (e.g., `AppLayout`, `AuthLayout`).
- **Resolution**: `app.tsx` and `ssr.tsx` use `import.meta.glob('./pages/**/*.tsx')` for dynamic loading.
- **Home Page**: The root `/` route renders `procurement/search.tsx`.
- **Naming**: Use lowercase for domain directories and kebab-case or lowercase for page files.
