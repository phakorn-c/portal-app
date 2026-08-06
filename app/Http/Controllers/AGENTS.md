# CONTROLLERS KNOWLEDGE BASE

## OVERVIEW
Domain-grouped Laravel controllers for Admin, Procurement, Settings, and User features.

## STRUCTURE
```
.
├── Admin/           # Announcement and user management
├── Procurement/     # Search, details, and PDF generation
├── Settings/        # Profile, password, and 2FA security
├── User/            # Dashboard, history, and notifications
├── Controller.php   # Abstract base class
└── DashboardController.php
```

## WHERE TO LOOK
| Feature | Controller | Role |
|---------|------------|------|
| Admin Announcements | `Admin\AnnouncementController` | CRUD for procurement notices |
| Admin Users | `Admin\UserController` | Administrative user management |
| Search Portal | `Procurement\SearchController` | Main search logic and history storage |
| PDF Export | `Procurement\PdfController` | Generates announcement PDFs |
| Security Settings | `Settings\TwoFactorAuthenticationController` | 2FA setup and recovery |
| User History | `User\HistoryController` | Tracks viewed announcements |
| Saved Searches | `User\SavedSearchController` | Manages user search subscriptions |

## CONVENTIONS
- **Strict Nesting**: New controllers must reside in a domain subdirectory.
- **Fortify Boundary**: Do not add login or registration logic here.
- **Base Extension**: Always extend the local `Controller.php`.
- **Dependency Injection**: Inject domain support classes (e.g., `AnnouncementSearch`) via constructors.
- **Response Type**: Exclusively use `Inertia::render` for page-level responses.
- **Route Mapping**: Admin routes use `role:admin` middleware; User/Settings use `auth`.
