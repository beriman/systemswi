# 🤖 SWI 2.0 — Agent-First Company Roadmap

> **Owner:** HemuHemu / OWL untuk PT Sensasi Wangi Indonesia
> **Created:** 18 Juni 2026
> **Prinsip:** Agent-first Bukan Agent-only — AI agent menjalankan operasional, manusia tetap di loop untuk keputusan strategis, compliance, dan hubungan.
> **Compliance:** Semua mengikuti peraturan yang berlaku di Indonesia (UU ITE, PP PST, UU Ketenagakerjaan, UU Pajak, regulasi OJK, BPOM, dll)

---

## 📋 Executive Summary

SWI saat ini punya **systemswi** — ERP dashboard yang sudah 31 modul. Tapi ini masih "dashboard yang dibaca manusia". Visi SWI 2.0 adalah membuat **AI agent yang menjalankan operasi harian** — dari order masuk sampai laporan pajak — sementara manusia fokus ke strategi, kreativitas, dan relasi.

**Key difference:**
- **SWI 1.0 (sekarang):** Manusia input data → Dashboard tampilkan → Manusia ambil keputusan
- **SWI 2.0 (target):** Agent detect → Agent execute → Agent laporkan → Manusia approve hal kritis

---

## 🏛️ Regulatory Framework Indonesia (WAJIB dipatuhi)

### 1. UU ITE & PP PST (Perlindungan Data Pribadi)
- **UU No. 27/2022 (UU PDP):** Data pribadi customer, supplier, karyawan harus dilindungi
- **PP No. 71/2019 (PP PST):** Penyelenggara sistem elektronik wajib punya kebijakan privasi
- **Implikasi Agent:**
  - Agent WAJIB punya privacy policy yang jelas
  - Data customer (CRM, WhatsApp) harus encrypted & access-controlled
  - Tidak boleh ada data leak ke third party tanpa consent
  - Audit trail untuk semua akses data pribadi

### 2. UU Ketenagakerjaan (UU No. 13/2003 + PP 35/2021)
- Agent TIDAK menggantikan karyawan — agent adalah **alat bantu** karyawan
- Pekerja yang di-assign ke agent tetap dapat upah sesuai UMR
- Agent tidak bisa "memecat" — keputusan termination tetap manusia
- **Implikasi:** Agent mempercepat workflow, bukan mengurangi headcount

### 3. Regulasi OJK (Otoritas Jasa Keuangan)
- Jika SWI menerima pembayaran via QRIS/transfer, harus comply dengan POJK
- **POJK No. 10/2021:** Penyelenggara pembayaran wajib punya izin
- **Implikasi:** Payment gateway yang sudah ada (BRI, QRIS) sudah compliant — agent hanya sebagai interface

### 4. UU Pajak (KUP, PPN, PPh)
- **PP 94/2023 (e-Faktur):** Faktur pajak harus diterbitkan via sistem DJP
- **UU HPP No. 7/2021:** PPN 11%, PPh Badan 22%
- **Implikasi Agent:**
  - Agent bisa generate faktur + hitung PPN otomatis
  - Tapi **upload ke e-Faktur DJP** tetap perlu approval manusia
  - SPT masa harus ditandatangani manusia (digital signature)

### 5. BPOM & Halal (UU No. 33/2014)
- Produk parfum yang di-register BPOM harus punya nomor registrasi
- Sertifikasi Halal wajib untuk produk yang mengklaim halal
- **Implikasi:** Agent track expiry BPOM & sertifikat Halal, tapi pengajuan baru tetap manusia

### 6. UU Cipta Kerja (UU No. 11/2020 + PP 35/2021)
- Kontrak kerja dengan vendor/freelancer harus jelas
- Agent yang "bekerja" untuk SWI bukan subjek hukum — **PT SWI** yang bertanggung jawab
- **Implikasi:** Semua output agent (email, invoice, PO) atas nama PT SWI, bukan atas nama agent

---

## 🎯 Agent-First Architecture

### Layer 1: Agent Core (HemuHemu/OWL)
```
┌─────────────────────────────────────────────┐
│              AGENT CORE (OWL)                │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Schedule │ │  Task    │ │  Compliance  │ │
│  │ Manager  │ │  Router  │ │  Checker     │ │
│  └─────────┘ └──────────┘ └──────────────┘ │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  Data   │ │  Report  │ │  Alert       │ │
│  │  Sync   │ │  Gen     │ │  Manager     │ │
│  └─────────┘ └──────────┘ └──────────────┘ │
└─────────────────────────────────────────────┘
```

