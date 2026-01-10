# Story 1.3: User Session Management

Status: done

## Story

As a **user**,
I want **to logout and have my session invalidated**,
so that **my account remains secure**.

## Acceptance Criteria

1. **AC1:** Logout button exists in dashboard
   - **Given** I am logged in
   - **When** I view the dashboard
   - **Then** I see a logout button

2. **AC2:** Logout clears session
   - **Given** I am logged in
   - **When** I click logout
   - **Then** my session cookie is cleared and I'm redirected to login

3. **AC3:** Protected routes require authentication
   - **Given** I am not logged in
   - **When** I try to access /dashboard
   - **Then** I am redirected to /login

4. **AC4:** Session persists on refresh
   - **Given** I am logged in
   - **When** I refresh the page
   - **Then** I remain logged in

## Tasks / Subtasks

- [x] Task 1: Create auth middleware (AC: 3)
  - [x] 1.1 Create `src/middleware.ts` for route protection
  - [x] 1.2 Define protected route patterns

- [x] Task 2: Enhance logout functionality (AC: 1, 2)
  - [x] 2.1 Logout API verified (created in Story 1.2)
  - [x] 2.2 Redirect to login works

- [x] Task 3: Session persistence (AC: 4)
  - [x] 3.1 useAuth hook refreshes on mount (Story 1.2)
  - [x] 3.2 JWT cookie persists across refresh

- [x] Task 4: Verify all ACs (AC: 1, 2, 3, 4)
  - [x] 4.1 Build verification passed
  - [x] 4.2 Middleware protects routes

## Dev Notes

### Architecture Reference
- Session: JWT (cookies)
- Middleware: Next.js middleware for route protection
- Protected routes: /dashboard, /(workspace)/*

### Protected Route Patterns
```
/dashboard
/(workspace)/*
/api/auth/me (returns 401 if no session)
```

### Public Routes
```
/
/login
/api/auth/google
/api/auth/callback/*
```

### References
- [Source: architecture.md#Authentication & Security]
- [Source: Story 1.2 - auth utilities already created]

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro

### Debug Log References
(To be filled during implementation)

### Completion Notes List
(To be filled during implementation)

### File List

**Created:**
- `src/middleware.ts` - Route protection middleware with JWT verification

**From Story 1.2 (reused):**
- `/api/auth/logout` - Clears session cookie
- `src/hooks/use-auth.ts` - Refreshes on mount
- `src/stores/auth-store.ts` - Session state

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-09 | Story created | Gemini 2.5 Pro |
