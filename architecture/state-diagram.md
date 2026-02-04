# State Diagrams

## Khon Kaen Procurement Documents Portal

This document contains state diagrams illustrating the lifecycle of key entities in the system.

---

## 1. Announcement Status (สถานะประกาศ)

The main entity with state transitions is the Procurement Announcement.

```mermaid
stateDiagram-v2
    [*] --> Draft: Admin creates announcement

    Draft --> PendingReview: Submit for review
    Draft --> Draft: Edit details

    PendingReview --> Open: Approve & Publish
    PendingReview --> Draft: Reject (needs changes)

    Open --> Urgent: Deadline approaching<br/>(< 3 days)
    Open --> Closing: Deadline approaching<br/>(< 7 days)
    Open --> Closed: Deadline passed
    Open --> Hidden: Admin hides

    Urgent --> Closed: Deadline passed
    Urgent --> Hidden: Admin hides

    Closing --> Urgent: Deadline < 3 days
    Closing --> Closed: Deadline passed
    Closing --> Hidden: Admin hides

    Hidden --> Open: Admin unhides<br/>(if deadline not passed)
    Hidden --> Closed: Admin unhides<br/>(if deadline passed)

    Closed --> [*]: Archived

    state Open {
        [*] --> AcceptingProposals
        AcceptingProposals --> DocumentsAvailable: TOR uploaded
        DocumentsAvailable --> AcceptingProposals
    }

    note right of Draft
        สถานะ: ร่าง
        Admin กำลังสร้าง/แก้ไข
    end note

    note right of Open
        สถานะ: เปิดรับข้อเสนอ
        ผู้ประกอบการสามารถ
        ดูและดาวน์โหลดเอกสารได้
    end note

    note right of Urgent
        สถานะ: เร่งด่วน
        ใกล้หมดเวลารับสมัคร
        (< 3 วัน)
    end note

    note right of Closing
        สถานะ: ใกล้ปิด
        ใกล้หมดเวลา
        (< 7 วัน)
    end note

    note right of Closed
        สถานะ: ปิดรับสมัคร
        หมดเวลารับข้อเสนอแล้ว
    end note

    note right of Hidden
        สถานะ: ซ่อน
        ไม่แสดงในรายการค้นหา
    end note
```

### Announcement Status Definitions

| Status           | Thai           | Description                     | User Can View | User Can Download |
| ---------------- | -------------- | ------------------------------- | ------------- | ----------------- |
| `draft`          | ร่าง           | Being created/edited by admin   | ❌            | ❌                |
| `pending_review` | รอตรวจสอบ      | Submitted for approval          | ❌            | ❌                |
| `open`           | เปิดรับข้อเสนอ | Active and accepting proposals  | ✅            | ✅                |
| `urgent`         | เร่งด่วน       | Deadline approaching (< 3 days) | ✅            | ✅                |
| `closing`        | ใกล้ปิด        | Deadline approaching (< 7 days) | ✅            | ✅                |
| `closed`         | ปิดรับสมัคร    | Deadline has passed             | ✅            | ✅ (view results) |
| `hidden`         | ซ่อน           | Temporarily hidden by admin     | ❌            | ❌                |

---

## 2. User Account State (สถานะบัญชีผู้ใช้)

```mermaid
stateDiagram-v2
    [*] --> Registered: User signs up

    Registered --> EmailPending: Account created

    EmailPending --> EmailVerified: Click verification link
    EmailPending --> EmailPending: Resend verification
    EmailPending --> Expired: Link expires (24h)

    Expired --> EmailPending: Request new link

    EmailVerified --> Active: Account ready

    Active --> TwoFactorPending: Enable 2FA
    Active --> PasswordReset: Request reset
    Active --> Deleted: Delete account

    TwoFactorPending --> TwoFactorEnabled: Confirm with code
    TwoFactorPending --> Active: Cancel 2FA setup

    TwoFactorEnabled --> Active: Disable 2FA
    TwoFactorEnabled --> PasswordReset: Request reset
    TwoFactorEnabled --> Deleted: Delete account

    PasswordReset --> Active: Password changed
    PasswordReset --> TwoFactorEnabled: Password changed<br/>(if 2FA enabled)

    Deleted --> [*]: Account removed

    note right of Registered
        ลงทะเบียนสำเร็จ
        รอยืนยันอีเมล
    end note

    note right of EmailVerified
        ยืนยันอีเมลแล้ว
        พร้อมใช้งาน
    end note

    note right of TwoFactorEnabled
        เปิดใช้ 2FA แล้ว
        ความปลอดภัยสูง
    end note
```

### User Account State Definitions

