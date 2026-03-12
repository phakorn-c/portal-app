# Class Diagram

## Khon Kaen Procurement Documents Portal

This version is optimized for A4 print: fewer classes, thicker borders, and only high-value relationships from the current codebase.

```mermaid
%%{init: {'theme':'base','themeVariables':{
  'fontSize':'18px',
  'fontFamily':'Arial',
  'primaryColor':'#ffffff',
  'primaryTextColor':'#111111',
  'primaryBorderColor':'#111111',
  'lineColor':'#111111'
}}}%%
classDiagram
    direction TB

    %% =============================
    %% CORE MODELS (ACTIVE)
    %% =============================
    class User {
        +int id
        +string name
        +string email
        +string role
        +isAdmin() bool
    }

    class Announcement {
        +int id
        +string title
        +string organization
        +number budget
        +string status
        +string publication_status
        +scopePublished() Builder
    }

    class AnnouncementAttachment {
        +int id
        +int announcement_id
        +string filename
        +string stored_filename
        +int file_size
    }

    class SavedSearch {
        +int id
        +int user_id
        +string name
        +array criteria
        +bool alert_enabled
        +datetime last_notified_at
    }

    class NotificationPreference {
        +int id
        +int user_id
        +bool website_enabled
        +bool email_enabled
    }

    class SearchHistory {
        +int id
        +int user_id
        +array criteria
        +int result_count
        +datetime searched_at
    }

    class ListingHistory {
        +int id
        +int user_id
        +int announcement_id
        +datetime viewed_at
    }

    %% =============================
    %% SUPPORT / ASYNC FLOW
    %% =============================
    class FilterState {
        +defaults() array
        +validationRules() array
        +normalize(criteria) array
    }

    class AnnouncementSearch {
        +apply(criteria) Builder
        -applySort(query, sortBy) void
    }

    class EvaluateSavedSearchAlerts {
        +__construct(announcement)
        +handle(search) void
    }

    class NewMatchingAnnouncement {
        +__construct(announcement, savedSearch)
        +via(notifiable) array
        +toDatabase() array
        +toMail() MailMessage
    }

    %% =============================
    %% KEY CONTROLLERS (ENTRY POINTS)
    %% =============================
    class ProcurementSearchController {
        +index(request) Response
        -normalizedCriteriaFromRequest() array
        -storeSearchHistory() void
    }

    class AdminAnnouncementController {
        +store(request) JsonResponse
        +update(request, announcement) JsonResponse
        +publish(announcement) JsonResponse
    }

    class UserNotificationController {
        +index(request) Response
        +markRead(request, notification) RedirectResponse
    }

    %% =============================
    %% RELATIONSHIPS
    %% =============================
    User "1" --> "*" SavedSearch : has
    User "1" --> "1" NotificationPreference : has
    User "1" --> "*" SearchHistory : has
    User "1" --> "*" ListingHistory : has

    Announcement "1" --> "*" AnnouncementAttachment : has
    Announcement "1" --> "*" ListingHistory : tracked in

    SavedSearch --> FilterState : criteria
    ProcurementSearchController ..> FilterState : validates
    ProcurementSearchController ..> AnnouncementSearch : uses
    ProcurementSearchController ..> SearchHistory : writes

    AdminAnnouncementController ..> Announcement : manages
    AdminAnnouncementController ..> EvaluateSavedSearchAlerts : dispatches

    EvaluateSavedSearchAlerts ..> SavedSearch : evaluates
    EvaluateSavedSearchAlerts ..> AnnouncementSearch : reuses filters
    EvaluateSavedSearchAlerts ..> NewMatchingAnnouncement : sends

    UserNotificationController ..> NotificationPreference : reads
    UserNotificationController ..> SavedSearch : reads alerts

    NewMatchingAnnouncement ..> Announcement : embeds data
    NewMatchingAnnouncement ..> SavedSearch : embeds data

    classDef core fill:#ffffff,stroke:#111111,stroke-width:2px,color:#111111
    classDef flow fill:#f8f8f8,stroke:#111111,stroke-width:2px,color:#111111
    classDef ctrl fill:#ffffff,stroke:#111111,stroke-width:2px,color:#111111

    class User,Announcement,AnnouncementAttachment,SavedSearch,NotificationPreference,SearchHistory,ListingHistory core
    class FilterState,AnnouncementSearch,EvaluateSavedSearchAlerts,NewMatchingAnnouncement flow
    class ProcurementSearchController,AdminAnnouncementController,UserNotificationController ctrl
```

## Included Classes (A4 Compact Set)

| Layer      | Class                         | Why Included                                |
| ---------- | ----------------------------- | ------------------------------------------- |
| Model      | `User`                        | Central identity and ownership of user data |
| Model      | `Announcement`                | Core procurement record                     |
| Model      | `AnnouncementAttachment`      | Official document linkage                   |
| Model      | `SavedSearch`                 | Alert source and user intent                |
| Model      | `NotificationPreference`      | Delivery channel settings                   |
| Model      | `SearchHistory`               | Search activity tracking                    |
| Model      | `ListingHistory`              | View/download activity tracking             |
| Support    | `FilterState`                 | Shared filter schema and normalization      |
| Support    | `AnnouncementSearch`          | Reusable query/filter engine                |
| Async      | `EvaluateSavedSearchAlerts`   | Match-and-notify workflow                   |
| Async      | `NewMatchingAnnouncement`     | Notification payload/channel logic          |
| Controller | `ProcurementSearchController` | Public search entry point                   |
| Controller | `AdminAnnouncementController` | Announcement publish lifecycle              |
| Controller | `UserNotificationController`  | User notification UI endpoint               |

## Excluded on Purpose (To Keep Diagram Readable)

| Item                                                                                                                     | Reason                                                             |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Legacy/fictional classes from old diagram (`Organization`, `ProcurementMethod`, `Alert`, `ActivityItem`, `TimelineItem`) | Not modeled as backend classes in current code                     |
| Most settings/auth controllers and request validators                                                                    | Kept out to avoid crowding A4 with repetitive CRUD/validation flow |
| Frontend UI atoms/components                                                                                             | Better shown in component-level diagram, not core class map        |

## Source of Truth Used

- `app/Models/User.php`
- `app/Models/Announcement.php`
- `app/Models/AnnouncementAttachment.php`
- `app/Models/SavedSearch.php`
- `app/Models/NotificationPreference.php`
- `app/Models/SearchHistory.php`
- `app/Models/ListingHistory.php`
- `app/Support/Procurement/FilterState.php`
- `app/Support/Procurement/AnnouncementSearch.php`
- `app/Jobs/EvaluateSavedSearchAlerts.php`
- `app/Notifications/NewMatchingAnnouncement.php`
- `app/Http/Controllers/Procurement/SearchController.php`
- `app/Http/Controllers/Admin/AnnouncementController.php`
- `app/Http/Controllers/User/NotificationController.php`
