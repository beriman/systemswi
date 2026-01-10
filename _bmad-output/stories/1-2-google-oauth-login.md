# Story 1.2: Google OAuth Login

Status: done

## Story

As a **user**,
I want **to login using my Google account**,
so that **I can access the system securely**.

## Acceptance Criteria

1. **AC1:** Login page exists with Google OAuth button
   - **Given** I am on the login page
   - **When** I view the page
   - **Then** I see a "Login with Google" button

2. **AC2:** OAuth redirect works
   - **Given** I am on login page
   - **When** I click "Login with Google"
   - **Then** I am redirected to Google consent screen

3. **AC3:** OAuth callback creates session
   - **Given** I completed Google consent
   - **When** callback is processed
   - **Then** JWT session cookie is set and I'm redirected to dashboard

## Tasks / Subtasks

- [x] Task 1: Create auth utilities (AC: 2, 3)
  - [x] 1.1 Create `src/lib/auth/types.ts`
  - [x] 1.2 Create `src/lib/auth/index.ts` (OAuth config, JWT)
  
- [x] Task 2: Create API routes (AC: 2, 3)
  - [x] 2.1 Create `/api/auth/google` route
  - [x] 2.2 Create `/api/auth/callback/google` route
  - [x] 2.3 Create `/api/auth/me` route
  - [x] 2.4 Create `/api/auth/logout` route

- [x] Task 3: Create login page (AC: 1)
  - [x] 3.1 Create `src/app/(public)/login/page.tsx`
  - [x] 3.2 Style with shadcn/ui components

- [x] Task 4: Create auth state (AC: 3)
  - [x] 4.1 Create `src/stores/auth-store.ts`
  - [x] 4.2 Create `src/hooks/use-auth.ts`

- [x] Task 5: Verify setup (AC: 1, 2, 3)
  - [x] 5.1 Build verification passed
  - [x] 5.2 All routes compiled

## Dev Notes

### Architecture Reference
- Auth Provider: Google OAuth (native)
- Session: JWT (cookies)
- State: Zustand
- API Security: Route handler guards

### Environment Variables Required
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### References
- [Source: architecture.md#Authentication & Security]

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro

### Debug Log References
(To be filled during implementation)

### Completion Notes List
- 2026-01-09: Implementation complete
- 2026-01-09: Code review fixes: dashboard page, CSRF state, JWT picture, cleanup

### File List

**Created:**
- `src/lib/auth/types.ts` - User, Session, Auth types
- `src/lib/auth/index.ts` - OAuth utilities, JWT functions
- `src/app/api/auth/google/route.ts` - OAuth redirect
- `src/app/api/auth/callback/google/route.ts` - OAuth callback
- `src/app/api/auth/me/route.ts` - Get current user
- `src/app/api/auth/logout/route.ts` - Logout
- `src/app/(public)/login/page.tsx` - Login page
- `src/stores/auth-store.ts` - Zustand auth store
- `src/hooks/use-auth.ts` - useAuth hook

**Dependencies Added:**
- jose (JWT library)
- zustand (state management)

**Code Review Fixes:**
- `src/app/(workspace)/dashboard/page.tsx` - Placeholder dashboard

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-09 | Story created | Gemini 2.5 Pro |