| State                | Thai            | Description                         |
| -------------------- | --------------- | ----------------------------------- |
| `registered`         | ลงทะเบียนแล้ว   | Account created, email not verified |
| `email_pending`      | รอยืนยันอีเมล   | Verification email sent             |
| `email_verified`     | ยืนยันอีเมลแล้ว | Email verified, account active      |
| `active`             | ใช้งานได้       | Full account access                 |
| `two_factor_pending` | รอตั้งค่า 2FA   | 2FA setup in progress               |
| `two_factor_enabled` | เปิด 2FA แล้ว   | 2FA enabled and confirmed           |
| `password_reset`     | รีเซ็ตรหัสผ่าน  | Password reset in progress          |
| `deleted`            | ลบแล้ว          | Account deleted                     |

---

## 3. Authentication Session State (สถานะการเข้าสู่ระบบ)

```mermaid
stateDiagram-v2
    [*] --> Guest: Visit site

    Guest --> Authenticating: Submit credentials

    Authenticating --> CredentialsInvalid: Wrong email/password
    Authenticating --> TwoFactorRequired: 2FA enabled
    Authenticating --> Authenticated: 2FA not enabled

    CredentialsInvalid --> Guest: Return to login
    CredentialsInvalid --> Locked: Too many attempts (5)

    Locked --> Guest: Wait 15 minutes

    TwoFactorRequired --> TwoFactorChallenge: Show 2FA page

    TwoFactorChallenge --> TwoFactorInvalid: Wrong code
    TwoFactorChallenge --> Authenticated: Valid code
    TwoFactorChallenge --> RecoveryMode: Use recovery code

    TwoFactorInvalid --> TwoFactorChallenge: Try again
    TwoFactorInvalid --> Locked: Too many attempts

    RecoveryMode --> Authenticated: Valid recovery code
    RecoveryMode --> TwoFactorChallenge: Invalid code

    Authenticated --> SessionActive: Create session

    SessionActive --> Guest: Logout
    SessionActive --> SessionExpired: Timeout (2h inactivity)
    SessionActive --> SessionActive: Activity (extend)

    SessionExpired --> Guest: Redirect to login

    note right of Guest
        ผู้เยี่ยมชม
        ยังไม่ได้เข้าสู่ระบบ
    end note

    note right of Authenticated
        ยืนยันตัวตนสำเร็จ
        กำลังสร้าง session
    end note

    note right of SessionActive
        เข้าสู่ระบบแล้ว
        ใช้งานได้ตามปกติ
    end note

    note right of Locked
        ถูกล็อค
        ลองผิดหลายครั้ง
    end note
```

---

## 4. Alert/Notification State (สถานะการแจ้งเตือน)

```mermaid
stateDiagram-v2
    [*] --> Created: User creates alert

    Created --> Active: Save alert

    Active --> Triggered: Matching announcement found
    Active --> Disabled: User disables
    Active --> Deleted: User deletes
    Active --> Active: Edit criteria

    Triggered --> Sending: Process notification

    Sending --> EmailSent: Email channel enabled
    Sending --> InAppSent: In-app channel enabled
    Sending --> SMSSent: SMS channel enabled (Pro)

    EmailSent --> Delivered: Email sent
    EmailSent --> Failed: Send error

    InAppSent --> Delivered: Notification shown

    SMSSent --> Delivered: SMS sent
    SMSSent --> Failed: Send error

    Failed --> Retry: Auto retry
    Retry --> Sending: Retry attempt
    Retry --> PermanentFail: Max retries (3)

    Delivered --> Active: Wait for next match
    PermanentFail --> Active: Log error, continue

    Disabled --> Active: User enables
    Disabled --> Deleted: User deletes

    Deleted --> [*]: Alert removed

    note right of Active
        เปิดใช้งาน
        รอประกาศที่ตรงเงื่อนไข
    end note

    note right of Triggered
        พบประกาศที่ตรงเงื่อนไข
        กำลังส่งการแจ้งเตือน
    end note

    note right of Disabled
        ปิดการใช้งานชั่วคราว
        ไม่ส่งการแจ้งเตือน
    end note
```

### Alert State Definitions

| State       | Thai         | Description                 |
| ----------- | ------------ | --------------------------- |
| `created`   | สร้างแล้ว    | Alert criteria defined      |
| `active`    | เปิดใช้งาน   | Monitoring for matches      |
| `triggered` | ตรงเงื่อนไข  | Matching announcement found |
| `sending`   | กำลังส่ง     | Processing notifications    |
| `delivered` | ส่งแล้ว      | Notification delivered      |
| `failed`    | ส่งไม่สำเร็จ | Delivery failed             |
| `disabled`  | ปิดใช้งาน    | Temporarily disabled        |
| `deleted`   | ลบแล้ว       | Alert removed               |

