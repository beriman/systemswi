# Story 3.1: Drive File Browser

Status: in-progress

## Story

As a **CEO/COO**,
I want **to browse Google Drive files**,
so that **I can access company documents**.

## Acceptance Criteria

1. **AC1:** File list displayed
   - **Given** I am logged in
   - **When** I navigate to Drive
   - **Then** I see folder/file list

2. **AC2:** Navigation works
   - **Given** I see folders
   - **When** I click a folder
   - **Then** I see its contents

## Tasks / Subtasks

- [ ] Task 1: Create Drive types and mock data
  - [ ] 1.1 Create `src/lib/drive/types.ts`
  - [ ] 1.2 Create `src/lib/drive/mock-data.ts`

- [ ] Task 2: Create Drive UI components
  - [ ] 2.1 Create `src/components/drive/file-browser.tsx`
  - [ ] 2.2 Create `src/components/drive/file-item.tsx`

- [ ] Task 3: Create Drive page
  - [ ] 3.1 Create `src/app/(workspace)/drive/page.tsx`
  - [ ] 3.2 Verify build

## Dev Notes

MVP uses mock data, will connect to Google Drive API later.

## File List
(To be filled)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-10 | Story created | Gemini 2.5 Pro |
