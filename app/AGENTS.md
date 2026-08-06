# BACKEND CORE KNOWLEDGE BASE

## OVERVIEW
PHP backend core for Thai public-procurement portal, organized by domain and Laravel standard patterns.

## STRUCTURE
```
.
├── Actions/             # Single-responsibility logic classes
├── Concerns/            # Shared traits
├── Console/             # Artisan commands
├── Http/
│   ├── Controllers/     # Domain-grouped: Admin, Procurement, Settings, User
│   ├── Middleware/      # Inertia sharing, role-based access
│   └── Requests/        # Form validation
├── Jobs/                # Queued tasks
├── Models/              # Flat Eloquent models (7 total)
├── Notifications/       # System notifications
├── Providers/           # App, Auth, Fortify, Route service providers
└── Support/             # Domain-specific query builders and services
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Modify Auth logic | `Providers/FortifyServiceProvider.php` | Maps Fortify to Inertia views |
| Global app config | `Providers/AppServiceProvider.php` | Carbon, destructive guards, admin check |
| Shared Inertia data | `Http/Middleware/HandleInertiaRequests.php` | Global props for React |
| Role middleware | `Http/Middleware/EnsureUserHasRole.php` | Implements `role:admin` |
| Search logic | `Support/Procurement/` | Query builders for announcements |
| Domain controllers | `Http/Controllers/{Domain}/` | Grouped by Admin, Procurement, etc. |

## CONVENTIONS
- **Domain Grouping**: Controllers and Support classes must be nested under domain folders (Admin, Procurement, Settings, User).
- **Flat Models**: Keep Eloquent models directly in `app/Models/`.
- **Service Pattern**: Use `app/Support/` for complex query logic or domain services instead of bloating controllers.
- **Auth Mapping**: Do not use routes for auth pages; use `FortifyServiceProvider` to map views.
- **Safety**: `AppServiceProvider` enforces `DB::prohibitDestructiveCommands` in production.
- **Immutable Dates**: Carbon is configured as `CarbonImmutable` globally.
- **Typed Requests**: Use FormRequests in `Http/Requests/` for all non-trivial validation.
