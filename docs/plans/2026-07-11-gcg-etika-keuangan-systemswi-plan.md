# Rencana Perbaikan GCG & Etika Keuangan — System SWI

**Target sistem:** https://systemswi.vercel.app/  
**Repo:** `/home/ubuntu/systemswi` (`beriman/systemswi`)  
**Tanggal:** 2026-07-11  
**Owner:** Beriman Juliano / Direktur PT Sensasi Wangi Indonesia  
**Prinsip:** Google Sheets tetap menjadi source of truth. System SWI menjadi layer workflow, approval, dashboard, audit, dan reminder.

---

## 0. Data Nyata SWI yang Menjadi Dasar Plan

Plan ini tidak dibuat untuk `sensasiwangi.id`, tapi untuk **System SWI**. Dari repo dan konteks SWI yang sudah ada:

### Status perusahaan & compliance yang sudah diketahui

- PT Sensasi Wangi Indonesia adalah **PMDN Menengah**.
- KBLI utama yang tercatat: **20421**.
- Brand aktif: **L'Arc~en~Scent**, **Pixel Potion**, **Nuscentza**.
- Divisi operasional yang dipakai dalam sistem kerja: **Produksi/Event (Fragrantions)/Website/Store**.
- BPJS Ketenagakerjaan: **1 peserta — Beriman**, dibayar pribadi, lunas sampai 25 Juni 2026.
- BPJS Kesehatan: **belum selesai/masih perlu ditindaklanjuti**.
- LKPM Q2: deadline **1–15 Juli 2026**.
- SWI memakai Google Sheets sebagai **source of truth** untuk laporan, finance, budget, dan operasional.

### Modul System SWI yang sudah ada dan relevan

Dari repo `/home/ubuntu/systemswi`, sudah ada modul/workflow berikut:

- `/finance`
- `/cash-harian`
- `/buku-kas`
- `/budget`
- `/expenses`
- `/events`
- `/bpjs`
- `/tax-compliance`
- `/compliance`
- `/reports`
- `/documents`
- `/agent-dashboard`
- `/tasks`
- `/sukuk`
- `/procurement`
- `/inventory`
- `/production`
- `/brands`
- `/settings`

### Integrasi Google Sheets yang sudah ada

Sheet/range yang sudah dikenali System SWI antara lain:

- `Cash_Harian`
- `Buku_Kas`
- `Pajak_Tracking`
- `Brand_Expenses`
- `Brand_Sales`
- `Brand_Dashboard`
- `Event_Budget`
- `Expense_Submissions`
- `Agent_Audit_Log`
- `Tax_Calendar`
- `COA`
- `Rekening_Koran`

### Agent/system automation yang sudah ada

Dari `docs/plans/2026-06-18-swi-agent-first-roadmap.md`, System SWI sudah punya:

- Google Sheets integration.
- Agent audit logger ke `Agent_Audit_Log`.
- Telegram approval gate.
- Finance reconciliation: `Cash_Harian` vs `Rekening_Koran`.
- Tax reminder: `Tax_Calendar` + `Pajak_Tracking`.
- Stock alert.
- Event pipeline.
- Procurement auto draft PO.
- Compliance tracking BPOM/Halal.
- Brand performance analysis: `Brand_Sales` + `Brand_Expenses`.
- Event ROI analysis: `Event_Budget` vs revenue.

### Expense Approval yang sudah ada

System SWI sudah punya plan dan implementasi awal:

- Plan: `docs/plans/2026-06-21-expense-approval-plan.md`
- API:
  - `GET /api/expenses`
  - `POST /api/expenses`
  - `GET /api/expenses/[id]`
  - `PUT /api/expenses/[id]`
  - `GET /api/expenses/pending`
  - `POST /api/expenses/upload`
- UI: `/expenses`
- Sheet:
  - `Expense_Submissions`
  - `Expense_Approvers`

Jadi rencana GCG ini harus memperkuat modul-modul di atas, bukan membuat sistem terpisah.

---

## 1. Tujuan Perbaikan

