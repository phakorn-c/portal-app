# Sequence Diagrams

## Khon Kaen Procurement Documents Portal

This document contains sequence diagrams illustrating key interactions in the system.

---

## 1. User Authentication Flow (การเข้าสู่ระบบ)

### 1.1 Login with Two-Factor Authentication

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant F as Frontend (React)
    participant I as Inertia.js
    participant M as Middleware
    participant C as FortifyController
    participant A as Auth Service
    participant DB as Database

    U->>F: Enter credentials (email, password)
    F->>I: POST /login
    I->>M: HandleInertiaRequests
    M->>C: authenticate(request)
    C->>A: attempt(credentials)
    A->>DB: SELECT user WHERE email = ?
    DB-->>A: User record
    A->>A: Verify password hash

    alt Password Valid
        A-->>C: Authentication successful

        alt 2FA Enabled
            C->>C: Check two_factor_secret exists
            C-->>I: Redirect to /two-factor-challenge
            I-->>F: Render TwoFactorChallenge page
            F-->>U: Show 2FA code input

            U->>F: Enter 2FA code
            F->>I: POST /two-factor-challenge
            I->>C: verifyTwoFactor(code)
            C->>A: Validate TOTP code

            alt Code Valid
                A-->>C: 2FA verified
                C->>C: Create session
                C-->>I: Redirect to /dashboard
                I-->>F: Render Dashboard
                F-->>U: Show dashboard
            else Code Invalid
                A-->>C: Invalid code
                C-->>I: Error response
                I-->>F: Show error
                F-->>U: Display "Invalid code"
            end
        else 2FA Not Enabled
            C->>C: Create session
            C-->>I: Redirect to /dashboard
            I-->>F: Render Dashboard
            F-->>U: Show dashboard
        end
    else Password Invalid
        A-->>C: Authentication failed
        C-->>I: Error response
        I-->>F: Validation errors
        F-->>U: Display "Invalid credentials"
    end
```

### 1.2 User Registration

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant F as Frontend (React)
    participant I as Inertia.js
    participant C as CreateNewUser Action
    participant V as Validator
    participant DB as Database
    participant E as Email Service

    U->>F: Fill registration form
    F->>I: POST /register
    I->>C: create(request)
    C->>V: validate(data)

    alt Validation Passed
        V-->>C: Valid
        C->>DB: INSERT INTO users
        DB-->>C: User created
        C->>E: Send verification email
        E-->>C: Email queued
        C->>C: Login user
        C-->>I: Redirect to /dashboard
        I-->>F: Render Dashboard
        F-->>U: Show dashboard with verification notice
    else Validation Failed
        V-->>C: Validation errors
        C-->>I: Error response
        I-->>F: Show errors
        F-->>U: Display validation errors
    end
```

---

## 2. Procurement Search Flow (การค้นหาประกาศ)

### 2.1 Search and Filter Announcements

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant F as Frontend (React)
    participant S as Search State
    participant API as Backend API
    participant DB as Database

    U->>F: Enter search query
    F->>S: setQuery(value)
    S->>S: Update filter state

    U->>F: Adjust budget slider
    F->>S: setBudgetRange([min, max])

    U->>F: Select organization checkbox
    F->>S: toggleFilter(org, organizations)

    U->>F: Select procurement method
    F->>S: toggleFilter(method, methods)

    S->>S: useMemo: filteredAnnouncements
    Note over S: Apply all filters:<br/>- Query match<br/>- Budget range<br/>- Organization<br/>- Method<br/>- Category

    S->>S: useMemo: sortedAnnouncements
    Note over S: Sort by selected criteria:<br/>- Latest<br/>- Budget high/low<br/>- Deadline

    S->>S: Calculate pagination
    S-->>F: paginatedAnnouncements
    F-->>U: Render filtered results

    U->>F: Click page number
    F->>S: setCurrentPage(n)
    S-->>F: Update visible items
    F-->>U: Show page n results
