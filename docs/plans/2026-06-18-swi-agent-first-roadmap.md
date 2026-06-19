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

### Phase 1: Agent Infrastructure (Bulan 1-2) — ✅ COMPLETE
**Goal:** Agent bisa menjalankan task harian otomatis

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | **Daily Health Check** | ✅ DONE | `src/lib/agent/health-check.ts` + `src/app/api/agent/health/route.ts` — Checks Sheets, Finance, Inventory, Vercel, Alerts. Sends report via Telegram. |
| 1.2 | **Transaction Detection** | ✅ DONE | `src/lib/agent/transaction-detection.ts` + `src/app/api/agent/transactions/route.ts` — Reads Rekening_Koran, suggests categories via keyword matching, flags high-value txn. |
| 1.3 | **Invoice Generation** | ✅ DONE | `src/lib/agent/invoice-generation.ts` + `src/app/api/agent/invoices/route.ts` — Generates vendor invoices from received POs + customer invoices from CRM. PPN 11% auto-calculated. Sends Telegram approval for each invoice. Integrated into orchestrator daily run. |
| 1.4 | **Tax Reminder** | ✅ DONE | `src/lib/agent/tax-reminder.ts` + `src/app/api/agent/tax-reminder/route.ts` — Reads Tax_Calendar + Pajak_Tracking, sends H-3 Telegram reminders. Overdue items get individual high-severity alerts. Integrated into orchestrator daily run. |
| 1.5 | **Stock Alert** | ✅ DONE | `src/app/api/agent/stock-alert/route.ts` — Reads Inventory_Master, sends Telegram alerts for low/critical stock |
| 1.6 | **Event Pipeline Update** | ✅ DONE | `src/lib/agent/event-pipeline.ts` + `src/app/api/agent/event-pipeline/route.ts` — Reads Event_Tenants, Event_Sponsors, Customer_Interactions, Customer_Master. Detects follow-up needs, overdue payments, event-related interactions. Sends Telegram report with suggestions. Integrated into orchestrator daily run. |

**Infrastructure Built:**
- `src/lib/agent/audit.ts` — Google Sheets-based audit logger (Agent_Audit_Log sheet)
- `src/lib/agent/telegram.ts` — Telegram bot integration (alerts, approval inline keyboard, health reports)
- `src/lib/agent/orchestrator.ts` — Daily agent run coordinator (all Phase 1 tasks)
- `src/app/api/agent/telegram-webhook/route.ts` — Handles Telegram callbacks (approve/reject buttons + /stop emergency)
- Google Sheets: Agent_Audit_Log + AgentApprovals sheet configs added to SHEETS map
- Approval gate: `requestApproval()` function with Telegram inline keyboard (Approve/Reject buttons)

**Technical:**
- Cron jobs dengan approval gate (Telegram button: Approve / Reject)
- Agent writes to Google Sheets → Sheets = source of truth
- Semua agent actions logged ke audit trail sheet

### Phase 2: Agent Automation (Bulan 3-4) — ✅ COMPLETE
**Goal:** Agent bisa execute multi-step workflow

| # | Workflow | Status | Notes |
|---|----------|--------|-------|
| 2.1 | **Procurement Auto** | ✅ DONE | `src/lib/agent/procurement-auto.ts` + `src/app/api/agent/procurement/route.ts` — Reads Inventory_Master + Supplier_Master, groups low-stock items by supplier, drafts POs with PPN 11%, sends Telegram approval. |
| 2.2 | **Event Pipeline** | ✅ DONE | `src/lib/agent/event-pipeline-workflow.ts` + `src/app/api/agent/event-workflow/route.ts` — Reads Event_Tenants + Event_Sponsors, drafts agreements for new inquiries, detects overdue payments, flags follow-up needs. |
| 2.3 | **Finance Reconciliation** | ✅ DONE | `src/lib/agent/finance-reconciliation.ts` + `src/app/api/agent/reconciliation/route.ts` — Compares Cash_Harian vs Rekening_Koran, flags missing entries & amount mismatches, suggests corrections via Telegram. |
| 2.4 | **Compliance Tracking** | ✅ DONE | `src/lib/agent/compliance-tracking.ts` + `src/app/api/agent/compliance/route.ts` — Checks BPOM/Halal cert expiry from Compliance_Checks + Legal_Compliance, sends alerts for expired/expiring (≤30 days). |
| 2.5 | **Customer Follow-up** | ✅ DONE | `src/lib/agent/customer-follow-up.ts` + `src/app/api/agent/follow-up/route.ts` — Detects inactive/dormant/churned customers from Customer_Master, drafts WhatsApp messages by segment, priority-sorted by CLV. |

**Phase 2 Infrastructure Built:**
- `src/lib/agent/procurement-auto.ts` — PO drafting from low-stock + supplier matching
- `src/lib/agent/finance-reconciliation.ts` — Cash vs Rekening reconciliation engine
- `src/lib/agent/compliance-tracking.ts` — BPOM/Halal expiry tracker
- `src/lib/agent/customer-follow-up.ts` — Customer segmentation + WhatsApp message drafting
- `src/lib/agent/event-pipeline-workflow.ts` — Event agreement drafting + overdue detection
- 5 new API routes: `/api/agent/procurement`, `/api/agent/reconciliation`, `/api/agent/compliance`, `/api/agent/follow-up`, `/api/agent/event-workflow`
- Orchestrator updated: `runFullDailyAgent()` now includes all 5 Phase 2 tasks

