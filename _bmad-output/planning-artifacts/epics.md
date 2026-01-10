---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
workflowType: 'epics-and-stories'
project_name: 'system SWI'
user_name: 'Iman'
date: '2026-01-09'
status: complete
completedAt: '2026-01-09T15:02:30+07:00'
totalEpics: 10
totalStories: 56
---

# system SWI - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for system SWI, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

---

## Requirements Inventory

### Functional Requirements (74 FRs)

**1. Authentication & Authorization (FR1-FR7)**
- FR1: User dapat login menggunakan Google OAuth
- FR2: System dapat membedakan akses berdasarkan role (CEO, COO, Komisaris, Panitia, Freelancer)
- FR3: CEO dan COO memiliki mutual access ke semua fitur operasional
- FR4: Komisaris hanya dapat view-only pada reports dan dashboards
- FR5: Panitia hanya dapat mengakses Event CDE yang relevan
- FR6: Freelancer dapat di-invite untuk akses data tertentu (tax, BPJS)
- FR7: System dapat logout user dan invalidate session

**2. Dashboard & Overview (FR8-FR13)**
- FR8: CEO/COO dapat melihat dashboard overview
- FR9: Dashboard menampilkan jumlah konten pending review
- FR10: Dashboard menampilkan status event preparation progress
- FR11: Dashboard menampilkan ringkasan financial (cash flow)
- FR12: Dashboard menampilkan setoran modal pemegang saham
- FR13: Komisaris dapat melihat quarterly review dashboard

**3. AI Chat & Assistance (FR14-FR22)**
- FR14: User dapat chat dengan AI untuk prioritas harian
- FR15: AI dapat memberikan prioritas task
- FR16: User dapat request AI untuk generate dokumen
- FR17: AI dapat menarik data historis dari Google Drive
- FR18: AI dapat trigger n8n workflow via chat
- FR19: AI dapat belajar dari user corrections
- FR20: AI dapat merangkum risalah rapat
- FR21: AI multimodal dapat process audio/image/document
- FR22: User dapat request untuk dibuatkan konten

**4. Google Drive & Sheets Integration (FR23-FR30)**
- FR23: System dapat browse dan search file di Google Drive
- FR24: System dapat membuat folder struktur otomatis
- FR25: System dapat upload file ke folder yang sesuai
- FR26: System dapat preview dokumen tanpa download
- FR27: User dapat browsing file manual sebagai fallback
- FR28: System dapat CRUD data di Google Sheets
- FR29: AI dapat read/write data dari Sheets database
- FR30: System dapat detect dan alert jika Sheets mendekati limit

**5. Event CDE (FR31-FR41)**
- FR31: COO dapat membuat event baru
- FR32: System otomatis generate folder struktur
- FR33: COO dapat assign panitia ke divisi event
- FR34: Panitia dapat melihat task list
- FR35: Panitia dapat upload file untuk task completion
- FR36: System dapat collect dan store KTP panitia
- FR37: COO dapat manage RAB event
- FR38: System dapat track gaji/upah panitia
- FR39: System dapat track progress per divisi event
- FR40: COO dapat melihat overall progress dashboard
- FR41: System dapat send reminder ke panitia

**6. Document Generator (FR42-FR47)**
- FR42: User dapat generate proposal sponsor
- FR43: User dapat generate laporan dari template
- FR44: System dapat pull data historis
- FR45: User dapat preview dokumen sebelum finalize
- FR46: System mencatat dan track nomor surat
- FR47: System auto-generate nomor surat

**7. Public Company Profile (FR48-FR52)**
- FR48: Public visitor dapat melihat about
- FR49: Public visitor dapat melihat portfolio event
- FR50: Public visitor dapat melihat produk
- FR51: Public visitor dapat melihat upcoming events
- FR52: Content ter-update otomatis dari backend

**8. Automation & Workflow (FR53-FR58)**
- FR53: User dapat request post ke Instagram via chat
- FR54: User dapat request upload YouTube via chat
- FR55: System mengirim preview ke Telegram
- FR56: User dapat confirm/reject via Telegram bot
- FR57: System dapat execute n8n workflow
- FR58: System dapat escalate Telegram approval

**9. Reports, Compliance & Financial (FR59-FR69)**
- FR59: System dapat display laporan pajak
- FR60: System dapat display BPJS compliance
- FR61: Dokumen legal tersimpan dan accessible
- FR62: Komisaris dapat access financial reports
- FR63: Freelancer dapat access data untuk laporan
- FR64: System dapat track revenue per pilar
- FR65: System otomatis calculate 30% setoran ke Holding
- FR66: Dashboard menampilkan total setoran ke Holding
- FR67: System dapat track status setoran
- FR68: System mencatat audit log
- FR69: System mencatat approval history

