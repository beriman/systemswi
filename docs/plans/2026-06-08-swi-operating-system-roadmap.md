# SWI Operating System Roadmap

> Owner: HemuHemu / Hermes Agent for PT Sensasi Wangi Indonesia
>
> Status: active development. Dashboard is intentionally open without login until `NEXT_PUBLIC_ENABLE_AUTH=true` and `ENABLE_PORTAL_AUTH=true` are set.

## Goal

Build `systemswi` into the operating system for SWI: finance, shareholder equity, events/Fragrantions, tenants, sponsors, documents, automation, and management reporting with Google Sheets as the single source of truth during the current development phase.

## Current Architecture

- App: Next.js App Router on Vercel.
- Source of truth: Google Sheets, surfaced through API routes under `src/app/api/*`.
- UI: workspace pages under `src/app/(workspace)/*`.
- Auth: kept in code but disabled by default for development.
- Deployment: GitHub `main` triggers Vercel production.

## Operating Principles

1. Google Sheets remains the finance/data source of truth until a migration is explicitly approved.
2. Financial values must avoid ambiguous Indonesian shorthand: use `Juta`/`Jt`, never `M` for million.
3. Bank balance is not the same as paid-in capital; shareholder debt reductions can happen outside Rekening Koran.
4. Event division / Fragrantions is a priority module.
5. Every user-visible change must be verified locally and then verified again on production.

## Phase 0 — Stabilize Access and Deployment

- [x] Disable development auth barrier while preserving auth code for later.
- [x] Root `/` opens the operating dashboard in development mode.
- [x] Verify `/dashboard`, `/finance`, and `/api/dashboard` locally.
- [ ] Unblock Vercel production deployment.
- [ ] Verify `systemswi.vercel.app` shows dashboard and current shareholder data.

## Phase 1 — Executive Dashboard

Purpose: one screen for Beriman to know business health.

Modules:
- Cash position by bank account.
- Paid-in capital / shareholder obligations.
- Open receivables and payables.
- Event pipeline summary.
- Upcoming deadlines: tax, vendor, tenant, sponsor, venue, permits.
- Alert cards for missing data or inconsistent numbers.

Primary files:
- `src/app/(workspace)/dashboard/page.tsx`
- `src/app/api/dashboard/route.ts`
- `src/lib/sheets/sheets-real.ts`

## Phase 2 — Finance and Shareholder Equity

Purpose: reliable capital, cash, and obligation tracking.

Modules:
- Shareholder dashboard: Beriman, Malsiaf, Wapiq.
- Paid-in capital vs remaining obligation.
- Non-bank capital adjustments such as salary offset for Beriman/Wapiq.
- Bank statement upload/import.
- Transaction categorization.
- Monthly management report.

Primary files:
- `src/app/(workspace)/finance/page.tsx`
- `src/app/api/transactions/route.ts`
- `src/app/api/finance/upload/route.ts`
- Google Sheets: `PemegangSaham`, transaction sheets, bank sheets.

## Phase 3 — Event / Fragrantions Management

Purpose: run Fragrantions like a controlled business unit.

Modules:
- Event master list.
- Budget planned vs actual.
- Tenant CRM and booth/payment status.
- Sponsor CRM and package status.
- Timeline/milestone tracker.
- Event dashboard: revenue, cost, margin, tenant count, sponsor value, attendance target.

Primary files:
- `src/app/(workspace)/events/page.tsx`
- `src/app/(workspace)/events/[id]/page.tsx`
- `src/app/api/events/route.ts`
- Google Sheets: `Events`, `Event_Budget`, `Event_Tenants`, `Event_Sponsors`, `Event_Timeline`, `Event_Dashboard`.

## Phase 4 — Documents, Drive, and Compliance

Purpose: make company records easy to find and audit.

Modules:
- Drive document index.
- Legal/company docs.
- Tax and BPJS reminders.
- Investor documents.
- Memory log / audit trail links.

Primary files:
- `src/app/(workspace)/documents/page.tsx`
- `src/app/(workspace)/drive/page.tsx`
- `src/app/(workspace)/reports/page.tsx`

## Phase 5 — Automation and AI Assistant

Purpose: reduce manual work.

Modules:
- Daily health check of Sheets/API/Vercel.
- Data consistency checker.
- Telegram alerts for missing payments/deadlines.
- AI summary for monthly management report.
- Import helpers for bank PDFs/CSVs.

Primary files:
- `src/app/(workspace)/automation/page.tsx`
- `src/app/(workspace)/ai/page.tsx`

## Immediate Next Build Tasks

1. Fix production deployment blocker and verify latest commit is live.
2. Polish dashboard cards so shareholder values are visible without needing manual API inspection.
3. Build event dashboard from the six event sheets.
4. Add data quality alerts for finance and event sheets.
5. Create monthly SWI management report page.

## Verification Checklist

Before claiming a feature is done:

- Run `npm run build`.
- Run local server and check the affected route/API.
- Push to GitHub.
- Check GitHub/Vercel deployment status for the pushed SHA.
- Hit `https://systemswi.vercel.app` and the affected production endpoints.
- Report any blocker honestly instead of assuming deploy success.