### Layer 2: Integration Hub
```
┌─────────────────────────────────────────────┐
│            INTEGRATION HUB                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌───────────┐ │
│  │Sheets│ │Drive │ │Gmail │ │  WhatsApp │ │
│  └──────┘ └──────┘ └──────┘ └───────────┘ │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌───────────┐ │
│  │Calendar│ │DJP   │ │BPOM  │ │  CRM      │ │
│  └──────┘ └──────┘ └──────┘ └───────────┘ │
└─────────────────────────────────────────────┘
```

### Layer 3: Human-in-the-Loop
```
┌─────────────────────────────────────────────┐
│          HUMAN APPROVAL GATE                 │
│  ✅ Auto: transaksi < Rp 10jt, reminder     │
│  ⚠️ Approve: transaksi > Rp 10jt, new vendor│
│  🔴 Human Only: termination, legal, tax     │
└─────────────────────────────────────────────┘
```

---

## 📊 Phase-by-Phase Plan

### Phase 0: Foundation (Sudah Selesai ✅)
- [x] systemswi ERP dashboard (31 modul)
- [x] Google Sheets integration
- [x] Finance, Events, Production, Inventory, Procurement
- [x] Document Generator, Invoice, BPOM Tracker
- [x] Gmail integration, Email inbox
- [x] E2E Workflow Dashboard

### Phase 1: Agent Infrastructure (Bulan 1-2)
**Goal:** Agent bisa menjalankan task harian otomatis

| # | Task | Agent Action | Human Touch |
|---|------|-------------|-------------|
| 1.1 | **Daily Health Check** | Agent cek semua API, Sheets, Vercel setiap jam 6 pagi | Alert via Telegram jika ada masalah |
| 1.2 | **Transaction Detection** | Agent detect mutasi bank dari Rekening_Koran | Konfirmasi kategori via Telegram |
| 1.3 | **Invoice Generation** | Agent generate invoice dari PO + data vendor | Review & approve via Telegram |
| 1.4 | **Tax Reminder** | Agent cek Tax Calendar, kirim H-3 reminder | Manusia file SPT |
| 1.5 | **Stock Alert** | Agent cek Inventory, kirim alert jika stok minimum | Approve PO via Telegram |
| 1.6 | **Event Pipeline Update** | Agent update Event_Tenants & Event_Sponsors dari CRM | Review via dashboard |

**Technical:**
- Cron jobs dengan approval gate (Telegram button: Approve / Reject)
- Agent writes to Google Sheets → Sheets = source of truth
- Semua agent actions logged ke audit trail sheet

### Phase 2: Agent Automation (Bulan 3-4)
**Goal:** Agent bisa execute multi-step workflow

| # | Workflow | Steps | Human Touch |
|---|----------|-------|-------------|
| 2.1 | **Procurement Auto** | Stock alert → Draft PO → Approve → Send to supplier → Track delivery → QC → Update inventory | Approve PO & QC result |
| 2.2 | **Event Pipeline** | New tenant inquiry → Draft agreement → Send → Track payment → Update Event_Tenants | Sign agreement |
| 2.3 | **Finance Reconciliation** | Daily: Compare Cash_Harian vs Rekening_Koran → Flag discrepancies → Suggest corrections | Review & approve corrections |
| 2.4 | **Compliance Tracking** | Daily: Check BPOM expiry → Check Halal cert → Check OSS status → Alert if expiring | Renew certificates |
| 2.5 | **Customer Follow-up** | Agent detect inactive customers → Draft WhatsApp message → Schedule send | Review message before send |

### Phase 3: Agent Intelligence (Bulan 5-6)
**Goal:** Agent bisa analisis & rekomendasi

| # | Capability | Method | Output |
|---|-----------|--------|--------|
| 3.1 | **Cashflow Forecast** | ML model dari 8 bulan Rekap_Rekening | 3-month projection |
| 3.2 | **Brand Performance** | Analyze Brand_Sales + Brand_Expenses | Profitability ranking |
| 3.3 | **Event ROI** | Compare Event_Budget vs actual revenue | Event performance score |
| 3.4 | **Customer Segmentation** | RFM analysis dari CRM data | Segment labels |
| 3.5 | **Tax Optimization** | Analyze COA + Pajak_Tracking | Tax efficiency report |

