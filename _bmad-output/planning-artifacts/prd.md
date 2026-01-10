---
stepsCompleted: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-system-SWI-2026-01-08.md"
workflowType: 'prd'
lastStep: 11
status: 'complete'
completedAt: '2026-01-08T22:44:00+07:00'
date: 2026-01-08
author: Iman
project: system SWI
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
---

# Product Requirements Document - system SWI

**Author:** Iman
**Date:** 2026-01-08

---

## Executive Summary

**system SWI** adalah platform dual-layer yang menggabungkan **company profile website** (public) dengan **AI-powered internal workspace** (authenticated) untuk mentransformasi Sensasi Wangi Indonesia (SWI) menjadi perusahaan terdepan di industri parfum Indonesia.

**Layer 1 - Company Profile (Public):**
Website perusahaan profesional yang auto-update dari backend — menampilkan informasi terkini tentang SWI, produk, event, dan konten media tanpa perlu maintenance manual.

**Layer 2 - Ruang Kerja (Authenticated):**
Internal operational hub dengan **interactive dashboard** yang mengintegrasikan **Google Drive**, **n8n automation**, dan **OpenRouter AI** untuk menyederhanakan operasional 4 pilar bisnis: **Media, Komunitas, Event, dan Retail (MAKER)**.

### What Makes This Special

| Differentiator | Description |
|----------------|-------------|
| **Dual-Layer Architecture** | Public company profile + authenticated workspace |
| **Auto-Update Public Site** | Company profile sync dengan backend data |
| **Interactive Dashboard** | Central hub dengan visualisasi real-time |
| **AI-Powered Assistance** | Tanya AI untuk prioritas harian dan document generation |
| **Cost-Efficient Stack** | Google Drive + n8n + OpenRouter (gratis/murah) |
| **Extractable Design** | Potential SaaS jika terbukti berhasil |

## Project Classification

| Aspect | Value |
|--------|-------|
| **Technical Type** | web_app (SPA with public + authenticated routes) |
| **Domain** | general (internal business operations) |
| **Complexity** | medium |
| **Project Context** | Greenfield - new project |

Platform ini menggunakan pendekatan modern web application dengan fokus pada user experience yang intuitif dan automation yang kuat untuk mendukung operasional harian SWI.

---

## Success Criteria

### User Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Tool Accuracy** | 95% task completion tanpa error | Weekly tracking |
| **Communication Clarity** | Zero critical miscommunication | Per project review |
| **Document Findability** | < 30 detik untuk menemukan dokumen | User testing |
| **Document Creation Speed** | 50% lebih cepat dari manual | Time comparison |

**Momen "Aha!":** User bertanya ke AI "Apa yang harus saya kerjakan hari ini?" dan mendapat prioritas yang actionable.

### Business Success

| Objective | Timeline | Target |
|-----------|----------|--------|
| **Media Consistency** | Monthly | Publish konten sesuai jadwal |
| **Revenue Growth** | Quarterly | Increase retail revenue |
| **Transparency** | Ongoing | 100% visibility laporan keuangan/operasional |
| **Sponsor Acquisition** | Nov 2026 | Minimal 1 sponsor baru untuk event |

### Technical Success

| Metric | Target |
|--------|--------|
| **System Availability** | 99% uptime during business hours |
| **Response Time** | < 3 detik untuk halaman load |
| **Data Sync** | Real-time sync Google Drive ↔ System |
| **Security** | Role-based access control implemented |

### Measurable Outcomes

- **3 Months:** Tim inti menggunakan sistem daily, 80% adoption
- **6 Months:** Event preparation fully managed via system
- **12 Months:** All 4 MAKER pillars operational with automation

---

## Product Scope

### MVP - Minimum Viable Product

| Feature | Priority | Must Work |
|---------|----------|-----------|
| Dashboard Overview | ⭐ High | Central hub dengan overview |
| AI Chat Assistant | ⭐ High | Prioritas harian & assistance |
| Event CDE | ⭐ Critical | Koordinasi panitia |
| Google Drive Integration | ⭐ Critical | Single source of truth |
| Document Generator | ⭐ High | Proposal & reports |
| Media Content Calendar | ⭐ High | Content planning |
| Company Reports Viewer | ⭐ Medium | Finance & compliance |
| HELP/Tutorial System | ⭐ High | User onboarding |
| Public Company Profile | ⭐ High | Auto-update dari backend |

