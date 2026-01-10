---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
date: 2026-01-08
author: Iman
project: system SWI
---

# Product Brief: system SWI

## Executive Summary

**system SWI** adalah AI-powered internal operational hub yang dirancang untuk mentransformasi Sensasi Wangi Indonesia (SWI) — perusahaan wewangian yang telah berdiri selama 2 tahun — menjadi perusahaan terdepan di industri parfum Indonesia. 

Platform ini mengintegrasikan **Google Drive** (sebagai single source of truth), **n8n automation**, dan **OpenRouter AI** (model gratis) untuk menyederhanakan operasional 4 pilar bisnis: **Media, Komunitas, Event, dan Retail (MAKER)**.

Dengan tim inti 3 orang (CEO Beriman, COO Wapiq, Komisaris Malsiaf) dan kebutuhan mendesak untuk breakthrough setelah 2 tahun, system SWI akan menjadi command center yang memungkinkan setiap stakeholder bekerja lebih efisien melalui bantuan AI — mulai dari analisis data, pembuatan dokumen custom, hingga pengelolaan laporan perusahaan.

**Fokus Prioritas:** Event & Media sebagai pilar pertama yang akan dikembangkan.

---

## Core Vision

### Problem Statement

SWI menghadapi tantangan operasional yang signifikan: empat pilar bisnis (MAKER) berjalan secara terpisah dan manual menggunakan WhatsApp, Google Drive, dan spreadsheet yang tidak terintegrasi. Dengan tim terbatas (3 orang), mengelola media, membangun komunitas di sensasiwangi.id, mengkoordinasi event, dan menjalankan retail menjadi sangat menantang.

### Problem Impact

| Pilar | Masalah | Impact |
|-------|---------|--------|
| **Media** | Sulit konsisten dengan konten YouTube dan social media | Brand awareness stagnan |
| **Komunitas** | sensasiwangi.id sepi pengunjung (ada marketplace, forum, tools) | Engagement rendah |
| **Event** | Koordinasi panitia lemah, tidak ada Common Data Environment | Event quality inconsistent |
| **Retail** | Belum ada sistem terintegrasi untuk multi-channel (Tokped, Shopee, offline) | Missed sales opportunities |

### Why Existing Solutions Fall Short

Tools yang ada saat ini (WhatsApp, Drive, Spreadsheet) tidak saling terhubung dan tidak memiliki kecerdasan untuk membantu pengambilan keputusan. Tidak ada sistem yang bisa menjawab "apa yang harus dikerjakan hari ini" atau menghasilkan dokumen custom seperti proposal sponsor secara otomatis.

### Proposed Solution

**system SWI** — sebuah internal webtool terintegrasi yang menggabungkan:

| Komponen | Fungsi |
|----------|--------|
| **Google Drive** | Single source of truth, folder terorganisir |
| **n8n Automation** | Workflow otomatis antar sistem |
| **OpenRouter AI** | Asisten cerdas (model gratis) untuk analisis dan generasi dokumen |
| **Company Reports** | Laporan Keuangan, Pajak, dan compliance requirements |

**Workflow Ideal:**
1. User buka sistem
2. Tanya AI: "Apa yang harus dikerjakan hari ini?"
3. AI analisis data dan prioritas
4. User eksekusi dengan tools yang tersedia
5. Output otomatis (contoh: proposal sponsor custom dengan data historis)

### Key Differentiators

| Differentiator | Detail |
|----------------|--------|
| **Personal Branding** | 6 tahun pengaruh di komunitas perfumery Indonesia |
| **Domain Expertise** | Pemahaman mendalam tentang dunia wewangian |
| **Timing** | Januari 2026, momentum AI dan automation sudah matang |
| **Cost-Efficient Stack** | Google Drive + n8n + OpenRouter (semua gratis/murah) |
| **Extractable Design** | Internal tool yang bisa di-extract jadi SaaS jika terbukti berhasil |

### Strategic Focus

**Fase 1 Prioritas:** Event & Media
- Event: Common Data Environment untuk koordinasi panitia
- Media: Workflow otomatis untuk content creation dan scheduling

**Fase 2:** Retail multi-channel integration
**Fase 3:** Komunitas enhancement untuk sensasiwangi.id

---

## Target Users

### Primary Users

#### 1. Tim Inti (Full Access)

**Beriman (CEO)**
- **Role:** Strategic decision maker, content creator, system admin
- **Workflow:** Buka sistem pagi → lihat dashboard → tanya AI prioritas → eksekusi task
- **Needs:** Overview semua pilar, AI assistance, quick document generation
- **Tech Level:** Intermediate, butuh interface informatif

**Wapiq (COO)**
- **Role:** Operational manager, day-to-day execution
- **Workflow:** Monitor progress → coordinate dengan panitia/freelancer → reporting
- **Needs:** Task management, team coordination tools, operational reports
- **Tech Level:** Basic-intermediate, butuh UI simple