### Phase 4: Agent Ecosystem (Bulan 7-12)
**Goal:** Agent bisa berinteraksi dengan sistem eksternal

| # | Integration | Compliance Note |
|---|-------------|-----------------|
| 4.1 | **e-Faktur DJP** | Agent generate faktur → Upload ke DJP via API (perlu izin DJP) |
| 4.2 | **OSS/BPOM** | Agent track status → Reminder 30 hari sebelum expiry |
| 4.3 | **Bank BRI API** | Auto-sync mutasi (perlu API key dari BRI) |
| 4.4 | **WhatsApp Business API** | Auto-reply FAQ, broadcast promo (perlu Meta Business verification) |
| 4.5 | **Sukuk Payment** | Auto-calculate profit distribution → Generate payment schedule |

---

## 🔒 Compliance & Governance Framework

### A. Agent Decision Matrix

| Decision Type | Agent Can | Requires Human | Example |
|--------------|-----------|----------------|---------|
| **Read & Report** | ✅ Full auto | ❌ | Daily dashboard, stock report |
| **Draft & Suggest** | ✅ Full auto | ⚠️ Review | Invoice draft, PO draft |
| **Execute (low risk)** | ✅ Auto < Rp 10jt | ⚠️ Logged | Small expense, reminder |
| **Execute (high risk)** | ❌ Draft only | ✅ Approve | Large PO, new vendor, contract |
| **Legal/Tax** | ❌ Calculate only | ✅ File & Sign | SPT, faktur pajak, agreement |
| **HR/People** | ❌ Never | ✅ Always | Hiring, firing, salary |

### B. Audit Trail (WAJIB)
Setiap agent action harus log ke Google Sheets `Agent_Audit_Log`:
```
Timestamp | Agent | Action | Target | Status | Human Approved | Notes
```

### C. Data Privacy
- Customer data (CRM, WhatsApp) → Encrypted at rest
- Agent hanya akses data yang diperlukan (principle of least privilege)
- Data retention: 7 tahun (sesuai UU KUP)
- Right to deletion: Customer bisa minta data dihapus (UU PDP)

### D. Human Override
- Manusia BISA override kapan saja
- Agent harus berhenti jika ada instruksi manusia yang konflik
- Emergency stop: kirim "STOP" ke agent via Telegram → semua agent actions pause

---

## 💰 Budget & Resource

### Infrastructure (Monthly)
| Item | Cost | Notes |
|------|------|-------|
| Vercel Pro | $20/mo | Serverless functions |
| Google Workspace | $0 | Sudah ada |
| OpenRouter API | ~$50/mo | Agent LLM calls |
| WhatsApp Business API | ~$50/mo | Via Meta |
| **Total** | **~$120/mo** | |

### Development
| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1 | 2 bulan | 80 hours |
| Phase 2 | 2 bulan | 120 hours |
| Phase 3 | 2 bulan | 100 hours |
| Phase 4 | 6 bulan | 200 hours |
| **Total** | **12 bulan** | **500 hours** |

---

## 📈 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Agent uptime | 99% | Health check daily |
| Transaction processing time | < 5 min | Order → Invoice |
| Human approval response | < 2 jam | Telegram response time |
| Error rate | < 1% | Agent actions failed |
| Compliance violations | 0 | Audit trail review |
| Time saved (Beriman) | > 10 jam/minggu | Self-reported |

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Agent error (wrong data) | High | Human approval gate + audit trail |
| Google API rate limit | Medium | Cache + retry + fallback |
| Regulatory change | High | Quarterly compliance review |
| Data breach | Critical | Encryption + access control + audit |
| Agent hallucination | Medium | Never trust agent output without verification |
| Vendor lock-in (LLM) | Low | Multi-provider support (OpenRouter) |

---

## 🎯 Immediate Next Steps (Minggu Ini)

1. **Setup Agent Audit Log sheet** di Google Sheets
2. **Implement approval gate** — Telegram button untuk approve/reject
3. **Daily health check cron** — Agent cek semua sistem, report via Telegram
4. **Transaction detection** — Agent baca mutasi bank, suggest kategori
5. **Stock alert** — Agent cek inventory, kirim alert jika minimum

---

*Document created: 2026-06-18 by OWL/HemuHemu*
*Review cycle: Quarterly ( setiap 3 bulan)*
*Next review: September 2026*
