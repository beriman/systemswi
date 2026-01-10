# Story 2.1: Dashboard Layout

Status: done

## Story

As a **CEO/COO**,
I want **to see a dashboard overview**,
so that **I can quickly understand operational status**.

## Acceptance Criteria

1. **AC1:** Dashboard has proper layout structure
   - **Given** I am logged in as CEO/COO
   - **When** I view the dashboard
   - **Then** I see a well-organized layout with header, sidebar, and content area

2. **AC2:** Responsive design works
   - **Given** I am on any device
   - **When** I view the dashboard
   - **Then** the layout adapts to screen size

3. **AC3:** Navigation sidebar exists
   - **Given** I am on dashboard
   - **When** I view the sidebar
   - **Then** I see navigation links based on my role permissions

## Tasks / Subtasks

- [x] Task 1: Create dashboard layout components
  - [x] 1.1 Create `src/components/layout/dashboard-layout.tsx`
  - [x] 1.2 Create `src/components/layout/sidebar.tsx`
  - [x] 1.3 Create `src/components/layout/header.tsx`

- [x] Task 2: Apply layout to workspace routes
  - [x] 2.1 Create `src/app/(workspace)/layout.tsx`
  - [x] 2.2 Wrap dashboard in layout

- [x] Task 3: Add navigation with RBAC
  - [x] 3.1 Define nav items per role
  - [x] 3.2 Implement responsive sidebar

- [x] Task 4: Verify build
  - [x] 4.1 Build verification passed
  - [x] 4.2 Responsive design implemented

## Dev Notes

### Layout Structure
```
┌─────────────────────────────────────┐
│           Header                    │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │       Content            │
│  (nav)   │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

### Nav Items by Role
| Item | CEO/COO | Komisaris | Panitia | Freelancer |
|------|---------|-----------|---------|------------|
| Overview | ✓ | ✓ | ✗ | ✗ |
| Events | ✓ | ✓ | ✓ | ✗ |
| Media | ✓ | ✓ | ✗ | ✗ |
| Drive | ✓ | ✓ | ✗ | Limited |
| AI Chat | ✓ | ✗ | ✗ | ✗ |
| Settings | ✓ | ✗ | ✗ | ✗ |

### References
- [Source: Story 1.4 - permissions.ts for role checks]

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro

### File List

**Created:**
- `src/components/layout/sidebar.tsx` - Navigation sidebar with RBAC
- `src/components/layout/header.tsx` - Header with user info
- `src/components/layout/dashboard-layout.tsx` - Main layout wrapper
- `src/components/layout/index.ts` - Barrel export
- `src/app/(workspace)/layout.tsx` - Workspace route layout

**Modified:**
- `src/app/(workspace)/dashboard/page.tsx` - Simplified, uses layout

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-10 | Story created | Gemini 2.5 Pro |