```

### 2.2 View Announcement Detail

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant F as Frontend (React)
    participant I as Inertia.js
    participant R as Router (Laravel)
    participant C as Controller
    participant DB as Database

    U->>F: Click "ดูรายละเอียด" button
    F->>I: Link to /procurement/announcements/{id}
    I->>R: GET /procurement/announcements/{id}
    R->>C: show(announcementId)
    C->>DB: SELECT announcement WHERE id = ?
    DB-->>C: Announcement data
    C->>DB: SELECT attachments WHERE announcement_id = ?
    DB-->>C: Attachment list
    C-->>I: Inertia::render('procurement/show', data)
    I-->>F: Render ProcurementAnnouncement
    F-->>U: Display announcement detail page

    Note over U,F: Page shows:<br/>- Status badge<br/>- Organization info<br/>- Budget & deadline<br/>- TOR document viewer<br/>- Attachments list<br/>- Timeline
```

---

## 3. User Profile Management (การจัดการโปรไฟล์)

### 3.1 Update Profile

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant F as Frontend (React)
    participant I as Inertia.js
    participant M as Middleware
    participant C as ProfileController
    participant R as ProfileUpdateRequest
    participant DB as Database

    U->>F: Navigate to /settings/profile
    F->>I: GET /settings/profile
    I->>M: auth, verified middleware
    M->>C: edit(request)
    C-->>I: Inertia::render('settings/profile')
    I-->>F: Render profile page
    F-->>U: Show profile form

    U->>F: Edit name and email
    F->>I: PATCH /settings/profile
    I->>M: auth middleware
    M->>C: update(request)
    C->>R: validate()
    R->>R: Check unique email

    alt Validation Passed
        R-->>C: Valid data
        C->>C: user.fill(validated)

        alt Email Changed
            C->>C: user.email_verified_at = null
            Note over C: Requires re-verification
        end

        C->>DB: UPDATE users SET ...
        DB-->>C: Updated
        C-->>I: Redirect to profile.edit
        I-->>F: Refresh page
        F-->>U: Show success message
    else Validation Failed
        R-->>C: Errors
        C-->>I: Error response
        I-->>F: Show validation errors
        F-->>U: Display errors
    end
```

### 3.2 Setup Two-Factor Authentication

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant F as Frontend (React)
    participant I as Inertia.js
    participant C as TwoFactorController
    participant T as TwoFactorService
    participant DB as Database

    U->>F: Navigate to /settings/two-factor
    F->>I: GET /settings/two-factor
    I->>C: show(request)
    C-->>I: Render two-factor page
    I-->>F: Show 2FA settings
    F-->>U: Display 2FA setup option

    U->>F: Click "Enable 2FA"
    F->>I: POST /user/two-factor-authentication
    I->>C: store(request)
    C->>T: Generate secret key
    T-->>C: Secret + QR code
    C->>DB: UPDATE users SET two_factor_secret
    DB-->>C: Saved
    C-->>I: Return QR code SVG
    I-->>F: Show modal with QR code
    F-->>U: Display QR code to scan

    U->>U: Scan QR with authenticator app
    U->>F: Enter verification code
    F->>I: POST /user/confirmed-two-factor-authentication
    I->>C: confirm(code)
    C->>T: Validate TOTP code

    alt Code Valid
        T-->>C: Valid
        C->>DB: SET two_factor_confirmed_at = NOW()
        DB-->>C: Confirmed
        C->>C: Generate recovery codes
        C->>DB: Store encrypted recovery codes
        C-->>I: Success + recovery codes
        I-->>F: Show recovery codes
        F-->>U: Display recovery codes to save
    else Code Invalid
        T-->>C: Invalid
        C-->>I: Error
        I-->>F: Show error
        F-->>U: "Invalid code, try again"
    end
```

---

## 4. Notification Alert Management (การจัดการการแจ้งเตือน)

### 4.1 Create New Alert

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant F as Frontend (React)
    participant S as State
    participant I as Inertia.js
    participant C as AlertController
    participant DB as Database

    U->>F: Navigate to /user/notifications
    F-->>U: Show notification settings page

    U->>F: Fill alert form
    Note over U,F: - Organization name<br/>- Work type/category<br/>- Minimum budget<br/>- Location

    U->>F: Click "เพิ่มเงื่อนไขการแจ้งเตือน"
    F->>I: POST /user/alerts
    I->>C: store(request)
    C->>C: Validate alert criteria
    C->>DB: INSERT INTO alerts
    DB-->>C: Alert created
    C-->>I: Success response
    I-->>F: Update alerts list
    F->>S: Add new alert to state
    S-->>F: Re-render alert list
    F-->>U: Show new alert in list