**10. HELP, Tutorial & System (FR70-FR74)**
- FR70: User dapat access contextual help
- FR71: System dapat guide user baru
- FR72: User dapat access documentation
- FR73: System dapat send in-app notifications
- FR74: Admin dapat view AI learning log

---

### Non-Functional Requirements

**Performance:**
- Dashboard load: <3 seconds
- AI Chat response: <5 seconds
- File search: <2 seconds
- Concurrent users: 10

**Security:**
- Google OAuth 2.0 only
- TLS 1.3, AES-256
- JWT tokens, rate limiting

**Scalability:**
- Users: 5-10 → 50
- Events/year: 1-2 → 10
- Extractable modules

**Accessibility:**
- WCAG 2.1 AA
- Keyboard navigation
- ARIA labels

---

### Additional Requirements (from Architecture)

**Starter Template:**
- Next.js 14+ with App Router
- Tailwind CSS + shadcn/ui
- TypeScript strict mode

**Tech Stack:**
- Database: Google Drive API
- Auth: Google OAuth
- State: Zustand
- Fetching: SWR
- Validation: Zod
- Deploy: Vercel

**Testing:**
- Unit: Vitest
- Component: Testing Library
- E2E: Playwright

**Patterns:**
- Rate limiting (100 req/min)
- Optimistic updates
- Feature flags
- Accessibility (focus, ARIA)

---

### Additional Requirements (from UX)

**Design System:**
- shadcn/ui components
- Split View layout
- Responsive breakpoints

**Custom Components:**
- ChatPanel (P0)
- DashboardCard (P0)
- EventCard (P0)
- FileExplorer (P1)
- TelegramPreview (P1)

**UX Patterns:**
- Button hierarchy
- Feedback patterns
- Form validation
- Empty/loading states

---

## FR Coverage Map

| FR Range | Epic | Description |
|----------|------|-------------|
| FR1-7 | Epic 1 | Auth & Role Management |
| FR8-13 | Epic 2 | Dashboard & Overview |
| FR23-27 | Epic 3 | Drive Browsing |
| FR28-30 | Epic 4 | Sheets Integration |
| FR14-22 | Epic 5 | AI Chat Assistant |
| FR31-41 | Epic 6 | Event CDE |
| FR42-47 | Epic 7 | Document Generator |
| FR48-52 | Epic 8 | Public Company Profile |
| FR53-58 | Epic 9 | Automation & Workflows |
| FR59-67 | Epic 10 | Reports & Financial |
| FR68-69 | Cross | Audit & Compliance |
| FR70-74 | Cross | HELP (integrated per-epic) |

---

## Epic List

### Phase 1: Core Platform

#### Epic 1: Auth & Role Management
Users can login with Google OAuth and access features based on their role (CEO, COO, Komisaris, Panitia, Freelancer).
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7

#### Epic 2: Dashboard & Overview
CEO/COO can see operational summary, pending content, event progress, and financial overview.
**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13

#### Epic 3: Drive Browsing
Users can browse, search, and preview files in Google Drive.
**FRs covered:** FR23, FR24, FR25, FR26, FR27

#### Epic 4: Sheets Integration
System can read/write data to Google Sheets as database.
**FRs covered:** FR28, FR29, FR30

---

### Phase 2: Primary Features

#### Epic 5: AI Chat Assistant
Users can chat with AI for daily priorities, document generation, and workflow triggers.
**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22

#### Epic 6: Event CDE
COO can create events, assign panitia, track progress, and manage budgets.
**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41

#### Epic 7: Document Generator
Users can generate proposals and reports from templates with auto-numbering.
**FRs covered:** FR42, FR43, FR44, FR45, FR46, FR47

---

### Phase 3: Secondary Features

#### Epic 8: Public Company Profile
Public visitors can view auto-updated company information.
**FRs covered:** FR48, FR49, FR50, FR51, FR52

#### Epic 9: Automation & Workflows
Users can trigger social media posts and workflows via chat with Telegram approval.
**FRs covered:** FR53, FR54, FR55, FR56, FR57, FR58

#### Epic 10: Reports & Financial
Stakeholders can access financial reports, tax documents, and compliance status.
**FRs covered:** FR59, FR60, FR61, FR62, FR63, FR64, FR65, FR66, FR67

---

### Cross-Cutting Concerns

#### Audit & Compliance
All financial operations have audit logs and approval history.
**FRs covered:** FR68, FR69
**Applied to:** Epic 6, Epic 10

#### HELP & Contextual Guide
Contextual help integrated into each epic, not separate.
**FRs covered:** FR70, FR71, FR72, FR73, FR74
**Applied to:** All epics

---

# Story Details

## Epic 1: Auth & Role Management

