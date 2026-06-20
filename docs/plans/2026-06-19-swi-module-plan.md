# SWI Module Development Plan — 2026-06-19

## Overview
64 sheets di Google Sheets "Keuangan PT Sensasi Wangi Indonesia".
Saat ini sudah live: Production, Inventory, BPJS, BPOM, Dashboard, Finance, Compliance, Email, Documents, Invoice, Tax, Workflow, Brands.

## Phase 1: Operations Critical (Minggu 1-2)

### 1. Procurement / PO
**Sheets:** Supplier_Master (2 rows), Purchase_Orders (0 rows), Goods_Receipts (0 rows)
**API:** /api/procurement (GET suppliers, POST/DELETE supplier, POST/DELETE PO, POST/DELETE receipt)
**UI:** /procurement — Supplier list, PO form, Goods Receipt form, sidebar entry
**QA:** CRUD supplier → verify Sheets. Create PO → verify Sheets. Receive goods → verify inventory update.

### 2. Events / Fragrantions
**Sheets:** Events (4 rows), Event_Timeline (4 rows), Event_Dashboard (4 rows), Event_Budget (0), Event_Tenants (0), Event_Sponsors (0)
**API:** /api/events (GET events/timeline/dashboard, POST/DELETE event, POST/DELETE tenant, POST/DELETE sponsor, POST/DELETE budget)
**UI:** /events — Event list, timeline, budget tracking, tenant & sponsor management
**QA:** CRUD event → verify Sheets. Add tenant/sponsor → verify Sheets.

### 3. Store Daily
**Sheets:** Store_Daily (0 rows), Store_Daily_Log (1 row)
**API:** /api/store-daily (GET daily/log, POST daily entry)
**UI:** /store-daily — Daily sales input, traffic/conversion tracking, log history
**QA:** Input daily sales → verify Sheets.

## Phase 2: Business Intelligence (Minggu 3-4)

### 4. E-Commerce
**Sheets:** Ecommerse (4 rows), Ecommerse_Metrics (0 rows)
**API:** /api/ecommerce (GET transactions/metrics, POST transaction)
**UI:** /ecommerce — Transaction list, metrics dashboard
**QA:** CRUD transaction → verify Sheets.

### 5. Cashflow
**Sheets:** Cashflow_Forecast (4 rows), Cashflow_Aktual (0 rows)
**API:** /api/cashflow (GET forecast/actual, POST actual entry)
**UI:** /cashflow — Forecast vs actual comparison
**QA:** Input actual → verify Sheets.

### 6. Reports (Laporan Harian & Bulanan)
**Sheets:** Laporan_Harian (3 rows), Laporan_Bulanan (4 rows)
**API:** /api/reports (GET harian/bulanan)
**UI:** /reports — Harian & bulanan report viewer
**QA:** Read data → verify matches Sheets.

## Phase 3: Sukuk & Partnership (Minggu 5-6)

### 7. Sukuk Mikro
**Sheets:** SukukStore (4 rows), SukukProduk (4 rows), SukukMikro_Investments (3 rows), SukukMikro_Distributions (1 row)
**API:** /api/sukuk (GET store/products/investments/distributions, POST investment, POST distribution)
**UI:** /sukuk — Product list, investor management, distribution tracking
**QA:** CRUD investment → verify Sheets.

### 8. Merch TIM
**Sheets:** Merch_TIM (4 rows)
**API:** /api/merch (GET/POST/DELETE merch items)
**UI:** /merch — Product list, COGS tracking
**QA:** CRUD merch → verify Sheets.

### 9. Artisan Program
**Sheets:** Artisan_Program (4 rows)
**API:** /api/artisan (GET/POST/DELETE artisan)
**UI:** /artisan — Artisan list, revenue share tracking
**QA:** CRUD artisan → verify Sheets.

## Phase 4: Planning & Resources (Minggu 7-8)

### 10. RAB Store TIM
**Sheets:** RAB_Store_TIM (4 rows), RAB_Perbandingan_Skema (3 rows)
**API:** /api/rab (GET RAB/perbandingan)
**UI:** /rab — RAB viewer, skema comparison
**QA:** Read data → verify matches Sheets.

### 11. Shared Resources
**Sheets:** Shared_Resources (4 rows)
**API:** /api/resources (GET/POST/DELETE resource)
**UI:** /resources — Resource list, category management
**QA:** CRUD resource → verify Sheets.

## QA Process (Setiap Module)
1. Build API route → test dengan curl/Postman
2. Build UI → verify render di browser
3. Test CREATE → verify data masuk Sheets
4. Test READ → verify data dari Sheets tampil di UI
5. Test UPDATE → verify data ter-update di Sheets
6. Test DELETE → verify data terhapus dari Sheets
7. Build & deploy ke Vercel → verify live

## Cron Job Strategy
- 1 cron job per phase (bukan per module)
- Setiap cron: build 1 module → QA → commit → push → verify live → report
- Cron berhenti otomatis setelah semua module selesai
- Delivery: Telegram + Discord #agent-logs

## Estimated Timeline
- Phase 1 (Procurement + Events + Store Daily): 2 minggu
- Phase 2 (Ecommerce + Cashflow + Reports): 2 minggu
- Phase 3 (Sukuk + Merch + Artisan): 2 minggu
- Phase 4 (RAB + Resources): 2 minggu
- Total: ~8 minggu dengan QA
