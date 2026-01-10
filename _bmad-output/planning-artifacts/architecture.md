---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/product-brief-system-SWI-2026-01-08.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
workflowType: 'architecture'
project_name: 'system SWI'
user_name: 'Iman'
date: '2026-01-09'
lastStep: 8
status: complete
completedAt: '2026-01-09T14:45:00+07:00'
---

# Architecture Decision Document - system SWI

**Author:** Iman
**Date:** 2026-01-09

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (74 FRs):**
- Authentication: 7 FRs (Google OAuth, 5 roles)
- Dashboard: 6 FRs (Overview, progress, financial)
- AI Chat: 5+ FRs (Priority, document generation)
- Event CDE: 10+ FRs (Panitia, tracking)
- Media: 5+ FRs (Calendar, Telegram)
- Drive: 5+ FRs (Single source of truth)
- Public Layer: 5+ FRs (Auto-update profile)

**Non-Functional Requirements:**
- Performance: LCP <2.5s, FID <100ms
- Security: RBAC, Google OAuth
- Availability: 99% uptime
- Accessibility: WCAG 2.1 AA
- SEO: SSR, structured data

### Scale & Complexity

| Indicator | Value |
|-----------|-------|
| Primary Domain | Web Application (Full-Stack) |
| Complexity Level | Medium-High |
| Architectural Components | ~8-10 modules |
| Integration Points | 4 (Drive, n8n, OpenRouter, Telegram) |
| User Roles | 5 distinct access levels |

### Technical Constraints & Dependencies

| Constraint | Source |
|------------|--------|
| Google Drive as DB | PRD: Zero-cost stack |
| n8n for automation | PRD: Self-hosted workflow |
| OpenRouter AI | PRD: Cost-efficient AI |
| Telegram Bot | PRD: Human-in-the-loop |
| Next.js preferred | PRD: SSR + SPA hybrid |
| Vercel deployment | UX: shadcn/ui ecosystem |

### Cross-Cutting Concerns

1. **Authentication** — Spans all modules
2. **Role-based Access** — 5 permission levels
3. **AI Integration** — Chat, Doc Gen, Priority
4. **Drive Sync** — Real-time data consistency
5. **Telegram Notifications** — Event-driven
6. **Error Handling** — Self-annealing architecture

---

## Starter Template Evaluation

### Selected Starter: Next.js + shadcn/ui

**Initialization Command:**
```bash
npx create-next-app@latest system-swi \
  --typescript --tailwind --eslint \
  --app --src-dir --import-alias "@/*"

npx shadcn@latest init
npx shadcn@latest add button card dialog toast
```

### Technology Stack Decisions

| Layer | Decision | Rationale |
|-------|----------|----------|
| Framework | Next.js 14+ (App Router) | SSR + SPA hybrid |
| UI | Tailwind CSS + shadcn/ui | Ownable components |
| Language | TypeScript (strict) | Type safety |
| Database | Google Drive API | Zero-cost, PRD |
| Auth | Google OAuth (native) | Single sign-on |
| Automation | n8n (external) | Webhook-based |
| AI | OpenRouter API | Cost-efficient |
| State | Zustand | Simple, performant |
| Deploy | Vercel | shadcn ecosystem |

### Project Structure
```
/src
  /app             # Next.js App Router
  /components      # shadcn/ui + custom
  /lib             # Utilities, API clients
  /hooks           # Custom React hooks
  /types           # TypeScript types
  /styles          # Global CSS
```

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (Block Implementation):**
- Auth: Google OAuth
- Database: Google Drive API
- Framework: Next.js App Router

**Important (Shape Architecture):**
- State: Zustand
- Validation: Zod
- Fetching: SWR

**Deferred (Post-MVP):**
- Advanced monitoring (Sentry)
- Multi-region deployment

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary Storage | Google Drive API | Zero-cost |
| Data Modeling | TypeScript + Zod | Type-safe |
| Folder Pattern | `/SWI-System/[Module]/` | Domain organized |
| Caching | SWR | Stale-while-revalidate |
| File Format | JSON + Markdown | Human-readable |

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth Provider | Google OAuth | Native |
| Session | JWT (cookies) | Stateless |
| RBAC | Zustand + middleware | 5 roles |
| API Security | Route handler guards | Next.js native |

### API & Communication

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API Pattern | Next.js Route Handlers | Co-located |
| Automation | n8n webhooks | Decoupled |
| AI | OpenRouter REST | Direct API |
| Telegram | Bot via n8n | Human-in-loop |
| Error Handling | Boundary + toast | Centralized |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | Vercel | shadcn ecosystem |
| CI/CD | Vercel Git | Auto-deploy |
| Env Config | .env + Vercel | Secure |
| Monitoring | Vercel Analytics | Built-in |