### Growth Features (Post-MVP)

- Retail multi-channel integration (Tokped, Shopee)
- Advanced analytics & reporting
- Mobile app companion

### Vision (Future)

- Komunitas enhancement untuk sensasiwangi.id
- SaaS extraction untuk industri serupa
- AI agents untuk automated task execution

---

## User Journeys

### Journey 1: Beriman's Morning Command Center

**Karakter:** Beriman (CEO) — Seorang perfumer dengan 6 tahun pengalaman di industri, sekarang menjalankan SWI bersama timnya.

Setiap pagi Beriman membuka laptop dan langsung mengakses **system SWI**. Dua tahun menjalankan bisnis dengan spreadsheet dan WhatsApp yang tersebar membuatnya lelah — selalu ada yang terlewat, selalu ada dokumen yang hilang.

Hari ini berbeda. Dashboard menyapanya dengan ringkasan: **3 konten media perlu direview, 1 proposal sponsor menunggu finalisasi, dan cash flow bulan ini positif 15%.**

Beriman klik AI Chat: *"Apa prioritas hari ini?"*

AI menjawab: *"Prioritas #1: Finalisasi proposal untuk Brand X — deadline besok. Prioritas #2: Review konten YouTube yang sudah masuk dari freelancer. Prioritas #3: Cek progress persiapan event November."*

Dengan satu klik, Beriman membuka Document Generator. Data historis tentang Brand X sudah ter-pull dari Google Drive. Lima belas menit kemudian, proposal sponsor yang profesional sudah siap dikirim.

**Momen Breakthrough:** Saat Beriman menyadari bahwa pekerjaan 2 jam sekarang selesai dalam 15 menit — dan semua data sudah akurat tanpa perlu cari-cari di folder yang berbeda.

---

### Journey 2: Wapiq's Event Preparation Sprint

**Karakter:** Wapiq (COO) — Partner operasional Beriman yang menangani day-to-day execution.

Tiga bulan sebelum event November, Wapiq membuka **Event CDE** untuk pertama kalinya. Sebagai orang yang tidak terlalu tech-savvy, dia awalnya khawatir. Tapi sistem HELP muncul dengan tutorial singkat.

*"Klik di sini untuk membuat event baru. Saya akan memandu Anda."*

Wapiq membuat event *"Fragrance Exhibition 2026"* dan sistem otomatis menghasilkan struktur folder di Google Drive: `/Events/2026/November_Exhibition/` dengan subfolder untuk Panitia, Sponsor, Vendor, dan Dokumentasi.

Setiap minggu, dashboard menunjukkan progress bar: **Vendor: 60% complete. Sponsor: 40% complete. Logistik: 20% complete.**

Ketika ada panitia yang belum update, Wapiq cukup klik nama mereka dan sistem mengirim reminder otomatis.

**Momen Breakthrough:** Saat event hari-H berjalan lancar tanpa drama last-minute seperti tahun lalu — karena semua orang sudah aligned sejak awal.

---

### Journey 3: Raka's Event Committee Experience

**Karakter:** Raka — Volunteer panitia yang direkrut untuk membantu event.

Raka menerima email undangan untuk bergabung sebagai panitia divisi Dokumentasi. Dia klik link, login dengan Google, dan langsung masuk ke portal yang sederhana.

Tidak ada menu yang membingungkan — hanya **task list** yang jelas:
- [ ] Upload foto venue untuk approval
- [ ] Konfirmasi kehadiran photographer
- [ ] Submit budget estimate

Setiap kali Raka menyelesaikan task, progress bar di sistem central ter-update. Wapiq bisa melihat real-time tanpa perlu tanya via WhatsApp.

**Momen Breakthrough:** Raka tidak perlu bertanya *"Ini file-nya taruh di mana?"* karena setiap task sudah terhubung ke folder yang tepat.

---

### Journey 4: Public Visitor Discovering SWI

**Karakter:** Dian — Seorang perfume enthusiast yang mencari informasi tentang workshop parfum.

