# Expense Approval Flow — Development Plan

## Tujuan
Sistem expense tracking dengan approval flow:
1. Karyawan submit expense + upload bukti (foto struk/invoice)
2. Direktur review → approve / reject
3. Tracking pengeluaran per event, per brand, per kategori
4. Dashboard "expense pending" + riwayat approval

## Sheet yang Digunakan

### Existing (hanya read)
- `Brand_Expenses` (A1:L1000) — data pengeluaran per brand
- `Event_Budget` (A1:H1000) — budget per event

### Baru (dibuat oleh cron)
- `Expense_Submissions` — submission expense dari karyawan
  - A: Submission ID, B: Date, C: Submitter Name, D: Related Event/Project
  - E: Category (Bahan Baku / Iklan / Sewa Booth / Transport / Packaging / Lainnya)
  - F: Description, G: Amount, H: Proof URL (Google Drive file ID)
  - I: Status (Pending / Approved / Rejected), J: Reviewed By, K: Reviewed Date, L: Notes
- `Expense_Approvers` — list approver (default: direksi)
  - A: Approver ID, B: Name, C: Role, D: Email

## API Routes

| Method | Route | Deskripsi |
|--------|-------|-----------|
| GET | `/api/expenses` | List submissions (filter: status, event, category) |
| POST | `/api/expenses` | Submit new expense + upload proof |
| GET | `/api/expenses/[id]` | Detail submission |
| PUT | `/api/expenses/[id]` | Approve / reject (update status) |
| GET | `/api/expenses/pending` | List pending untuk approver |

## UI: `/expenses`

### Tab 1: Dashboard
- Total pending amount
- Total approved this month
- Budget vs actual per event
- Recent submissions (last 10)

### Tab 2: My Submissions
- List expense yang sudah di-submit user
- Status badges (Pending 🟡 / Approved ✅ / Rejected ❌)
- Add new expense button

### Tab 3: Pending Approvals (Approver only)
- List expense yang perlu di-approve
- Approve / reject buttons
- Detail modal dengan proof image preview

### Tab 4: All Expenses (Riwayat)
- Full list dengan filter (date range, status, event, category)
- Export to CSV

## Form: Submit Expense
- Related Event/Project (dropdown dari Event_Budget)
- Category (dropdown)
- Description (text)
- Amount (number)
- Proof upload (file → Google Drive)

## Approval Flow
1. POST /api/expenses → Status = "Pending"
2. PUT /api/expenses/[id] → { status: "Approved" | "Rejected", reviewedBy, notes }
3. Jika Approved → amount masuk ke Brand_Expenses (create row)

## Integrasi
- Brand_Expenses: auto-insert row ketika expense di-approve
- Event_Budget: compare actual expenses vs budget
- Google Drive: upload proof ke folder `02_Data Perusahaan/05_Expense_Proofs/`

## Seed Data
- 5 sample submissions (mix pending/approved/rejected)
- 1 approver: Beriman (Direktur)
