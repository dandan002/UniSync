# Resume Import Pipeline — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Phase:** 2 (first deliverable)

---

## Overview

Add a resume upload & parse pipeline that lets users import their existing resume during onboarding. The flow extracts text server-side, sends it to the existing OpenRouter parse API, and presents a review card before saving to the user's profile.

---

## Goals

- Let users bootstrap their UniSync profile from an existing PDF/DOCX/TXT resume in under 30 seconds
- Preserve user control — nothing is saved until they explicitly confirm
- Support users who don't have a resume with a "start from scratch" path
- Reuse existing infrastructure (`/api/parse-resume`, `saveProfile` server action)

---

## Entry Point

A new step added to the existing onboarding wizard (`OnboardingClient.tsx`), inserted before profile completion. It becomes **Step 2 of 3** in the onboarding flow:

1. Basic info (existing)
2. **Import your experience** ← new
3. Complete (existing)

Users who click "Start from scratch" skip step 2 entirely and proceed via the existing onboarding completion logic.

---

## User Flow

### Import path
1. User sees a drag-and-drop upload card + "Start from scratch" alternative
2. User drops or selects a file (PDF, DOCX, or TXT, max 5 MB)
3. File is POSTed to `/api/extract-resume` → returns `{ text: string }`
4. Text is POSTed to `/api/parse-resume` → returns `ParsedResume`
5. Review card is shown: name, headline, location, summary excerpt, counts (X experiences, Y education, Z skills)
6. User clicks **"Import to Profile"** → `saveProfile(data)` is called → redirect to `/dashboard/profile`
7. User clicks **"Edit first"** → parsed data stored in `sessionStorage["pendingProfile"]` → redirect to `/dashboard/profile` → profile page picks up sessionStorage data and pre-populates the form without saving
8. User clicks **"← Upload a different file"** → resets to State 1

### Start from scratch path
User clicks "Start from scratch" → existing onboarding completion logic runs → redirect to `/dashboard/profile` with empty form.

---

## New Files

### `src/app/api/extract-resume/route.ts`
- **Method:** POST
- **Auth:** Clerk (`auth()` — returns 401 if not signed in)
- **Input:** `multipart/form-data` with a `file` field
- **Size limit:** 5 MB (return 413 if exceeded)
- **Supported types:**
  - `application/pdf` → `pdf-parse`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` → `mammoth.extractRawText`
  - `text/plain` → UTF-8 decode
  - Other → 415 Unsupported Media Type
- **Output:** `{ text: string }` — capped at 20,000 characters (matches `/api/parse-resume` input limit)
- **Error responses:** 401, 413, 415, 422 (extraction failed), 500

### `src/components/onboarding/ResumeImportStep.tsx`
- Client component (`'use client'`)
- Manages three UI states: `idle` | `processing` | `review`
- Handles file selection (drag-and-drop + click-to-browse)
- Calls `/api/extract-resume` then `/api/parse-resume` in sequence
- Emits `onParsed(data: ParsedResume)` to parent on success
- Inline error display (no modals) — all errors shown inside the upload card

**Processing state** shows three sequential status lines:
- ✓ File uploaded
- ✓ Text extracted
- ⟳ Parsing with AI...

### `src/components/onboarding/ParsedResumeReview.tsx`
- Client component (`'use client'`)
- Props: `data: ParsedResume`, `onReset: () => void`
- Displays: name, headline, location, summary excerpt (truncated to ~120 chars), pill badges for experience/education/skill counts
- **"Import to Profile"** button: calls `saveProfile(data)` server action, redirects to `/dashboard/profile`
- **"Edit first"** button: writes `JSON.stringify(data)` to `sessionStorage["pendingProfile"]`, redirects to `/dashboard/profile`
- **"← Upload a different file"** link: calls `onReset()` to return to State 1
- If parse returned minimal data (no name, no experiences): shows a note — *"We couldn't extract much — you can fill in the rest manually"* — but still allows import

---

## Modified Files

### `src/app/onboarding/OnboardingClient.tsx`
- Add a new step that renders the two-path choice UI
- When "Import" path is chosen: render `ResumeImportStep` → on parsed, render `ParsedResumeReview`
- When "Start from scratch" is chosen: call existing onboarding completion logic

### `src/components/profile/ProfileForm.tsx`
- On mount, check `sessionStorage["pendingProfile"]`
- If present: parse it, merge over the `initialData` prop, clear the key from sessionStorage
- The form displays the merged data but the user must explicitly click "Save changes" — nothing is auto-saved
- `profile/page.tsx` (server component) requires no changes

### `package.json`
- Add `pdf-parse` — PDF text extraction (Node.js)
- Add `mammoth` — DOCX → plain text extraction (Node.js)
- Add `@types/pdf-parse` if needed

---

## Error Handling

| Scenario | User-visible message |
|---|---|
| File > 5 MB | "File too large — max 5 MB" |
| Unsupported file type | "Unsupported file type — try PDF, DOCX, or TXT" |
| Extraction failed (422) | "Couldn't read this file. Try a different format." |
| Parse returned empty | Review card shown with note: "We couldn't extract much — you can fill in the rest manually" |
| Network / server error | "Something went wrong. [Retry]" button |

All errors appear inline inside the upload card. No modal dialogs.

---

## Out of Scope

- S3 file storage (files are processed in memory, not persisted)
- LinkedIn / GitHub import (Phase 2, separate spec)
- Merging parsed data with an existing non-empty profile (not needed — this runs during onboarding before any profile data exists)
- DOCX with complex formatting (mammoth extracts raw text; tables/columns may not extract perfectly — acceptable for MVP)

---

## Dependencies

| Package | Purpose | Size |
|---|---|---|
| `pdf-parse` | PDF text extraction | ~50 KB |
| `mammoth` | DOCX → plain text | ~500 KB |

Both are server-only — no client bundle impact.

---

## Acceptance Criteria

- [ ] User can drop a PDF onto the onboarding upload card and see the review card within ~5 seconds
- [ ] User can drop a DOCX and see the review card
- [ ] User can upload a plain text resume and see the review card
- [ ] "Import to Profile" saves data and lands user on `/dashboard/profile` with profile populated
- [ ] "Edit first" lands user on `/dashboard/profile` with form pre-filled but not yet saved
- [ ] "Start from scratch" completes onboarding and lands on empty `/dashboard/profile`
- [ ] Files over 5 MB show an inline error
- [ ] Unsupported file types show an inline error
- [ ] Unauthenticated requests to `/api/extract-resume` return 401