Dian menemukan **sensasiwangi.id** melalui pencarian Google. Tapi dia penasaran tentang *"siapa sih di balik ini?"*

Dia mengunjungi **system.sensasiwangi.id** (public company profile). Landing page yang elegan menampilkan:
- Tim inti dengan foto profesional
- Portfolio event yang sudah dijalankan
- Produk-produk yang tersedia
- Upcoming events dengan registration link

Semua informasi ini di-update otomatis dari backend — tanpa perlu tim marketing edit website manual.

Dian terkesan dan mendaftar untuk workshop bulan depan.

**Momen Breakthrough:** SWI terlihat sebagai perusahaan profesional, bukan hanya "komunitas parfum biasa".

---

### Journey 5: Malsiaf's Quarterly Review

**Karakter:** Malsiaf (Komisaris) — Investor pasif yang perlu oversight.

Setiap kuartal, Malsiaf login ke sistem untuk review. Dashboardnya berbeda — hanya menampilkan:
- Financial summary (revenue, expenses, profit margin)
- Event performance metrics
- Key decisions yang butuh input

Tidak ada akses ke operational tools — hanya **view-only reports** yang sudah ter-generate otomatis dari data real.

**Momen Breakthrough:** Malsiaf tidak perlu request laporan manual — semua sudah tersedia kapan saja dia butuh.

---

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---------|----------------------|
| Beriman (CEO) | Dashboard overview, AI Chat, Document Generator, Priority system |
| Wapiq (COO) | Event CDE, Progress tracking, Team coordination, Auto-reminder |
| Raka (Panitia) | Limited access portal, Task management, File upload integration |
| Dian (Public) | Company profile page, Auto-updated content, Event registration |
| Malsiaf (Komisaris) | Read-only dashboard, Financial reports, Performance metrics |

---

## Innovation & Novel Patterns

### Core Innovation: AI-First Operational Hub

**Positioning:** system SWI bukan "tool + AI" tapi **AI yang punya tools**. User berinteraksi dengan AI sebagai primary interface, AI orchestrates semua operasi.

### Detected Innovation Areas

**1. AI-Integrated Document Intelligence** ⭐ Primary
AI menarik data historis dari Google Drive dan generate dokumen dengan context akurat — proposal sponsor, laporan, dll.

**2. Conversational Automation via n8n** ⭐ Primary
User trigger complex workflows via chat:
- *"Post konten ini ke Instagram"* → AI prepares → Telegram approval → n8n executes
- *"Upload video YouTube"* → Preview → Confirm via Telegram → Published

**Human-in-the-Loop via Telegram Bot:**
```
User Chat → AI Prepares → Telegram Preview → User Confirms → n8n Executes
```

**3. Extractable Design Pattern**
Defined module boundaries dari awal untuk future SaaS extraction:
- Auth Module (isolatable)
- Event CDE Module (isolatable)
- Media Module (isolatable)
- Report Module (isolatable)

**4. Zero-Cost Enterprise Stack**
Google Drive (free) + n8n (self-hosted) + OpenRouter (free) + Telegram Bot (free)

**5. Dual-Layer Single Codebase**
Public company profile + authenticated workspace dengan auto-sync.

### Validation Approach

| Metric Type | What to Measure |
|-------------|------------------|
| **Intent Accuracy** | Did AI understand user request correctly? |
| **Execution Accuracy** | Did workflow complete successfully? |
| **Adoption** | 80% daily usage by core team in 3 months |

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| AI misinterpretation | Telegram preview + confirm before execute |
| n8n workflow complexity | Start simple, iterate |
| Testing automation | Mock mode: "would have done X" |
| Module coupling | Defined boundaries + interface contracts |

---

## Web Application Specific Requirements

### Project-Type Overview

**Architecture:** Multi-Page Application (MPA)
- Server-Side Rendering untuk SEO pada public pages
- Recommended framework: **Next.js** (App Router) atau **Astro** untuk hybrid SSR/SPA
- Public pages SSR, Workspace pages SPA-like experience

### Technical Architecture Considerations