Membuat System SWI menjadi sistem tata kelola perusahaan sederhana tapi jalan harian, dengan fokus:

1. **Transparency** — semua angka penting muncul dari Google Sheets dan bisa ditelusuri.
2. **Accountability** — setiap transaksi, expense, task, compliance item, dan approval punya PIC.
3. **Responsibility** — pajak, BPJS, LKPM, BPOM/Halal, legal, dan event compliance masuk sistem reminder.
4. **Independency** — pembelian/vendor/pengeluaran tidak hanya berdasarkan keputusan informal; ada pembanding dan approval threshold.
5. **Fairness** — pemegang saham, karyawan, vendor, tenant, customer, dan brand diperlakukan dengan aturan yang jelas.
6. **Etika keuangan** — tidak ada angka fiktif, tidak ada expense tanpa bukti, tidak ada approval tanpa jejak, tidak ada campur uang pribadi/perusahaan tanpa pencatatan.

---

## 2. Target Akhir yang Realistis

Dalam 30–60 hari, System SWI harus bisa menjawab pertanyaan ini dari dashboard:

1. Berapa saldo kas/bank SWI terbaru dari `Cash_Harian` + `Buku_Kas`?
2. Berapa total hutang perusahaan ke pemegang saham?
3. Berapa expense pending approval?
4. Expense mana yang tanpa bukti?
5. Divisi mana yang paling besar pengeluarannya?
6. Event mana yang actual expense-nya melewati budget?
7. Apa compliance yang overdue: BPJS, LKPM, pajak, BPOM/Halal?
8. Siapa yang approve expense/vendor/PO tertentu?
9. Apakah ada transaksi besar tanpa approval?
10. Apakah laporan bulanan siap dibagikan ke pemegang saham?

---

## 3. Gap Saat Ini

| Area | Sudah Ada di System SWI | Gap yang Perlu Diperbaiki |
|---|---|---|
| Finance | `Cash_Harian`, `Buku_Kas`, finance reconciliation | Belum ada ringkasan GCG bulanan yang mengikat semua modul |
| Expense | `/expenses`, `Expense_Submissions`, upload proof | Perlu threshold approval, wajib bukti, divisi, COA, shareholder-debt flag |
| Audit | `Agent_Audit_Log`, audit route agent | Perlu `Governance_Audit_Log` untuk tindakan manusia dan approval non-agent |
| Compliance | tax, BPJS, compliance, BPOM/Halal tracking | Perlu checklist GCG: LKPM, BPJSKS, BPJSKT, pajak, dokumen legal |
| Vendor/Procurement | procurement auto, reorder, inventory | Perlu vendor comparison dan conflict-of-interest declaration |
| Event | Event_Budget, Event ROI, Events page | Perlu event closeout report: RAB vs actual, revenue, receivable, payable, dokumentasi |
| Shareholder | Sukuk/investor modules ada | Perlu sheet khusus `Shareholder_Ledger` untuk modal/hutang/dividen |
| Fairness | expense/approval sebagian ada | Perlu policy payment term vendor/tenant/refund/gaji/reimbursement |

---

## 4. Blueprint Data: Sheet Baru/Perlu Diperkuat

### 4.1 `Governance_Audit_Log` — audit manusia & approval GCG

Tujuan: mencatat semua tindakan penting manusia, bukan hanya agent.

Kolom:

| Kolom | Nama | Contoh |
|---|---|---|
| A | Log ID | GOV-20260711-0001 |
| B | Timestamp | 2026-07-11 12:51 |
| C | Actor | Beriman Juliano |
| D | Role | Direktur |
| E | Action | APPROVE_EXPENSE |
| F | Entity Type | Expense / Vendor / Event / Compliance / Shareholder |
| G | Entity ID | EXP-xxx |
| H | Amount | 500000 |
| I | Division | Event / Produksi / Website / Store |
| J | Before | Pending |
| K | After | Approved |
| L | Reason/Notes | Sewa booth RTF2 |
| M | Proof URL | Drive file ID/URL |
| N | Source Module | /expenses |

Integrasi:

- `PUT /api/expenses/[id]` menulis ke `Governance_Audit_Log`.
- Approval vendor/procurement juga menulis ke sini.
- Compliance checklist update juga menulis ke sini.

---

### 4.2 `Shareholder_Ledger` — modal, hutang pemegang saham, gaji tertunda

Tujuan: memisahkan uang pribadi vs uang perusahaan.

Kolom:

| Kolom | Nama | Contoh |
|---|---|---|
| A | Entry ID | SHL-20260711-001 |
| B | Date | 2026-07-01 |
| C | Shareholder | Beriman Juliano |
| D | Type | Modal / Hutang Pemegang Saham / Gaji Tertunda / Reimbursement |
| E | Division | Produksi / Event / Website / Store / Holding |
| F | Description | Gaji direktur Juli via hutang saham |
| G | Debit | 500000 |
| H | Credit | 0 |
| I | Balance | auto/formula |
| J | Approval Status | Approved |
| K | Approved By | Beriman Juliano |
| L | Proof URL | optional |
| M | Notes | dibayar pribadi / dikonversi modal / belum lunas |

Data awal yang perlu masuk:

- Gaji Rp500.000/bulan via hutang saham tanggal 1.
- BPJSKT 1 peserta dibayar pribadi dan status lunas sampai 25 Juni 2026.
- Setiap biaya pribadi yang dipakai untuk operasional SWI harus masuk sini.

---

### 4.3 `Compliance_Register` — BPJS, LKPM, pajak, legal, BPOM/Halal

Tujuan: satu daftar kewajiban perusahaan.

Kolom:

| Kolom | Nama | Contoh |
|---|---|---|
| A | Compliance ID | CMP-LKPM-Q2-2026 |
| B | Area | LKPM / Pajak / BPJSKT / BPJSKS / BPOM / Halal / Legal |
| C | Obligation | LKPM Q2 2026 |
| D | Period | Q2 2026 |
| E | Due Date | 2026-07-15 |
| F | Status | Not Started / In Progress / Submitted / Overdue |
| G | Owner | Beriman / Finance / Legal |
| H | Source Proof | link bukti lapor/bayar |
| I | Risk Level | Low / Medium / High |
| J | Notes | deadline 1–15 Juli |

Data awal yang perlu masuk:

- LKPM Q2 2026, due 15 Juli 2026.
- BPJSKT Beriman, paid personally, paid-through 25 Juni 2026.
- BPJSKS belum.
- Pajak bulanan/tahunan sesuai `Pajak_Tracking`.
- BPOM/Halal/IFRA jika produk mulai didaftarkan.

Integrasi:

- `/compliance` dan `/tax-compliance` membaca `Compliance_Register`.
- Agent Compliance Tracking mengirim alert jika H-7/H-3/overdue.

---

### 4.4 `Vendor_Register` — supplier + conflict-of-interest

Tujuan: menerapkan independensi.

Kolom:

| Kolom | Nama | Contoh |
|---|---|---|
| A | Vendor ID | VND-001 |
| B | Vendor Name | Supplier Botol A |
| C | Category | Botol / Alkohol / Bibit / Packaging / Venue / Dokumentasi |
| D | Contact | WA/email |
| E | Related Party? | Yes/No |
| F | Relationship Detail | teman/keluarga/tidak ada |
| G | Price Benchmark 1 | link/nominal |
| H | Price Benchmark 2 | link/nominal |
| I | Selected Reason | harga/kualitas/waktu terbaik |
| J | Payment Term | DP/Lunas/Net 7 |
| K | Status | Active / Blacklist / Trial |
| L | Last Review | date |

Aturan:

- Pengeluaran vendor di atas batas tertentu wajib pilih vendor dari `Vendor_Register`.
- Jika `Related Party = Yes`, wajib ada alasan pemilihan dan minimal 2 pembanding.

---

### 4.5 `Monthly_GCG_Report` — ringkasan untuk pemegang saham

Tujuan: laporan bulanan otomatis.

Kolom/ringkasan:

| Area | Sumber |
|---|---|
| Cash in/out | Cash_Harian + Buku_Kas |
| Expense approved/pending/rejected | Expense_Submissions |
| Hutang pemegang saham | Shareholder_Ledger |
| Event budget vs actual | Event_Budget + Expense_Submissions |
| Brand profit/loss | Brand_Sales + Brand_Expenses |
| Compliance status | Compliance_Register + Pajak_Tracking |
| Audit exceptions | Governance_Audit_Log + Agent_Audit_Log |
| Next actions | Tasks + Compliance_Register |

Output:

- `/reports` punya mode **GCG Monthly Report**.
- `/documents` bisa generate dokumen laporan bulanan untuk pemegang saham.

---

## 5. Perubahan Modul System SWI

### Phase 1 — Quick Win 7 Hari: Expense & Audit Discipline

#### 1.1 Perkuat `/expenses`

Tambahkan field ke submission:

- Division: Produksi / Event / Website / Store / Holding
- COA Category
- Payment Method: Cash / Bank / Personal Paid / Company Paid
- Related Brand: L'Arc~en~Scent / Pixel Potion / Nuscentza / SWI Holding
- Related Event: dari `Event_Budget`
- Proof Required: wajib jika amount > 0
- Shareholder Debt Flag: true jika dibayar pribadi dulu

Rules:

- Expense tanpa bukti boleh disubmit, tapi status `Needs Proof`, bukan langsung `Pending`.
- Expense > Rp500.000 wajib approval direktur.
- Expense event harus memilih event/project.
- Expense yang `Personal Paid` otomatis membuat draft entry ke `Shareholder_Ledger` setelah approved.

#### 1.2 Tulis approval ke `Governance_Audit_Log`

Setiap approve/reject:

- actor
- timestamp
- amount
- before/after status
- notes
- proof URL
- division

#### 1.3 Dashboard warning

Di `/expenses` tampilkan warning:

- pending amount
- needs proof amount
- rejected this month
- expenses without division
- personal-paid expenses not yet entered to shareholder ledger

---

### Phase 2 — 14 Hari: Shareholder & Cash Separation

#### 2.1 Buat `Shareholder_Ledger`

Implementasi:

- API baru: `/api/shareholder-ledger`
- Page baru atau tab di `/finance`: **Hutang Pemegang Saham**
- Sheet: `Shareholder_Ledger`

Data awal wajib:

- gaji Rp500.000/bulan via hutang saham tanggal 1.
- BPJSKT Beriman yang dibayar pribadi.
- biaya operasional pribadi lain jika ada bukti.

#### 2.2 Hubungkan expense personal-paid ke ledger

Flow:

1. User submit expense dengan Payment Method = Personal Paid.
2. Direktur approve.
3. System membuat row di `Shareholder_Ledger`.
4. Dashboard Finance menampilkan total outstanding.

#### 2.3 Dashboard finance

Di `/finance` tampilkan:

- saldo kas/bank
- hutang pemegang saham
- expense pending
- burn rate bulan ini
- cash runway sederhana

---

### Phase 3 — 21 Hari: Compliance Register

#### 3.1 Buat `Compliance_Register`

Implementasi:

- API: `/api/governance/compliance-register`
- Integrasi ke `/compliance`, `/bpjs`, `/tax-compliance`

Data awal:

- LKPM Q2 2026: deadline 2026-07-15.
- BPJSKT: 1 peserta, paid-through 2026-06-25, paid personally.
- BPJSKS: belum.
- Pajak dari `Pajak_Tracking`.
- Legal/OSS/NIB/NPWP jika dokumen tersedia.

#### 3.2 Agent reminder

Agent mengirim alert:

- H-7
- H-3
- H-1
- overdue

Untuk Telegram/Discord sesuai channel operasi.

#### 3.3 Risk badge

Compliance item diberi badge:

- Green: submitted/paid
- Yellow: due <= 7 hari
- Red: overdue/not started

---

### Phase 4 — 30 Hari: Vendor, Procurement & Conflict of Interest

#### 4.1 Buat `Vendor_Register`

