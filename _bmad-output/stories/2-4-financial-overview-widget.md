# Story 2.4: Financial Overview Widget

Status: done

## Story

As a **CEO/COO**,
I want **to see financial summary**,
so that **I understand cash flow at a glance**.

## Acceptance Criteria

1. **AC1:** Widget shows financial summary
   - **Given** I am on dashboard
   - **When** I view the widget  
   - **Then** I see budget, spent, remaining

2. **AC2:** Pending approvals shown
   - **Given** there are pending approvals
   - **When** count > 0
   - **Then** widget shows attention styling

## Tasks / Subtasks

- [x] Task 1: Create financial overview widget
  - [x] 1.1 Create `src/components/widgets/financial-overview.tsx`

- [x] Task 2: Integrate to dashboard
  - [x] 2.1 Add widget to dashboard
  - [x] 2.2 Build verification passed

## Dev Notes

Uses existing:
- `StatCard` component
- `useDashboardData` hook (already has financialOverview)

Mock data already defined:
```typescript
financialOverview: {
  totalBudget: 50000000, // 50jt
  spent: 32000000,
  remaining: 18000000,
  pendingApprovals: 3,
}
```

## File List

**Created:**
- `src/components/widgets/financial-overview.tsx` - FinancialOverviewWidget

**Modified:**
- `src/components/widgets/index.ts` - Added export
- `src/app/(workspace)/dashboard/page.tsx` - Added widget

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-10 | Story created | Gemini 2.5 Pro |