| Aspect | Approach |
|--------|----------|
| **Rendering** | SSR for public, CSR for workspace |
| **SEO** | Full meta tags, structured data, sitemap |
| **Real-time** | Telegram Bot integration (no WebSocket needed) |
| **Authentication** | Google OAuth (workspace), Public (no auth) |

### Browser Support Matrix

| Browser | Version | Priority |
|---------|---------|----------|
| Chrome | Latest 2 | ⭐ Primary |
| Firefox | Latest 2 | ⭐ Primary |
| Brave | Latest 2 | ⭐ Primary |
| Edge | Latest 2 | ✓ Secondary |
| Safari | Latest 2 | ✓ Secondary |
| Mobile Chrome | Latest | ⭐ Primary |
| Mobile Safari | Latest | ✓ Secondary |

### Responsive Design Strategy

| Breakpoint | Target |
|------------|--------|
| Mobile | 320px - 767px |
| Tablet | 768px - 1023px |
| Desktop | 1024px+ |

**Approach:** Mobile-first responsive design. Public pages optimized for mobile discovery. Workspace optimized for desktop productivity.

### Performance Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Time to Interactive | < 3s |

### SEO Strategy (Public Layer)

| Element | Implementation |
|---------|----------------|
| **Meta Tags** | Dynamic per page (title, description, OG) |
| **Structured Data** | Organization, Events, Products (JSON-LD) |
| **Sitemap** | Auto-generated, submitted to Google |
| **Canonical URLs** | Implemented for all public pages |
| **Mobile-friendly** | Responsive design, mobile-first |

### Accessibility Level

**Target: WCAG 2.1 Level AA** (Standard untuk web profesional)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Full support |
| Screen reader | ARIA labels |
| Color contrast | 4.5:1 minimum |
| Focus indicators | Visible focus states |
| Alt text | Required for images |

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP
**Core Value Proposition:** Dokumentasi lengkap dan terpusat!
**Resource Requirements:** 1-2 developers, ~10 bulan sampai Event November 2026

### MVP Feature Set (Phase 1 - Before Nov 2026)

| Feature | Priority | Status |
|---------|----------|--------|
| Google Drive Integration | ⭐⭐⭐ CRITICAL | Day 1 |
| Event CDE | ⭐⭐⭐ CRITICAL | Day 1 |
| Basic Dashboard | ⭐⭐ HIGH | MVP |
| AI Chat (Basic) | ⭐⭐ HIGH | MVP |
| Public Company Profile | ⭐ MEDIUM | Static first |
| HELP/Tutorial | ⭐ MEDIUM | MVP |

**Manual Fallback Strategy:** User dapat browsing file manual di Google Drive

### Legal & Compliance Requirements

| Aspect | Requirement |
|--------|-------------|
| Pajak | Track dan display laporan pajak perusahaan |
| BPJS | Compliance reporting untuk karyawan/freelancer |
| Undang-undang | Dokumen legal tersimpan rapi dan accessible |
| Data Privacy | Sesuai regulasi Indonesia |

### AI Self-Annealing Architecture

**Prinsip:** Setiap bagian AI agent dapat mempelajari hal-hal baru dan auto-improve.

```
Error → Log to Learning DB → Pattern Match → Auto-Fix OR Escalate
```

| Component | Self-Annealing Behavior |
|-----------|------------------------|
| Error Recovery | Log errors → Pattern match → Auto-fix if known |
| User Feedback | Track user corrections → Update AI responses |
| Workflow Learning | Monitor workflow success → Optimize over time |

### Post-MVP Features

**Phase 2 (After Event Nov 2026):**
- Document Generator (Advanced)
- Media Content Calendar
- Company Reports Viewer (Financial/Tax)
- **Production Planning Module:**
  - Modal/Capital tracking
  - Batch parfum planning
  - Cost calculator (bahan, packaging, aksesoris, marketing)
  - Marketplace fee calculation (Tokped ~5%, Shopee ~4%)
  - Pricing suggestions
  - Revenue vs Expense dashboard (Planned vs Actual)

**Phase 3 (2027+):**
- Retail multi-channel integration
- Komunitas enhancement
- SaaS extraction

### Risk Mitigation Strategy