Integrasi:

- `/procurement`
- `/reorder`
- `/budget`
- `/expenses`

Rules:

- Expense kategori Bahan Baku / Packaging / Venue / Dokumentasi wajib bisa dikaitkan ke vendor.
- Vendor baru wajib ada status `Trial` sampai diverifikasi.
- Related party wajib deklarasi.

#### 4.2 Approval threshold

Rekomendasi threshold awal SWI:

| Nominal | Approval |
|---:|---|
| <= Rp500.000 | PIC divisi boleh submit; tetap tercatat |
| Rp500.001–Rp2.000.000 | Direktur approve |
| > Rp2.000.000 | Direktur approve + minimal 2 pembanding vendor |
| Vendor related party | Direktur approve + catatan konflik kepentingan |
| Pajak/legal/termination | Human-only, tidak auto-agent |

Catatan: threshold ini bisa disesuaikan setelah data cashflow 2–3 bulan stabil.

---

### Phase 5 — 45 Hari: Event Closeout Report

Target utama untuk Fragrantions/Road to Fragrantions.

#### 5.1 Event closeout di `/events/[id]`

Tambahkan tab:

- Budget vs Actual
- Revenue tenant
- Revenue sponsor
- Expense by category
- Receivable/payable
- Dokumentasi media
- Lessons learned
- Final profit/loss

Sumber:

- `Event_Budget`
- `Expense_Submissions`
- `Event_Tenants`
- `Event_Sponsors`
- `Event_Media`
- `Governance_Audit_Log`

#### 5.2 Report generator

Di `/documents`, tambahkan template:

- `Event Closeout Report`
- `Monthly GCG Report`

---

### Phase 6 — 60 Hari: GCG Dashboard

Buat dashboard baru:

- Route: `/governance`
- API: `/api/governance/dashboard`

Isi dashboard:

1. Transparency Score
   - % transaksi dengan bukti
   - % expense yang punya division/category
   - laporan bulanan terakhir

2. Accountability Score
   - % task punya owner
   - % expense punya approver
   - overdue task/compliance

3. Responsibility Score
   - compliance on-time
   - pajak/BPJS/LKPM status

4. Independency Score
   - % vendor dengan benchmark
   - related-party transactions

5. Fairness Score
   - reimbursement outstanding
   - shareholder debt aging
   - vendor payment overdue

6. Etika Keuangan Exceptions
   - expense tanpa bukti
   - transaksi besar tanpa approval
   - personal paid belum masuk ledger
   - event actual > budget tanpa notes

---

## 6. SOP Ringkas yang Harus Dijalankan di System SWI

### SOP 1 — Semua transaksi harus punya sumber

Setiap pengeluaran/pemasukan harus punya salah satu:

- Cash_Harian
- Buku_Kas
- Expense_Submissions
- Shareholder_Ledger
- Event_Budget
- Brand_Expenses

Tidak boleh ada angka laporan yang tidak bisa ditelusuri.

### SOP 2 — Expense wajib lewat approval

Tidak boleh memasukkan expense langsung ke Brand_Expenses/Event_Budget tanpa submission jika ada workflow approval.

### SOP 3 — Uang pribadi harus masuk ledger

Jika Beriman/pemegang saham bayar sesuatu untuk perusahaan:

- masuk `Expense_Submissions` jika expense operasional,
- lalu masuk `Shareholder_Ledger` setelah approved.

### SOP 4 — Compliance harus punya owner dan due date

LKPM, BPJS, Pajak, BPOM/Halal, dokumen legal tidak boleh hanya diingat manual.

### SOP 5 — Vendor related party wajib deklarasi

Vendor milik teman/keluarga boleh saja, tapi harus ditandai dan diberi alasan objektif.

---

## 7. Roadmap Implementasi Teknis

### Minggu 1

- [ ] Tambahkan field division/COA/paymentMethod/shareholderDebtFlag di Expense_Submissions.
- [ ] Tambahkan `Governance_Audit_Log`.
- [ ] Update `PUT /api/expenses/[id]` agar menulis audit log.
- [ ] Tambahkan dashboard warning di `/expenses`.