### Phase 3: Agent Intelligence (Bulan 5-6) — ✅ COMPLETE
**Goal:** Agent bisa analisis & rekomendasi

| # | Capability | Status | Method | Output |
|---|-----------|--------|--------|--------|
| 3.1 | **Cashflow Forecast** | ✅ DONE | Linear regression + seasonal adjustment dari 8 bulan Rekap_Rekening | 3-month projection → Cashflow_Forecast sheet |
| 3.2 | **Brand Performance** | ✅ DONE | Analyze Brand_Sales + Brand_Expenses → profitability ranking | Brand tier (star/profitable/breakeven/loss) → Brand_Dashboard sheet |
| 3.3 | **Event ROI** | ✅ DONE | Compare Event_Tenants + Event_Sponsors budget vs revenue | Event grade (A-F) + performance score |
| 3.4 | **Customer Segmentation** | ✅ DONE | RFM analysis (quintile scoring) dari Customer_Master + Customer_Interactions | 10 segments (Champions → Lost) + CLV estimate |
| 3.5 | **Tax Optimization** | ✅ DONE | Analyze COA + Pajak_Tracking → identify savings | Tax efficiency report + priority recommendations |

**Phase 3 Infrastructure Built:**
- `src/lib/agent/cashflow-forecast.ts` — Linear regression + seasonal factor analysis, writes to Cashflow_Forecast sheet
- `src/lib/agent/brand-performance.ts` — Brand profitability ranking with tier classification, writes to Brand_Dashboard sheet
- `src/lib/agent/event-roi.ts` — Event ROI grading (A-F) from tenant + sponsor data
- `src/lib/agent/customer-segmentation.ts` — RFM quintile scoring with 10 customer segments + CLV projection
- `src/lib/agent/tax-optimization.ts` — COA + Pajak_Tracking analysis with priority recommendations
- 5 new API routes: `/api/agent/cashflow-forecast`, `/api/agent/brand-performance`, `/api/agent/event-roi`, `/api/agent/customer-segmentation`, `/api/agent/tax-optimization`
- Orchestrator updated: `runFullDailyAgent()` now includes all 5 Phase 3 tasks
- Audit status type extended: added `"partial"` status for partial completion

### Phase 4: Agent Ecosystem (Bulan 7-12) — 🟡 SCAFFOLD READY
**Goal:** Agent bisa berinteraksi dengan sistem eksternal

| # | Integration | Status | Compliance Note |
|---|-------------|--------|-----------------|
| 4.1 | **e-Faktur DJP** | 🟡 Scaffold | Agent generate faktur → Upload ke DJP via API (perlu izin DJP) |
| 4.2 | **OSS/BPOM** | 🟡 Scaffold | Agent track status → Reminder 30 hari sebelum expiry |
| 4.3 | **Bank BRI API** | 🟡 Scaffold | Auto-sync mutasi (perlu API key dari BRI) |
| 4.4 | **WhatsApp Business API** | 🟡 Scaffold | Auto-reply FAQ, broadcast promo (perlu Meta Business verification) |
| 4.5 | **Sukuk Payment** | 🟡 Scaffold | Auto-calculate profit distribution → Generate payment schedule |

**Phase 4 Infrastructure Built (Scaffold):**
- `src/lib/agent/phase4-scaffold.ts` — 5 integration stubs with typed interfaces, isConfigured() checks, TODO guides, orchestrator
- `src/app/api/agent/phase4/route.ts` — GET + POST API route to trigger Phase 4 checks
- `src/lib/agent/index.ts` — exports added
- Each module logs "not configured" status until env vars are set
- Telegram status report lists which integrations are active vs blocked

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

✅ **Semua Phase 1-3 sudah COMPLETE!** Tidak ada task yang tersisa di fase-fase ini.

### Phase 4 — Scaffold Ready, Blocked on External Credentials
Phase 4 scaffolding is complete. The code structure is ready — each module will activate automatically when the corresponding env vars are set.

**Yang sudah siap (scaffold):**
- ✅ `src/lib/agent/phase4-scaffold.ts` — 5 integration modules with typed interfaces
- ✅ `src/app/api/agent/phase4/route.ts` — API trigger endpoint
- ✅ `src/lib/agent/index.ts` — exports

**Yang perlu dilakukan manusia untuk mengaktifkan:**
1. Apply BRI API access untuk auto-sync mutasi
2. Meta Business verification untuk WhatsApp API
3. DJP e-Faktur API registration
4. OSS/BPOM API credentials
5. Sukuk contract/API details

**Cara aktifkan:** Set env vars yang sesuai di Vercel → Settings → Environment Variables. Agent akan otomatis detect dan jalankan integrasi.

### Setup Required (Environment Variables)
To activate Telegram integration, set these env vars:
- `TELEGRAM_BOT_TOKEN` — Bot token from @BotFather
- `TELEGRAM_CHAT_ID` — Default chat ID for alerts
- `TELEGRAM_APPROVAL_CHAT_ID` — Chat ID for approval requests (defaults to TELEGRAM_CHAT_ID)

Then set webhook: `GET /api/agent/telegram-webhook?url=https://systemswi.vercel.app/api/agent/telegram-webhook`

---

*Document created: 2026-06-18 by OWL/HemuHemu*
*Last updated: 2026-06-19 by OWL/HemuHemu — Phase 1-3 ✅ COMPLETE, Phase 4 🟡 SCAFFOLD READY (5 integration stubs, needs external credentials to activate)*
*Review cycle: Quarterly ( setiap 3 bulan)*
*Next review: September 2026*