### Story 1.1: Project Setup & Starter
*As a* developer, *I want* the project initialized with Next.js + shadcn/ui, *So that* I have a working foundation.

**Acceptance Criteria:**
- **Given** no project exists **When** I run starter command **Then** Next.js 14+ App Router is set up with Tailwind + shadcn/ui

### Story 1.2: Google OAuth Login
*As a* user, *I want* to login using my Google account, *So that* I can access the system securely.

**Acceptance Criteria:**
- **Given** I am on login page **When** I click "Login with Google" **Then** I am redirected to Google OAuth and then to dashboard

### Story 1.3: User Session Management
*As a* user, *I want* to logout and have my session invalidated, *So that* my account remains secure.

**Acceptance Criteria:**
- **Given** I am logged in **When** I click "Logout" **Then** session is invalidated and I cannot access protected routes

### Story 1.4: Role-Based Access Control
*As a* system admin, *I want* users to have role-based access, *So that* each role sees only relevant features.

**Acceptance Criteria:**
- **Given** user with role **When** they access system **Then** they see only features for their role (CEO/COO: all, Komisaris: view-only, Panitia: Event CDE)

### Story 1.5: Freelancer Invite System
*As a* CEO/COO, *I want* to invite freelancers with limited access, *So that* external consultants can access specific data.

**Acceptance Criteria:**
- **Given** I am CEO/COO **When** I invite freelancer **Then** they receive invite link and can only access specified data

---

## Epic 2: Dashboard & Overview

### Story 2.1: Dashboard Layout
*As a* CEO/COO, *I want* to see a dashboard overview, *So that* I can quickly understand operational status.

### Story 2.2: Pending Content Widget
*As a* CEO/COO, *I want* to see pending content count, *So that* I know what needs review.

### Story 2.3: Event Progress Widget
*As a* CEO/COO, *I want* to see event preparation progress, *So that* I can track event readiness.

### Story 2.4: Financial Overview Widget
*As a* CEO/COO, *I want* to see financial summary, *So that* I understand cash flow at a glance.

### Story 2.5: Komisaris Quarterly View
*As a* Komisaris, *I want* to see quarterly review dashboard, *So that* I can monitor company performance.

---

## Epic 3: Drive Browsing

### Story 3.1: Drive File Browser
### Story 3.2: File Search
### Story 3.3: Document Preview
### Story 3.4: Auto Folder Creation
### Story 3.5: Manual File Upload

---

## Epic 4: Sheets Integration

### Story 4.1: Sheets Connection
### Story 4.2: Sheets CRUD Operations
### Story 4.3: Sheets Limit Alert

---

## Epic 5: AI Chat Assistant

### Story 5.1: Chat Interface
### Story 5.2: AI Priority Response
### Story 5.3: AI Document Generation
### Story 5.4: AI Drive Context
### Story 5.5: AI Workflow Trigger
### Story 5.6: AI Learning (Self-Annealing)
### Story 5.7: AI Multimodal Input

---

## Epic 6: Event CDE

### Story 6.1: Create Event
### Story 6.2: Assign Panitia
### Story 6.3: Panitia Task View
### Story 6.4: Panitia File Upload
### Story 6.5: KTP Collection
### Story 6.6: RAB Management
### Story 6.7: Panitia Payment Tracking
### Story 6.8: Division Progress Tracking
### Story 6.9: Overall Event Dashboard
### Story 6.10: Panitia Reminders

---

## Epic 7: Document Generator

### Story 7.1: Proposal Generator
### Story 7.2: Report Generator
### Story 7.3: Historical Data Pull
### Story 7.4: Document Preview
### Story 7.5: Letter Numbering System

---

## Epic 8: Public Company Profile

### Story 8.1: About Page
### Story 8.2: Portfolio Page
### Story 8.3: Products Page
### Story 8.4: Upcoming Events Page
### Story 8.5: Auto-Content Sync

---

## Epic 9: Automation & Workflows

### Story 9.1: Instagram Post Request
### Story 9.2: YouTube Upload Request
### Story 9.3: Telegram Preview
### Story 9.4: Telegram Approval Flow
### Story 9.5: n8n Workflow Execution
### Story 9.6: Approval Escalation

---

## Epic 10: Reports & Financial

### Story 10.1: Tax Reports Display
### Story 10.2: BPJS Compliance Status
### Story 10.3: Legal Documents Access
### Story 10.4: Financial Reports Access
### Story 10.5: Freelancer Data Access
### Story 10.6: Revenue Tracking
### Story 10.7: Holding Setoran Calculation
### Story 10.8: Setoran Status Tracking
### Story 10.9: Audit Log (Cross-Cutting)

---

# Summary

**Total Epics:** 10
**Total Stories:** 56
**All 74 FRs covered:** ✅