### Secondary Users

#### 2. Komisaris (View-Only)

**Malsiaf**
- **Role:** Passive oversight, investment monitoring
- **Access:** Read-only reports, financial dashboards
- **Workflow:** Periodic review → lihat laporan → feedback via offline

#### 3. Panitia Event (Limited Access)

- **Role:** Seasonal contributors saat ada event
- **Access:** Event-specific tools (CDE), task lists, progress updates
- **Workflow:** Login → cek task → update progress → coordinate via system
- **Jumlah:** Variable, tergantung event size

#### 4. Freelancer (Limited Access)

- **Role:** External contractors (Pajak, BPJS)
- **Access:** Finance/reporting tools sesuai scope kerja
- **Workflow:** Login → akses dokumen yang dibutuhkan → generate reports
- **Jumlah:** 1-2 orang per area

### User Journey

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  Discovery  │ →  │  Onboarding  │ →  │  Core Use   │ →  │   Mastery    │
│             │    │              │    │             │    │              │
│ Tim inti    │    │ HELP/DOCS    │    │ Daily ops   │    │ AI-powered   │
│ introduce   │    │ Tutorial     │    │ Dashboard   │    │ automation   │
│ system      │    │ guided tour  │    │ AI assist   │    │ efficiency   │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### Access Control Matrix

| User Type | Dashboard | AI Chat | Event Tools | Finance | Media | Admin |
|-----------|-----------|---------|-------------|---------|-------|-------|
| Tim Inti | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Komisaris | ✅ (view) | ❌ | ❌ | ✅ (view) | ❌ | ❌ |
| Panitia | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Freelancer | ❌ | ❌ | ❌ | ✅ (limited) | ❌ | ❌ |

---

## Success Metrics

### User Success Metrics

| Metric | Indicator | Target |
|--------|-----------|--------|
| **Tool Accuracy** | User dapat menggunakan tools dengan benar, hasil akurat | 95% task completion tanpa error |
| **Communication Clarity** | Tidak ada miskomunikasi antar tim | Zero critical miscommunication per project |
| **Document Findability** | Kemudahan mencari dokumen | < 30 detik untuk menemukan dokumen |
| **Document Creation Speed** | Waktu rata-rata membuat dokumen | 50% lebih cepat dari manual |

### Business Objectives

| Objective | Timeline | Target |
|-----------|----------|--------|
| **Media Consistency** | Monthly | Publish konten sesuai jadwal |
| **Revenue Growth** | Quarterly | Increase retail revenue |
| **Transparency** | Ongoing | 100% visibility ke laporan keuangan/operasional |
| **Sponsor Acquisition** | Per Event (Next: Nov 2026) | Minimal 1 sponsor baru per event |

### Key Performance Indicators

| Category | KPI | Measurement |
|----------|-----|-------------|
| **Media** | Konten published/minggu | Count per week |
| **Efficiency** | Avg document creation time | Minutes tracked |
| **Event** | Sponsor acquisition rate | Sponsors per event |
| **System** | User adoption rate | Active users / total users |
| **Finance** | Report generation accuracy | Error rate < 1% |

### Timeline Milestones

- **Jan 2026:** System SWI development start
- **Nov 2026:** Next major event (target untuk test Event CDE)

---

## MVP Scope

### Core Features (Must Have)

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | **Dashboard Overview** | Central hub, semua info di satu tempat | ⭐ High |
| 2 | **AI Chat Assistant** | Tanya AI untuk prioritas & bantuan | ⭐ High |
| 3 | **Event CDE** | Common Data Environment untuk koordinasi panitia | ⭐ Critical |
| 4 | **Media Content Calendar** | Jadwal & planning konten | ⭐ High |
| 5 | **Document Generator** | Generate proposal, reports otomatis | ⭐ High |
| 6 | **Google Drive Integration** | Single source of truth, folder terorganisir | ⭐ Critical |
| 7 | **Company Reports Viewer** | Laporan keuangan, pajak, compliance | ⭐ Medium |
| 8 | **HELP/Tutorial System** | Panduan penggunaan untuk semua user | ⭐ High |

### Out of Scope for MVP

| Feature | Reason | Phase |
|---------|--------|-------|
| Komunitas Enhancement | sensasiwangi.id sudah berjalan | Phase 3 |
| Retail Multi-channel | Butuh integrasi Tokped/Shopee | Phase 2 |
| Advanced Analytics | Nice to have, bukan essential | Future |

### MVP Success Criteria

✅ **MVP berhasil jika:**
- User dapat menjalankan **semua tools tanpa kendala**
- Zero critical errors dalam daily operations
- Event November 2026 berjalan dengan sistem

### Future Vision

**Post-MVP Roadmap:**
1. **Phase 2:** Retail multi-channel (Tokped, Shopee, offline)
2. **Phase 3:** Komunitas enhancement untuk sensasiwangi.id
3. **Future:** Advanced analytics, SaaS extraction potential