| Risk Type | Risk | Mitigation |
|-----------|------|------------|
| Technical | AI accuracy | Telegram human-in-the-loop |
| Technical | Integration breaks | Manual fallback di Google Drive |
| Market | Team tidak adopt | HELP system, simple UX |
| Resource | Dev capacity | Prioritize Event CDE |
| Compliance | Legal gaps | Dedicated legal docs section |

---

## Functional Requirements

### 1. Authentication & Authorization

- **FR1:** User dapat login menggunakan Google OAuth
- **FR2:** System dapat membedakan akses berdasarkan role (CEO, COO, Komisaris, Panitia, Freelancer)
- **FR3:** CEO dan COO memiliki mutual access ke semua fitur operasional
- **FR4:** Komisaris hanya dapat view-only pada reports dan dashboards
- **FR5:** Panitia hanya dapat mengakses Event CDE yang relevan
- **FR6:** Freelancer dapat di-invite untuk akses data tertentu (tax, BPJS)
- **FR7:** System dapat logout user dan invalidate session

### 2. Dashboard & Overview

- **FR8:** CEO/COO dapat melihat dashboard overview dengan ringkasan operasional
- **FR9:** Dashboard menampilkan jumlah konten pending review
- **FR10:** Dashboard menampilkan status event preparation progress
- **FR11:** Dashboard menampilkan ringkasan financial (cash flow)
- **FR12:** Dashboard menampilkan setoran modal pemegang saham (planned vs actual)
- **FR13:** Komisaris dapat melihat quarterly review dashboard

### 3. AI Chat & Assistance (Multimodal)

- **FR14:** User dapat chat dengan AI untuk bertanya prioritas harian
- **FR15:** AI dapat memberikan prioritas task berdasarkan deadline dan importance
- **FR16:** User dapat request AI untuk generate dokumen
- **FR17:** AI dapat menarik data historis dari Google Drive untuk context
- **FR18:** AI dapat trigger n8n workflow via chat command
- **FR19:** AI dapat belajar dari user corrections (self-annealing)
- **FR20:** AI dapat merangkum risalah rapat dan convert ke tasks/reports
- **FR21:** AI multimodal dapat process audio/image/document (file upload)
- **FR22:** User dapat request untuk dibuatkan konten (media/marketing)

### 4. Google Drive & Sheets Integration

- **FR23:** System dapat browse dan search file di Google Drive
- **FR24:** System dapat membuat folder struktur otomatis untuk event baru
- **FR25:** System dapat upload file ke folder yang sesuai
- **FR26:** System dapat preview dokumen tanpa download
- **FR27:** User dapat browsing file manual sebagai fallback
- **FR28:** System dapat CRUD data di Google Sheets
- **FR29:** AI dapat read/write data dari Sheets database
- **FR30:** System dapat detect dan alert jika Sheets mendekati limit

### 5. Event CDE (Full Lifecycle)

- **FR31:** COO dapat membuat event baru dengan detail (nama, tanggal, lokasi)
- **FR32:** System otomatis generate folder struktur untuk event
- **FR33:** COO dapat assign panitia ke divisi event
- **FR34:** Panitia dapat melihat task list yang di-assign
- **FR35:** Panitia dapat upload file untuk task completion
- **FR36:** System dapat collect dan store KTP panitia
- **FR37:** COO dapat manage RAB (Rencana Anggaran Biaya) event
- **FR38:** System dapat track gaji/upah panitia
- **FR39:** System dapat track progress per divisi event
- **FR40:** COO dapat melihat overall progress dashboard event
- **FR41:** System dapat send reminder ke panitia yang belum update

### 6. Document Generator & Numbering

- **FR42:** User dapat generate proposal sponsor dari template
- **FR43:** User dapat generate laporan dari template
- **FR44:** System dapat pull data historis untuk populate dokumen
- **FR45:** User dapat preview dokumen sebelum finalize
- **FR46:** System mencatat dan track nomor surat yang sudah digunakan
- **FR47:** System auto-generate nomor surat sesuai format

### 7. Public Company Profile

- **FR48:** Public visitor dapat melihat halaman about perusahaan
- **FR49:** Public visitor dapat melihat portfolio event
- **FR50:** Public visitor dapat melihat produk yang tersedia
- **FR51:** Public visitor dapat melihat upcoming events
- **FR52:** Content ter-update otomatis dari backend data

