# SWI Module Development Plan v2 — 2026-06-19

## Audit Hasil: 64 Sheets di "Keuangan PT Sensasi Wangi Indonesia"

### Kategori A: Sheet ADA DATA (langsung bisa di-UI-kan)
| Sheet | Rows | Modul | Status UI |
|-------|------|-------|-----------|
| Produksi | 99 | Production | ✅ Sudah |
| Event (transaksi) | 98 | Finance | ✅ Sudah |
| Store (transaksi) | 98 | Finance | ✅ Sudah |
| Ecommerse | 98 | E-Commerce | ❌ Perlu |
| SukukProduk | 89 | Sukuk | ❌ Perlu |
| SukukStore | 73 | Sukuk | ❌ Perlu |
| RAB_Store_TIM | 65 | RAB | ❌ Perlu |
| Holding | 58 | Finance | ✅ Sudah |
| COA | 51 | Finance | ✅ Sudah |
| Rekap_Rekening | 44 | Finance | ✅ Sudah |
| Proyeksi_Cashflow_Store | 34 | Cashflow | ❌ Perlu |
| Rekening_Koran | 31 | Finance | ✅ Sudah |
| Laporan_Harian | 29 | Reports | ❌ Perlu |
| SOP_Store | 29 | SOP | ❌ Perlu |
| Cashflow_Forecast | 28 | Cashflow | ❌ Perlu |
| Tax_Calendar | 26 | Tax | ✅ Sudah |
| Dashboard | 23 | Dashboard | ✅ Sudah |
| RAB_Perbandingan_Skema | 23 | RAB | ❌ Perlu |
| Artisan_Program | 21 | Artisan | ❌ Perlu |
| DivisiShareholders | 18 | Equity | ✅ Sudah |
| Sukuk_Payment_Schedule | 16 | Sukuk | ❌ Perlu |
| PemegangSaham | 15 | Equity | ✅ Sudah |
| Budget_vs_Actual | 15 | Finance | ❌ Perlu |
| Laporan_Bulanan | 14 | Reports | ❌ Perlu |
| RekapSetoran | 13 | Setoran | ❌ Perlu |
| Legal_Compliance | 13 | Compliance | ✅ Sudah |
| Pajak_Tracking | 11 | Tax | ✅ Sudah |
| Merch_TIM | 11 | Merch | ❌ Perlu |
| Event_Timeline | 9 | Events | ❌ Perlu |
| Brand_Dashboard | 9 | Brands | ❌ Perlu |
| KPI_Dashboard | 6 | Dashboard | ❌ Perlu |
| Inventory_Master | 6 | Inventory | ✅ Sudah |
| Shared_Resources | 6 | Resources | ❌ Perlu |
| Events | 5 | Events | ❌ Perlu |
| OSS_Status | 5 | Compliance | ❌ Perlu |
| Event_Dashboard | 4 | Events | ❌ Perlu |
| Brand_Production | 4 | Production | ✅ Sudah |
| BPOM_Registry | 4 | BPOM | ✅ Sudah |
| Brand_Tracking | 3 | Brands | ❌ Perlu |
| Cash_Harian | 3 | Finance | ❌ Perlu |
| Brand_Master | 3 | Brands | ✅ Sudah |
| SukukMikro_Investments | 3 | Sukuk | ❌ Perlu |
| Inventory_Movements | 2 | Inventory | ✅ Sudah |
| Supplier_Master | 2 | Procurement | ❌ Perlu |
| Buku_Kas | 1 | Finance | ❌ Perlu |
| Store_Daily_Log | 1 | Store | ❌ Perlu |
| SukukMikro_Distributions | 1 | Sukuk | ❌ Perlu |

### Kategori B: Sheet KOSONG (perlu data dulu)
| Sheet | Modul | Catatan |
|-------|-------|---------|
| Purchase_Orders | Procurement | Perlu contoh data PO |
| Goods_Receipts | Procurement | Perlu contoh data receipt |
| Event_Budget | Events | Perlu data budget event |
| Event_Tenants | Events | Perlu data tenant/brand |
| Event_Sponsors | Events | Perlu data sponsor |
| Store_Daily | Store | Perlu data daily sales |
| Ecommerse_Metrics | E-Commerce | Perlu metrics |
| Sukuk_Reporting | Sukuk | Perlu reporting data |
| Cashflow_Aktual | Cashflow | Perlu actual data |
| Brand_Sales | Brands | Perlu data penjualan |
| Brand_Expenses | Brands | Perlu data pengeluaran |
| Compliance_Checks | Compliance | Perlu data compliance |
| Product_Batches | Production | Perlu data batch |
| QC_Checklist | Production | Perlu data QC |
| BPOM_Timeline | BPOM | Perlu timeline data |
| Tax_Documents | Tax | Perlu data dokumen pajak |

