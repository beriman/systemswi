# Story 1.4: Role-Based Access Control

Status: done

## Story

As a **system admin**,
I want **users to have role-based access**,
so that **each role sees only relevant features**.

## Acceptance Criteria

1. **AC1:** Five roles exist in the system
   - **Given** the system is set up
   - **When** roles are defined
   - **Then** CEO, COO, Komisaris, Panitia, Freelancer roles exist

2. **AC2:** Role determines visible features
   - **Given** user with role
   - **When** they access system
   - **Then** they see only features for their role

3. **AC3:** CEO/COO has full access
   - **Given** user is CEO or COO
   - **When** they access any feature
   - **Then** they have full read/write access

4. **AC4:** Komisaris has view-only access
   - **Given** user is Komisaris
   - **When** they access features
   - **Then** they can view but not modify

5. **AC5:** Panitia has Event CDE access only
   - **Given** user is Panitia
   - **When** they access system
   - **Then** they only see Event CDE module

## Tasks / Subtasks

- [x] Task 1: Define role permissions (AC: 1, 2)
  - [x] 1.1 Create `src/lib/auth/permissions.ts`
  - [x] 1.2 Define feature access per role

- [x] Task 2: Create RBAC components (AC: 2, 3, 4, 5)
  - [x] 2.1 Create `src/components/auth/role-gate.tsx`
  - [x] 2.2 Create `src/hooks/use-permissions.ts`

- [x] Task 3: Update middleware for role-based routes (AC: 2)
  - [x] 3.1 Middleware uses JWT validation (Story 1.3)
  - [x] 3.2 Routes protected by feature permissions

- [x] Task 4: Update dashboard with role-based UI (AC: 2, 3, 4, 5)
  - [x] 4.1 RoleGate components hide/show features
  - [x] 4.2 Role badge displayed in header

- [x] Task 5: Verify RBAC (AC: 1-5)
  - [x] 5.1 Build verification passed
  - [x] 5.2 All 5 roles defined correctly

## Dev Notes

### Architecture Reference
- RBAC: Zustand + middleware
- 5 Roles: CEO, COO, Komisaris, Panitia, Freelancer

### Role Permissions Matrix
| Feature | CEO | COO | Komisaris | Panitia | Freelancer |
|---------|-----|-----|-----------|---------|------------|
| Dashboard Overview | ✓ | ✓ | ✓ (view) | ✗ | ✗ |
| Event CDE | ✓ | ✓ | ✓ (view) | ✓ | ✗ |
| Media Management | ✓ | ✓ | ✓ (view) | ✗ | ✗ |
| Drive Access | ✓ | ✓ | ✓ (view) | ✗ | Limited |
| User Management | ✓ | ✓ | ✗ | ✗ | ✗ |
| AI Features | ✓ | ✓ | ✗ | ✗ | ✗ |

### References
- [Source: architecture.md#Authentication & Security]
- [Source: epics.md#Story 1.4]

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro

### Debug Log References
(To be filled during implementation)

### Completion Notes List
(To be filled during implementation)

### File List

**Created:**
- `src/lib/auth/permissions.ts` - Role definitions & permission functions
- `src/components/auth/role-gate.tsx` - Conditional rendering by role
- `src/hooks/use-permissions.ts` - Permission checking hook

**Modified:**
- `src/app/(workspace)/dashboard/page.tsx` - Role-based feature cards

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-09 | Story created | Gemini 2.5 Pro |
