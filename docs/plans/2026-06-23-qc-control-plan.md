# QC / Quality Control — Development Plan

## Tujuan
Sistem quality control untuk produksi parfum:
1. QC checklist per batch (aroma, warna, kejernihan, packaging, seal)
2. Track pass/fail per batch
3. Product batch tracking (raw → finished good)
4. QC report per brand

## Sheet yang Digunakan

### Existing (read + write)
- `QCChecklist` (A1:P1000) — QC checklist template
- `ProductBatches` (A1:T1000) — product batch tracking

### Baru
- `QC_Results` — hasil QC per batch
  - A: Result ID, B: Batch Code, C: Production ID, D: Date, E: Inspector
  - F: Aroma Score (1-10), G: Warna Score, H: Kejernihan Score
  - I: Packaging Score, J: Seal Integrity Score, K: Overall Score
  - L: Status (Pass/Fail/Conditional), M: Notes, N: Follow-up Required

## API Routes

| Method | Route | Deskripsi |
|--------|-------|-----------|
| GET | `/api/qc` | List QC results (filter: batch, brand, status) |
| POST | `/api/qc` | Submit QC result |
| GET | `/api/qc/[id]` | QC detail |
| PUT | `/api/qc/[id]` | Update QC result |
| GET | `/api/qc/checklist` | Get QC checklist template |
| GET | `/api/qc/batch/[code]` | QC history per batch |

## UI: `/qc`

### Tab 1: Dashboard
- Total QC this month | Pass rate % | Fail count | Pending QC
- Recent QC results
- Pass rate per brand

### Tab 2: QC Checklist
- Form: select batch → fill checklist scores (1-10 each)
- Auto-calculate overall score
- Submit → auto-set Pass/Fail/Conditional

### Tab 3: Batch Tracking
- Table: Batch Code | Product | Date | QC Status | Inspector
- Filter by status, brand, date

### Tab 4: QC Reports
- QC detail per batch
- Print/export QC report
- Historical trend

## Seed Data
- 5 QC results (3 Pass, 1 Fail, 1 Conditional)
- QC checklist template items