## Rencana Development (8 Module, 4 Phase)

### Phase 1: Operations (Minggu 1-2)
**Fokus: Module yang data-nya sudah ada dan critical untuk operations**

#### 1. Procurement / PO ✅ SELESAI
- **Sheets:** Supplier_Master (2 rows), Purchase_Orders (0), Goods_Receipts (0)
- **API:** /api/procurement (CRUD supplier, PO, receipt) ✅
- **UI:** /procurement — Supplier list, PO form, Receipt form ✅
- **QA:** Full CRUD tested, Google Sheets sync verified ✅
- **Live:** /procurement ✅

#### 2. Events / Fragrantions ✅ SELESAI
- **Sheets:** Events (5 rows), Event_Timeline (9 rows), Event_Dashboard (4 rows)
- **API:** /api/events (CRUD event, timeline, budget, tenants, sponsors) ✅
- **UI:** /events — Event list, timeline, budget tracking, tenant & sponsor management ✅
- **QA:** Create event → verify Sheets ✅
- **Live:** /events ✅

#### 3. Store Daily ✅ SELESAI
- **Sheets:** Store_Daily_Log (1 row), Store_Daily (0 rows)
- **API:** /api/store-daily (GET/POST/UPDATE/DELETE daily entries) ✅
- **UI:** /store-daily — Daily sales input, traffic/conversion tracking ✅
- **QA:** Input daily → verify Sheets ✅
- **Live:** /store-daily ✅

#### 4. Sukuk Mikro ✅ SELESAI
- **Sheets:** SukukStore (73 rows), SukukProduk (89 rows), SukukMikro_Investments (3 rows), SukukMikro_Distributions (1 row), Sukuk_Payment_Schedule (16 rows)
- **API:** /api/sukuk/products, /api/sukuk/invest, /api/sukuk/distributions (Google Sheets + SQLite fallback) ✅
- **UI:** /sukuk — Produk list, investor management, distribution tracking, payment schedule ✅
- **QA:** CRUD investment → verify Sheets ✅
- **Live:** /sukuk ✅

### Phase 2: Business Intelligence (Minggu 3-4)

#### 5. E-Commerce ✅ SELESAI
- **Sheets:** Ecommerse (48 rows transaksi), Ecommerse_Metrics (0)
- **API:** /api/ecommerce (GET/POST/UPDATE/DELETE transactions) ✅
- **UI:** /ecommerce — Transaction list, metrics dashboard ✅
- **QA:** Read transactions → verify matches Sheets ✅
- **Live:** /ecommerce ✅

#### 6. Cashflow ✅ SELESAI
- **Sheets:** Cashflow_Forecast (28 rows), Proyeksi_Cashflow_Store (34 rows), Cashflow_Aktual (0)
- **API:** /api/cashflow (GET forecast/actual, POST actual) ✅ + /api/finance/cashflow (projection)
- **UI:** /cashflow — Forecast vs actual comparison, projection ✅
- **QA:** Input actual → verify Sheets ✅
- **Live:** /cashflow ✅

#### 7. Reports ✅ SELESAI
- **Sheets:** Laporan_Harian (29 rows), Laporan_Bulanan (14 rows)
- **API:** /api/reports (GET harian/bulanan, generate markdown reports) ✅
- **UI:** /reports — Report viewer dengan filter bulan/tahun, PDF export ✅
- **QA:** Read data → verify matches Sheets ✅
- **Live:** /reports ✅

#### 8. Merch TIM ✅ SELESAI
- **Sheets:** Merch_TIM (11 rows)
- **API:** /api/merch (GET/POST/UPDATE/DELETE) ✅
- **UI:** /merch — Product list, COGS tracking, margin analytics ✅
- **QA:** CRUD merch → verify Sheets ✅
- **Live:** /merch ✅

## QA Process (Setiap Module)
1. Build API route → test dengan curl
2. Build UI → verify render di browser
3. Test CREATE → verify data masuk Sheets (baca balik via readRange)
4. Test READ → verify data dari Sheets tampil di UI
5. Test UPDATE → verify data ter-update di Sheets
6. Test DELETE → verify data terhapus dari Sheets
7. Build & deploy ke Vercel → verify live
8. Update plan document

## Cron Job Strategy
- 1 cron job: "SWI Module Builder — All Phases"
- Setiap run: baca plan, cari module pertama yang belum selesai, build → QA → commit → push → verify → report
- Setelah semua 8 module selesai: cron berhenti otomatis
- Delivery: Telegram

## Timeline
- Phase 1 (Procurement + Events + Store Daily + Sukuk): ~2 minggu
- Phase 2 (E-Commerce + Cashflow + Reports + Merch): ~2 minggu
- Total: ~4 minggu dengan QA
