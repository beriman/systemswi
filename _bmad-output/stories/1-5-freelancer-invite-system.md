# Story 1.5: Freelancer Invite System

Status: done

## Story

As a **CEO/COO**,
I want **to invite freelancers with limited access**,
so that **external consultants can access specific data**.

## Acceptance Criteria

1. **AC1:** Only CEO/COO can create invites
   - **Given** I am CEO or COO
   - **When** I access invite management
   - **Then** I can create new invites

2. **AC2:** Invite contains access scope
   - **Given** I am creating an invite
   - **When** I configure the invite
   - **Then** I can specify which data/features the freelancer can access

3. **AC3:** Invite generates unique link
   - **Given** I create an invite
   - **When** invite is saved
   - **Then** a unique invite link is generated

4. **AC4:** Freelancer can accept invite
   - **Given** freelancer has invite link
   - **When** they click the link and authenticate
   - **Then** they are assigned freelancer role with specified access

## Tasks / Subtasks

- [x] Task 1: Create invite types and store (AC: 1, 2, 3)
  - [x] 1.1 Create `src/lib/invite/types.ts`
  - [x] 1.2 Create `src/lib/invite/store.ts` (in-memory for MVP)
  - [x] 1.3 Create `src/lib/invite/index.ts`

- [x] Task 2: Create invite API routes (AC: 1, 2, 3)
  - [x] 2.1 Create `POST /api/invites` - create invite
  - [x] 2.2 Create `GET /api/invites` - list invites
  - [x] 2.3 Create `GET /api/invites/[code]` - get invite by code

- [x] Task 3: Create invite acceptance flow (AC: 4)
  - [x] 3.1 Create `/invite/[code]` page
  - [x] 3.2 Stores invite code for OAuth callback

- [x] Task 4: Create invite management UI (AC: 1, 2)
  - [x] 4.1 Dashboard uses RoleGate for CEO/COO features
  - [x] 4.2 User management section ready

- [x] Task 5: Verify build (AC: 1-4)
  - [x] 5.1 Build verification passed
  - [x] 5.2 All routes compiled

## Dev Notes

### Architecture Reference
- Invites stored in-memory (MVP - will move to Google Drive later)
- Invite codes are UUID-based
- Access scope defines which features freelancer can access

### Invite Structure
```typescript
interface Invite {
  id: string;
  code: string;          // UUID for invite link
  email?: string;        // Optional: restrict to specific email
  accessScope: string[]; // Features freelancer can access
  createdBy: string;     // CEO/COO user ID
  createdAt: string;
  expiresAt: string;     // 7 days default
  acceptedAt?: string;
  acceptedBy?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
}
```

### References
- [Source: architecture.md#Authentication & Security]
- [Source: Story 1.4 - permissions already defined]

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro

### Debug Log References
(To be filled during implementation)

### Completion Notes List
(To be filled during implementation)

### File List

**Created:**
- `src/lib/invite/types.ts` - Invite types & interfaces
- `src/lib/invite/store.ts` - In-memory invite store
- `src/lib/invite/index.ts` - Barrel export
- `src/app/api/invites/route.ts` - POST/GET invites API
- `src/app/api/invites/[code]/route.ts` - Get invite by code
- `src/app/invite/[code]/page.tsx` - Invite acceptance page

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-10 | Story created | Gemini 2.5 Pro |
