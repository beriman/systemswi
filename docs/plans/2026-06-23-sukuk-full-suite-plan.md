# Plan: Sukuk Full Suite Enhancement

**Date:** 2026-06-23
**Status:** In Progress

## Summary
Enhance the existing `/sukuk` page with full-featured tabs for investors, creditors, RAB, schedule, audit, notifications, projections, and store performance. All backed by Google Sheets as source of truth.

## Existing State
- ✅ API routes: investors, creditors, products, rab, schedule, audit, notifications, proyeksi, store
- ✅ UI page with all tabs implemented
- ✅ Google Sheets integration via `sheets-real.ts`
- ❌ No seed data in Google Sheets (all tabs show "no data")

## Tasks

### 1. Seed Data Script ✅
- Created `scripts/seed-sukuk-full-suite.ts`
- Populates all 9 Sukuk sheets with demo data

### 2. Run Seed — Populate Google Sheets
- Execute `npx tsx scripts/seed-sukuk-full-suite.ts`
- Verify data appears in all sheets

### 3. Verify API Endpoints
- GET /api/sukuk/investors → 200 with 5 investors
- GET /api/sukuk/products → 200 with 5 products
- GET /api/sukuk/audit → 200 with 10 logs
- GET /api/sukuk/creditors → 200 with 3 creditors
- GET /api/sukuk/rab → 200 with 3 entries
- GET /api/sukuk/schedule → 200 with 6 entries
- GET /api/sukuk/notifications → 200 with 5 items
- GET /api/sukuk/proyeksi → 200 with 3 projections
- GET /api/sukuk/store → 200 with 5 stores

### 4. Commit & Push
- Commit: "feat: Sukuk Full Suite enhancement"
- Push to main
- Verify live at https://systemswi.vercel.app/sukuk
