# Architecture Documentation

## Khon Kaen Procurement Documents Portal

## ระบบค้นหาประกาศจัดซื้อจัดจ้างจังหวัดขอนแก่น

This folder contains UML diagrams documenting the system architecture using Mermaid syntax.

---

## 📁 Diagram Files

| File                                         | Diagram Type      | Description                                     |
| -------------------------------------------- | ----------------- | ----------------------------------------------- |
| [use-case-diagram.md](./use-case-diagram.md) | Use-Case Diagram  | Actors and their interactions with the system   |
| [class-diagram.md](./class-diagram.md)       | Class Diagram     | Classes, attributes, methods, and relationships |
| [sequence-diagram.md](./sequence-diagram.md) | Sequence Diagrams | Request flows and component interactions        |
| [state-diagram.md](./state-diagram.md)       | State Diagrams    | Entity lifecycles and state transitions         |

---

## 🎭 System Overview

### Actors (ผู้ใช้งาน)

| Actor               | Role            | Key Capabilities                              |
| ------------------- | --------------- | --------------------------------------------- |
| **Guest User**      | ผู้เยี่ยมชม     | Search, view announcements, register          |
| **Registered User** | ผู้ใช้งานทั่วไป | Save searches, set alerts, download documents |
| **Administrator**   | ผู้ดูแลระบบ     | Manage announcements, users, system settings  |

### Core Features (ฟีเจอร์หลัก)

1. **Procurement Search & Discovery**
    - Full-text search by keywords, project ID, organization
    - Multi-criteria filtering (budget, organization, method, category)
    - Real-time results with pagination

2. **User Dashboard**
    - Track followed announcements
    - View browsing history
    - Manage saved searches
    - Configure alert notifications

3. **Admin Portal**
    - CRUD operations on announcements
    - Document management (TOR, attachments)
    - User management
    - Analytics and reporting

4. **Authentication & Security**
    - Email/password authentication
    - Two-factor authentication (TOTP)
    - Email verification
    - Password recovery

---

## 🏗️ Technology Stack

| Layer              | Technology                        |
| ------------------ | --------------------------------- |
| **Frontend**       | React 19, TypeScript, TailwindCSS |
| **Backend**        | Laravel 11, PHP 8.x               |
| **Bridge**         | Inertia.js                        |
| **Database**       | MySQL/PostgreSQL                  |
| **Authentication** | Laravel Fortify                   |
| **UI Components**  | Radix UI, Lucide Icons            |

---

## 📊 Viewing the Diagrams

### Option 1: GitHub/GitLab

Most Git platforms render Mermaid diagrams automatically in markdown files.

### Option 2: VS Code

Install the "Markdown Preview Mermaid Support" extension.

### Option 3: Online Tools

- [Mermaid Live Editor](https://mermaid.live/)
- [Mermaid.ink](https://mermaid.ink/)

### Option 4: Documentation Tools

- Docusaurus
- MkDocs with mermaid2 plugin
- Notion (supports Mermaid)

---

## 📝 Diagram Descriptions

### 1. Use-Case Diagram

Documents all system use cases organized by:

- Authentication System
- Procurement Search & Discovery
- User Features
- Profile & Settings
- Admin Features

### 2. Class Diagram

Shows the object-oriented structure including:

- Core Domain Models (User, Announcement, Organization)
- User Feature Classes (Alert, SavedSearch, ActivityItem)
- Backend Controllers
- Frontend Components
- Enumerations

### 3. Sequence Diagrams

Illustrates key interaction flows:

- User Authentication (Login with 2FA)
- User Registration
- Procurement Search & Filter
- View Announcement Detail
- Profile Update
- Two-Factor Setup
- Alert Management
- Admin Announcement CRUD
- Document Download

### 4. State Diagrams

Documents entity lifecycles:

- Announcement Status (draft → open → closed)
- User Account State (registered → verified → active)
- Authentication Session
- Alert/Notification State
- Document/Attachment State
- Filter/Search State
- Timeline Item State

---

## 🔄 Keeping Diagrams Updated

When making changes to the system:

1. **Adding new features** → Update Use-Case Diagram
2. **Adding new classes/types** → Update Class Diagram
3. **Changing request flows** → Update Sequence Diagrams
4. **Adding stateful entities** → Update State Diagrams

---

## 📚 Related Documentation

- [Laravel Documentation](https://laravel.com/docs)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Mermaid Documentation](https://mermaid.js.org/intro/)
- [React Documentation](https://react.dev/)