---

## 5. Document/Attachment State (สถานะเอกสาร)

```mermaid
stateDiagram-v2
    [*] --> Uploading: Admin uploads file

    Uploading --> Processing: File received
    Uploading --> UploadFailed: Upload error

    UploadFailed --> Uploading: Retry upload

    Processing --> Scanning: Virus scan

    Scanning --> ScanFailed: Malware detected
    Scanning --> Validated: Clean file

    ScanFailed --> [*]: File rejected

    Validated --> Available: Attach to announcement

    Available --> Downloaded: User downloads
    Available --> Replaced: Admin uploads new version
    Available --> Deleted: Admin removes

    Downloaded --> Available: Download complete

    Replaced --> Available: New version active
    Replaced --> Archived: Old version archived

    Archived --> [*]: Permanently stored

    Deleted --> [*]: File removed

    note right of Uploading
        กำลังอัปโหลด
    end note

    note right of Available
        พร้อมดาวน์โหลด
    end note

    note right of Downloaded
        มีการดาวน์โหลด
        บันทึกกิจกรรม
    end note
```

---

## 6. Filter/Search State (สถานะการกรองค้นหา)

```mermaid
stateDiagram-v2
    [*] --> Initial: Page loaded

    Initial --> Filtering: User applies filter

    state Filtering {
        [*] --> QueryInput
        QueryInput --> BudgetFilter: Set budget range
        BudgetFilter --> OrgFilter: Select organizations
        OrgFilter --> MethodFilter: Select methods
        MethodFilter --> CategoryFilter: Select categories
        CategoryFilter --> SortSelect: Choose sort order
        SortSelect --> [*]
    }

    Filtering --> Filtered: Filters applied

    Filtered --> ResultsEmpty: No matches
    Filtered --> ResultsFound: Matches found

    ResultsFound --> Paginating: Multiple pages
    ResultsFound --> Viewing: Single page

    Paginating --> PageChanged: Navigate pages
    PageChanged --> Viewing: Show page

    Viewing --> Filtering: Modify filters
    Viewing --> DetailView: Click announcement
    Viewing --> SaveSearch: Save current search

    ResultsEmpty --> Filtering: Adjust filters
    ResultsEmpty --> ClearFilters: Clear all

    ClearFilters --> Initial: Reset to default

    SaveSearch --> Viewing: Search saved

    DetailView --> Viewing: Back to results

    note right of Initial
        เริ่มต้น
        แสดงประกาศทั้งหมด
    end note

    note right of Filtered
        กรองแล้ว
        แสดงผลตามเงื่อนไข
    end note

    note right of SaveSearch
        บันทึกการค้นหา
        ใช้ซ้ำได้
    end note
```

---

## 7. Timeline Item State (สถานะไทม์ไลน์)

Used for announcement schedules and activity timelines.

```mermaid
stateDiagram-v2
    [*] --> Upcoming: Future event

    Upcoming --> Current: Date reached
    Upcoming --> Upcoming: Time passes

    Current --> Completed: Event finished
    Current --> Current: In progress

    Completed --> [*]: Event done

    note right of Upcoming
        กำหนดการล่วงหน้า
        ยังไม่ถึงวัน
    end note

    note right of Current
        กำลังดำเนินการ
        อยู่ในช่วงเวลานี้
    end note

    note right of Completed
        เสร็จสิ้นแล้ว
        ผ่านไปแล้ว
    end note
```

### Timeline Status Values

| Status      | Thai             | Visual Indicator |
| ----------- | ---------------- | ---------------- |
| `upcoming`  | กำหนดการล่วงหน้า | Gray dot         |
| `current`   | กำลังดำเนินการ   | Blue/Primary dot |
| `completed` | เสร็จสิ้น        | Green dot        |

---

## Summary: Key State Transitions

| Entity            | Primary States                     | Trigger Events                   |
| ----------------- | ---------------------------------- | -------------------------------- |
| **Announcement**  | draft → open → closed              | Admin actions, Time-based        |
| **User Account**  | registered → verified → active     | User actions, Email verification |
| **Auth Session**  | guest → authenticating → active    | Login/Logout actions             |
| **Alert**         | active → triggered → delivered     | Matching announcements           |
| **Document**      | uploading → available → downloaded | Upload/Download actions          |
| **Search Filter** | initial → filtering → filtered     | User filter selections           |
| **Timeline**      | upcoming → current → completed     | Time-based progression           |
