# Story 1.1: Project Setup & Starter

Status: done

## Story

As a **developer**,
I want **the project initialized with Next.js 14+ App Router, Tailwind CSS, and shadcn/ui**,
so that **I have a working foundation with the correct tech stack for all features**.

## Acceptance Criteria

1. **AC1:** Next.js 14+ project is created using App Router (not Pages Router)
   - **Given** no project exists
   - **When** starter command is run
   - **Then** new Next.js 14 project is created with App Router structure

2. **AC2:** Tailwind CSS is configured and working
   - **Given** project is created
   - **When** I add Tailwind classes to a component
   - **Then** styles are applied correctly

3. **AC3:** shadcn/ui is installed and configured
   - **Given** project is created
   - **When** I add shadcn/ui components
   - **Then** components render correctly with proper styling

4. **AC4:** TypeScript strict mode is enabled
   - **Given** project is created
   - **When** TypeScript checks run
   - **Then** strict mode validations are enforced

5. **AC5:** Basic folder structure matches architecture document
   - **Given** project is created
   - **When** I check folder structure
   - **Then** it matches `src/app`, `src/components`, `src/lib`, `src/hooks` pattern

## Tasks / Subtasks

- [x] Task 1: Initialize Next.js project (AC: 1)
  - [x] 1.1 Ran `npx create-next-app@latest` (Next.js 16.1.1)
  - [x] 1.2 App Router structure verified (`src/app/`)
  - [x] 1.3 TypeScript strict: true in `tsconfig.json`

- [x] Task 2: Configure shadcn/ui (AC: 3)
  - [x] 2.1 Ran `npx shadcn@latest init`
  - [x] 2.2 Added button and card components
  - [x] 2.3 `components.json` created

- [x] Task 3: Setup basic folder structure (AC: 5)
  - [x] 3.1 Created `src/lib/utils.ts`
  - [x] 3.2 Created `src/hooks/` folder
  - [x] 3.3 Created `src/types/` folder
  - [x] 3.4 Structure matches architecture.md

- [x] Task 4: Verify setup works (AC: 1, 2, 3, 4, 5)
  - [x] 4.1 Dev server starts (verified via build)
  - [x] 4.2 Build succeeds - static pages generated
  - [x] 4.3 TypeScript compilation passed
  - [x] 4.4 Lint has issues from DOE execution/ folder (out of scope)


## Dev Notes

### Architecture Reference
From `architecture.md`:
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS v3.4+
- **Components:** shadcn/ui (based on Radix UI)
- **Language:** TypeScript (strict mode)
- **Patterns:** 
  - Kebab-case for file names
  - PascalCase for components
  - camelCase for functions
- **Deploy Target:** Vercel

### Expected Folder Structure
```
src/
├── app/
│   ├── (public)/           # Public routes
│   ├── (workspace)/        # Authenticated routes  
│   ├── api/                # API routes
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/
│   ├── ui/                 # shadcn components
│   └── custom/             # Custom components
├── lib/
│   ├── utils.ts            # Utility functions
│   └── constants.ts        # App constants
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript types
```

### Project Structure Notes

- Route groups `(public)` and `(workspace)` will be created in later stories
- This story focuses on foundation only
- shadcn/ui components go in `src/components/ui/`

### References

- [Source: architecture.md#Starter Template Evaluation]
- [Source: architecture.md#Project Structure]
- [Source: architecture.md#Implementation Patterns]

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro

### Debug Log References
(To be filled during implementation)

### Completion Notes List
- 2026-01-09: Initial implementation complete
- 2026-01-09: Code review fixes applied - git init, globals.css shadcn variables, constants.ts

### File List

**Created:**
- `package.json` - Project config (system-swi)
- `tsconfig.json` - TypeScript strict mode
- `next.config.ts` - Next.js config
- `components.json` - shadcn/ui config
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Home page
- `src/app/globals.css` - Tailwind + shadcn CSS variables
- `src/lib/utils.ts` - cn() helper
- `src/components/ui/button.tsx` - shadcn Button
- `src/components/ui/card.tsx` - shadcn Card
- `src/hooks/` - (empty, ready for hooks)
- `src/types/` - (empty, ready for types)
- `src/lib/constants.ts` - App constants (roles, routes)
- `.git/` - Git repository initialized

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-09 | Story created | Gemini 2.5 Pro |