```

### 4.2 Toggle Notification Channel

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant F as Frontend (React)
    participant S as useState Hook
    participant I as Inertia.js
    participant C as NotificationController
    participant DB as Database

    U->>F: Toggle email switch
    F->>S: setEmailEnabled(!emailEnabled)
    S-->>F: Update UI immediately
    F->>I: PATCH /user/notification-channels/email
    I->>C: update(channel, enabled)
    C->>DB: UPDATE notification_channels SET enabled = ?
    DB-->>C: Updated
    C-->>I: Success
    I-->>F: Confirm change
    F-->>U: Switch reflects new state
```

---

## 5. Admin Announcement Management (การจัดการประกาศโดยผู้ดูแล)

### 5.1 Create New Announcement

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin (Browser)
    participant F as Frontend (React)
    participant I as Inertia.js
    participant M as Admin Middleware
    participant C as AnnouncementController
    participant V as Validator
    participant DB as Database
    participant N as Notification Service

    A->>F: Click "เพิ่มประกาศใหม่"
    F-->>A: Show create form modal

    A->>F: Fill announcement details
    Note over A,F: - Title<br/>- Organization<br/>- Budget<br/>- Deadline<br/>- Method<br/>- Contact info<br/>- TOR document

    A->>F: Submit form
    F->>I: POST /admin/announcements
    I->>M: Verify admin role
    M->>C: store(request)
    C->>V: validate(data)

    alt Valid
        V-->>C: Passed
        C->>DB: INSERT INTO announcements
        DB-->>C: Announcement created
        C->>C: Upload attachments
        C->>DB: INSERT INTO attachments
        C->>N: Trigger alert notifications
        N->>N: Find matching user alerts
        N->>N: Queue notifications
        C-->>I: Success response
        I-->>F: Redirect to admin dashboard
        F-->>A: Show success message
    else Invalid
        V-->>C: Errors
        C-->>I: Validation errors
        I-->>F: Show errors
        F-->>A: Display validation messages
    end
```

### 5.2 Toggle Announcement Visibility

```mermaid
sequenceDiagram
    autonumber
    participant A as Admin (Browser)
    participant F as Frontend (React)
    participant I as Inertia.js
    participant C as AnnouncementController
    participant DB as Database

    A->>F: Click visibility toggle icon
    F->>I: PATCH /admin/announcements/{id}/visibility
    I->>C: toggleVisibility(id)
    C->>DB: SELECT status FROM announcements WHERE id = ?
    DB-->>C: Current status

    alt Currently Visible
        C->>DB: UPDATE SET status = 'hidden'
        DB-->>C: Updated
        C-->>I: {visible: false}
    else Currently Hidden
        C->>DB: UPDATE SET status = previous_status
        DB-->>C: Updated
        C-->>I: {visible: true}
    end

    I-->>F: Update row state
    F-->>A: Toggle icon changes
```

---

## 6. Document Download Flow (การดาวน์โหลดเอกสาร)

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant F as Frontend (React)
    participant I as Inertia.js
    participant M as Auth Middleware
    participant C as DocumentController
    participant S as Storage Service
    participant DB as Database

    U->>F: Click download button

    alt User Authenticated
        F->>I: GET /documents/{id}/download
        I->>M: Check authentication
        M->>C: download(documentId)
        C->>DB: SELECT * FROM attachments WHERE id = ?
        DB-->>C: Attachment record
        C->>S: Get file from storage
        S-->>C: File stream
        C->>DB: Log download activity
        C-->>U: File download response
        Note over U: Browser downloads file
    else User Not Authenticated
        F-->>U: Show login prompt
        U->>F: Click login
        F->>I: Redirect to /login
        Note over U,F: After login, redirect back
    end
```
