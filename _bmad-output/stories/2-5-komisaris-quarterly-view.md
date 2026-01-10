# Story 2.5: Komisaris Quarterly View

Status: done

## Story

As a **Komisaris**,
I want **to see quarterly review dashboard**,
so that **I can monitor company performance**.

## Acceptance Criteria

1. **AC1:** Komisaris sees quarterly summary
   - **Given** I am logged in as Komisaris
   - **When** I view the dashboard
   - **Then** I see quarterly performance summary

2. **AC2:** No edit access
   - **Given** I am Komisaris
   - **When** I view the dashboard
   - **Then** I only see view-only information

## Tasks / Subtasks

- [x] Task 1: Create quarterly view widget
  - [x] 1.1 Create `src/components/widgets/quarterly-summary.tsx`
  - [x] 1.2 Add quarterly mock data

- [x] Task 2: Integrate to dashboard with RBAC
  - [x] 2.1 Show for CEO/COO/Komisaris roles
  - [x] 2.2 Build verification passed

## Dev Notes

- Komisaris role has "view" access only
- Use RoleGate to show/hide based on role
- Can show same data as CEO/COO but read-only

## File List

**Created:**
- `src/components/widgets/quarterly-summary.tsx` - QuarterlySummary component

**Modified:**
- `src/lib/auth/permissions.ts` - Added dashboard:quarterly feature
- `src/lib/dashboard/mock-data.ts` - Added QuarterlyData
- `src/lib/dashboard/hooks.ts` - Added quarterly to hook return
- `src/components/widgets/index.ts` - Added export
- `src/app/(workspace)/dashboard/page.tsx` - Added widget

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-10 | Story created | Gemini 2.5 Pro |