---

## Implementation Patterns & Consistency Rules

### Naming Patterns

| Category | Convention | Example |
|----------|------------|----------|
| Files | kebab-case | `user-profile.tsx` |
| Components | PascalCase | `UserProfile` |
| Functions | camelCase | `getUserData` |
| Hooks | use prefix | `useAuth`, `useIsMobile` |
| Stores | suffix-store | `auth-store.ts` |
| Exports | Barrel | `index.ts` per folder |

### Structure Patterns

**Co-located Components:**
```
/features/auth/
  /components/
    /UserProfile/
      index.tsx
      UserProfile.test.tsx
  index.ts  ← Barrel export
```

**Import Pattern:**
```typescript
import { UserProfile } from '@/features/auth'
```

### Format Patterns

**API Response:**
```typescript
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
  requestId: string  // For tracing
}
```

**Env-Based Config:**
- Use `process.env.NEXT_PUBLIC_*` for client
- Use `process.env.*` for server only

### Responsive Hooks

```typescript
useIsMobile()   // < 768px
useIsTablet()   // 768-1023px
useIsDesktop()  // ≥ 1024px
```

### Error Handling

| Type | Handler |
|------|----------|
| API | Toast notification |
| Form | Inline validation |
| Critical | Error boundary |
| Network | Retry with backoff |

---

## Project Structure & Boundaries

### Complete Directory Structure

```
system-swi/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (public)/          # Public routes (SSR)
│   │   ├── (workspace)/       # Auth routes (CSR)
│   │   └── api/               # Route Handlers
│   ├── features/              # Feature modules
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── chat/
│   │   ├── events/
│   │   └── media/
│   ├── components/ui/         # shadcn/ui
│   ├── lib/                   # Utilities
│   ├── stores/                # Zustand
│   ├── hooks/
│   └── types/
└── public/
```

### Architectural Boundaries

**Route Groups:**
- `(public)` → SSR, no auth, SEO
- `(workspace)` → CSR, auth required

**API Boundaries:**
- `/api/auth/*` → OAuth flow
- `/api/drive/*` → Drive operations
- `/api/chat/*` → OpenRouter proxy
- `/api/webhook/*` → n8n triggers

### Requirements Mapping

| FR Category | Location |
|-------------|----------|
| Auth (FR1-7) | `/features/auth` |
| Dashboard (FR8-13) | `/features/dashboard` |
| AI Chat | `/features/chat` |
| Event CDE | `/features/events` |
| Drive | `/lib/drive.ts` |

### External Integrations

| Service | Integration |
|---------|-------------|
| Google Drive | `/lib/drive.ts` |
| OpenRouter | `/lib/openrouter.ts` |
| n8n | `/api/webhook` |
| Telegram | via n8n |

---

## Architecture Validation Results

### Coherence Validation ✅
- Tech stack compatible
- Patterns aligned with decisions
- Structure supports architecture

### Requirements Coverage ✅
- 74/74 FRs mapped to features
- 5 roles covered by auth pattern
- 4 integrations defined

### Testing Framework (Party Mode)
- Unit: Vitest
- Component: Testing Library
- E2E: Playwright

### Additional Patterns (Party Mode)

| Pattern | Implementation |
|---------|-----------------|
| Rate Limiting | API middleware, 100 req/min |
| Optimistic Updates | SWR mutate |
| Feature Flags | Env-based toggles |
| Accessibility | Focus mgmt, ARIA, keyboard |

### Architecture Status: ✅ READY FOR IMPLEMENTATION

**Confidence:** HIGH

**First Implementation Step:**
```bash
npx create-next-app@latest system-swi \
  --typescript --tailwind --eslint \
  --app --src-dir --import-alias "@/*"
```

---

## Architecture Completion Summary

**Workflow Status:** COMPLETED ✅
**Steps Completed:** 8/8
**Date:** 2026-01-09
**Document:** `architecture.md` (340+ lines)

### Deliverables

| Deliverable | Status |
|-------------|--------|
| Project Context | ✅ |
| Starter Template | ✅ |
| Core Decisions | ✅ |
| Implementation Patterns | ✅ |
| Project Structure | ✅ |
| Validation | ✅ |

### Stats

- **Decisions:** 15+ architectural decisions
- **Patterns:** 10+ implementation patterns
- **Integrations:** 4 external services
- **Features:** 5 feature modules

### Implementation Priority

1. Project initialization (starter template)
2. Auth setup (Google OAuth)
3. Drive integration
4. AI Chat feature
5. Event CDE

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**AI Agent Instruction:** Follow all decisions, patterns, and structure documented herein.