### Minggu 2

- [ ] Buat `Shareholder_Ledger` sheet helper.
- [ ] Buat `/api/shareholder-ledger`.
- [ ] Tambahkan tab Hutang Pemegang Saham di `/finance`.
- [ ] Auto-create ledger entry dari approved personal-paid expense.

### Minggu 3

- [ ] Buat `Compliance_Register`.
- [ ] Integrasi `/compliance`, `/bpjs`, `/tax-compliance`.
- [ ] Seed data LKPM Q2, BPJSKT, BPJSKS, Pajak Tracking.
- [ ] Agent reminder compliance.

### Minggu 4

- [ ] Buat `Vendor_Register`.
- [ ] Tambahkan vendor dropdown di expense/procurement.
- [ ] Tambahkan threshold approval.
- [ ] Tambahkan conflict-of-interest declaration.

### Minggu 5–6

- [ ] Event closeout report di `/events/[id]`.
- [ ] Template dokumen Event Closeout Report di `/documents`.
- [ ] Monthly GCG Report generator.

### Minggu 7–8

- [ ] Buat `/governance` dashboard.
- [ ] Buat `/api/governance/dashboard`.
- [ ] Hitung GCG score berbasis data sheet.
- [ ] Tambahkan export CSV/PDF untuk pemegang saham.

---

## 8. Acceptance Criteria

Implementasi dianggap berhasil jika:

- [ ] Semua expense approved/rejected tercatat di `Governance_Audit_Log`.
- [ ] Tidak ada expense approved tanpa division/category.
- [ ] Expense personal-paid otomatis muncul sebagai draft/entry di `Shareholder_Ledger`.
- [ ] LKPM/BPJS/Pajak muncul di `Compliance_Register` dengan due date dan status.
- [ ] `/finance` menampilkan hutang pemegang saham.
- [ ] `/expenses` menampilkan pending, approved, rejected, needs proof.
- [ ] `/events/[id]` bisa menampilkan budget vs actual.
- [ ] `/documents` bisa generate Monthly GCG Report berbasis data nyata.
- [ ] `/governance` menampilkan 5 prinsip GCG + exceptions.
- [ ] Build dan test pass.

---

## 9. Validation Commands

Jalankan dari repo `/home/ubuntu/systemswi`:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Jika command berbeda sesuai package scripts, cek:

```bash
pnpm run
```

API smoke test setelah deploy:

```bash
curl -s https://systemswi.vercel.app/api/expenses | jq '.sourceStatus, .stats'
curl -s https://systemswi.vercel.app/api/agent/audit | jq '.'
curl -s https://systemswi.vercel.app/api/dashboard | jq '.'
```

---

## 10. Prinsip Penting

1. Jangan buat angka dummy untuk laporan pemegang saham.
2. Jika data belum ada, tampilkan `TBA`, `0`, atau `Belum dicatat`.
3. Google Sheets tetap sumber kebenaran.
4. System SWI hanya boleh menganalisis/menggabungkan/menampilkan data nyata.
5. Agent boleh memberi rekomendasi, tapi approval legal, pajak, vendor besar, dan konflik kepentingan tetap manusia.
6. Semua approval harus meninggalkan audit trail.

---

## 11. Prioritas Implementasi Paling Dekat

Urutan paling masuk akal:

1. **Perkuat Expense Approval** — karena sudah ada dan paling dekat dengan etika keuangan.
2. **Tambah Shareholder Ledger** — untuk memisahkan uang pribadi vs uang perusahaan.
3. **Tambah Compliance Register** — untuk LKPM, BPJS, Pajak, BPOM/Halal.
4. **Tambah Vendor Register** — untuk independensi & conflict-of-interest.
5. **Tambah Monthly GCG Report** — untuk transparency ke pemegang saham.
6. **Tambah Governance Dashboard** — untuk monitoring keseluruhan.

Jika hanya punya waktu 7 hari, kerjakan nomor 1 dan 2 dulu.