### 8. Automation & Workflow

- **FR53:** User dapat request post ke Instagram via chat
- **FR54:** User dapat request upload YouTube via chat
- **FR55:** System mengirim preview ke Telegram sebelum execute
- **FR56:** User dapat confirm/reject via Telegram bot
- **FR57:** System dapat execute n8n workflow setelah approval
- **FR58:** System dapat escalate Telegram approval jika tidak direspond dalam timeframe

### 9. Reports, Compliance & Financial

- **FR59:** System dapat display laporan pajak perusahaan
- **FR60:** System dapat display BPJS compliance status
- **FR61:** Dokumen legal tersimpan dan accessible
- **FR62:** Komisaris dapat access financial reports
- **FR63:** Freelancer (tax consultant) dapat access data untuk buat laporan
- **FR64:** System dapat track revenue per pilar (Event, Retail, Media, Komunitas)
- **FR65:** System otomatis calculate 30% setoran ke Holding dari revenue setiap pilar
- **FR66:** Dashboard menampilkan total setoran ke Holding dari semua pilar
- **FR67:** System dapat track status setoran (pending, completed)
- **FR68:** System mencatat audit log untuk semua financial transactions
- **FR69:** System mencatat approval history dengan timestamp dan approver

### 10. HELP, Tutorial & System Management

- **FR70:** User dapat access contextual help di setiap halaman
- **FR71:** System dapat guide user baru melalui first-time setup
- **FR72:** User dapat access documentation dan tutorial
- **FR73:** System dapat send in-app notifications untuk task updates
- **FR74:** Admin dapat view AI learning log dan accuracy metrics

---

## Non-Functional Requirements

### Performance

| Metric | Target | Context |
|--------|--------|----------|
| Dashboard load time | < 3 seconds | Initial page render |
| AI Chat response | < 5 seconds | Simple queries |
| File search (Drive) | < 2 seconds | Search results appear |
| Document preview | < 3 seconds | PDF/Doc preview loads |
| Concurrent users | 10 simultaneous | Tim inti + panitia |

### Security

| Requirement | Specification |
|-------------|----------------|
| Authentication | Google OAuth 2.0 only |
| Session timeout | 24 hours, refresh on activity |
| Data encryption | TLS 1.3 for transit, AES-256 at rest |
| KTP storage | Encrypted, access-logged |
| Financial data | Role-based access, audit trail |
| API security | JWT tokens, rate limiting |
| Telegram bot | Webhook verification |

### Scalability

| Metric | Current | Growth Target |
|--------|---------|----------------|
| Users | 5-10 | 50 (Phase 3) |
| Events/year | 1-2 | 10 (Phase 3) |
| Storage | Google Drive limits | Monitor usage |
| Sheets | 5M cells/sheet | Alert at 80% |

**Design Principle:** Extractable modules for future SaaS scaling

### Accessibility (Public Site)

| Standard | Target |
|----------|--------|
| WCAG Level | 2.1 AA |
| Keyboard navigation | Full support |
| Screen reader | ARIA labels |
| Color contrast | 4.5:1 minimum |
| Mobile | Responsive, touch-friendly |

### Integration Requirements

| System | Requirement |
|--------|-------------|
| Google Drive | OAuth, real-time sync |
| Google Sheets | CRUD via API |
| n8n | Webhook triggers, workflow execution |
| Telegram Bot | Webhook notifications, approval flow |
| OpenRouter | AI API calls, rate limit handling |
| YouTube API | Video upload via n8n |
| Instagram API | Post via n8n (Graph API) |

### Reliability

| Metric | Target |
|--------|--------|
| Uptime | 99% monthly |
| Backup | Daily auto-backup to Drive |
| Error recovery | Graceful degradation, manual fallback |
| Event CDE | Zero data loss for event lifecycle |

### Maintainability

| Aspect | Requirement |
|--------|-------------|
| Code documentation | JSDoc/TypeDoc for all public APIs |
| Error logging | Centralized logging, searchable |
| AI learning DB | Self-annealing pattern storage |
| Module boundaries | Clear interfaces for extraction |
