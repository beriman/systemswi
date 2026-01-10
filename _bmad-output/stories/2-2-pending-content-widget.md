# Story 2.2: Pending Content Widget

Status: done

## Story

As a **CEO/COO**,
I want **to see pending content count**,
so that **I know what needs review**.

## Acceptance Criteria

1. **AC1:** Widget shows pending content count
   - **Given** I am on dashboard
   - **When** I view the widget
   - **Then** I see count of pending content

2. **AC2:** Widget has visual indicator
   - **Given** pending content exists
   - **When** count > 0
   - **Then** widget shows attention styling

## Tasks / Subtasks

- [x] Task 1: Create widget components
  - [x] 1.1 Create `src/components/widgets/stat-card.tsx`
  - [x] 1.2 Create `src/components/widgets/pending-content.tsx`

- [x] Task 2: Add mock data service
  - [x] 2.1 Create `src/lib/dashboard/mock-data.ts`
  - [x] 2.2 Create `src/lib/dashboard/hooks.ts`

- [x] Task 3: Integrate to dashboard
  - [x] 3.1 Add widget to dashboard page
  - [x] 3.2 Build verification passed

## Dev Notes

### Widget Design
- Card with icon, title, count
- Color coding: warning if pending > 0
- Click to navigate to content review

### Mock Data (MVP)
```typescript
const pendingContent = {
  total: 5,
  byType: {
    posts: 2,
    images: 3
  }
}
```

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro

### File List

**Created:**
- `src/components/widgets/stat-card.tsx` - Reusable stat card
- `src/components/widgets/pending-content.tsx` - PendingContentWidget
- `src/components/widgets/index.ts` - Barrel export
- `src/lib/dashboard/mock-data.ts` - Mock data
- `src/lib/dashboard/hooks.ts` - useDashboardData hook
- `src/lib/dashboard/index.ts` - Barrel export

**Modified:**
- `src/app/(workspace)/dashboard/page.tsx` - Added widget

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-10 | Story created | Gemini 2.5 Pro |
