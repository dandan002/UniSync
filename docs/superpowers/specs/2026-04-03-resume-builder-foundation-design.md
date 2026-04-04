# Resume Builder Foundation — Design Spec

**Date:** 2026-04-03
**Status:** Draft
**Phase:** 4 (first deliverable)

---

## Overview

Add the first real resume-builder slice on top of the existing onboarding and profile foundation. This phase replaces the static resumes dashboard with Supabase-backed resume CRUD and introduces a minimal builder page where users can name a resume, choose a template, and control which profile sections are included.

This phase does not generate PDFs yet. It establishes the persistence model and editing flow the later LaTeX preview and export pipeline will build on.

---

## Goals

- Replace static mock resume UI with real user-scoped resume records
- Let users create a resume from their saved profile in one click
- Provide a first editable builder page at `/dashboard/resume/[id]`
- Persist template selection and section configuration for each resume
- Keep the implementation thin and compatible with later PDF generation work

---

## Non-Goals

- PDF preview or download
- LaTeX compilation
- Resume version history
- Sharing and public links
- AI tailoring or job-description matching
- Per-bullet or per-entry resume-specific content overrides

---

## Existing Context

The current codebase already has:

- Clerk authentication and onboarding routing
- Supabase-backed user/profile persistence
- Resume import during onboarding
- A real profile editor at `/dashboard/profile`

The current resume surfaces are incomplete:

- `/dashboard/resumes` is a static mock page with hard-coded cards and placeholder analytics
- `/dashboard/resume/[id]` exists as a route but is not yet wired into a real builder flow
- `CLAUDE.md` still understates completed work and overstates unfinished onboarding/import scope

This phase should build on the existing server-action pattern already used for profile data.

---

## Data Model

### `resumes` table changes

The existing `resumes` table is expanded to support builder configuration.

Add columns:

| column | type | notes |
|---|---|---|
| `template_id` | text | selected template identifier |
| `sections_config` | jsonb | included sections + order |

Updated table shape:

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | owner |
| `name` | text | editable by user |
| `template_id` | text | defaults to `modern-minimalist` |
| `sections_config` | jsonb | defaults to generated config |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `sections_config` shape

`sections_config` stores configuration, not copied profile content.

```json
[
  { "id": "summary", "label": "Summary", "enabled": true, "order": 0 },
  { "id": "experience", "label": "Experience", "enabled": true, "order": 1 },
  { "id": "education", "label": "Education", "enabled": true, "order": 2 },
  { "id": "skills", "label": "Skills", "enabled": true, "order": 3 },
  { "id": "interests", "label": "Interests", "enabled": false, "order": 4 },
  { "id": "miscellaneous", "label": "Additional", "enabled": false, "order": 5 }
]
```

Rules:

- `id` is a stable internal key
- `label` is display text persisted for now to keep rendering simple
- `enabled` controls whether the section appears in the resume
- `order` controls display order in the builder summary and later export pipeline

This phase intentionally does not support nested item selection inside a section.

---

## Templates

Templates remain application metadata in this phase, not database records.

Define a small in-code catalog shared by the resume list and builder:

- `modern-minimalist`
- `executive-classic`
- `academic-cv`

Each template includes:

- `id`
- `name`
- `category`
- `description`

Preview images can remain optional or use the current gallery image URLs if needed for continuity, but the builder must not depend on remote images to function.

---

## Server Actions

Create a dedicated resume action module parallel to the existing profile actions.

### `listResumes()`

- Auth required
- Resolves current Clerk user to `users.id`
- Returns all resumes owned by the user ordered by `updated_at desc`

### `createResume()`

- Auth required
- Requires that a `users` row exists
- Reads the user profile via existing profile data access
- Builds a default `sections_config` from available profile content
- Inserts a new resume with:
  - default name such as `Resume Apr 3`
  - default `template_id = "modern-minimalist"`
  - generated `sections_config`
- Revalidates `/dashboard/resumes`
- Returns the created resume id for redirect

### `getResume(id)`

- Auth required
- Returns the requested resume only if it belongs to the current user
- Throws a not-found style error if absent or unauthorized

### `updateResume(id, data)`

- Auth required
- Updates `name`, `template_id`, and `sections_config`
- Revalidates both `/dashboard/resumes` and `/dashboard/resume/[id]`

---

## Default Section Generation

When a new resume is created, default enabled state should reflect whether the user actually has data for that section.

Rules:

- `summary` enabled when `summary` is non-empty
- `experience` enabled when at least one experience exists
- `education` enabled when at least one education entry exists
- `skills` enabled when skills exist
- `interests` enabled when interests exist
- `miscellaneous` enabled when miscellaneous entries exist

If the profile is mostly empty, all sections still appear in config, but empty sections start disabled.

This keeps configuration predictable while avoiding blank sections by default.

---

## Routing & UI

### `/dashboard/resumes`

Replace the static mock gallery with a real list page.

Behavior:

- Load user resumes from Supabase
- Show a practical page header with a create button
- If no resumes exist, show an empty state with:
  - short explanation
  - primary CTA: create first resume
  - secondary link to `/dashboard/profile` if the profile is sparse
- If resumes exist, render real cards with:
  - resume name
  - template name
  - enabled section count
  - last updated timestamp
  - link to edit the resume

This page should reuse the established dashboard shell styling rather than the current standalone landing-style mock design.

### `/dashboard/resume/[id]`

Implement the first builder page.

Sections:

1. Resume header
- editable resume name
- save button

2. Template picker
- small set of cards or radio-style options from the in-code catalog
- current selection clearly indicated

3. Section configuration
- ordered list of sections
- each row shows section label and enabled toggle
- order controls: move up / move down buttons

4. Live summary panel
- template selected
- count of enabled sections
- guidance note that PDF preview/export arrives in a later phase

This page is configuration-only. It does not attempt live document rendering yet.

---

## Validation

Add a Zod schema for resume builder updates.

Requirements:

- `name` must be non-empty after trim
- `template_id` must be one of the supported template ids
- `sections_config` must be an array of known section ids
- `order` values must be integers
- duplicates by section id are rejected

Invalid server action input should fail with a user-safe error message.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| User has no `users` row | show action error; onboarding/profile sync issue |
| Resume id missing or belongs to another user | return not found |
| Invalid update payload | reject save and show inline error |
| Supabase write failure | show inline save error |
| User has empty profile and creates resume | resume still created, most sections disabled by default |

No optimistic UI is required in this phase.

---

## Testing

Add focused tests around the new pure logic and validation:

- resume update schema accepts valid config
- schema rejects duplicate section ids
- default section generation enables only sections with actual profile data
- section reorder helper preserves stable ids and updates order values correctly

For application verification:

- `npm test`
- `npm run lint`
- manual sanity check of:
  - creating a resume
  - editing name/template/sections
  - returning to list page and seeing persisted updates

---

## CLAUDE.md Updates

Update `CLAUDE.md` to reflect actual project progress:

- mark onboarding/profile foundation as implemented
- mark resume upload/import slice as implemented
- clarify that LinkedIn and GitHub import remain unbuilt
- note that resume builder foundation is now the active next phase

The file should stop describing already-finished work as future work.

---

## Acceptance Criteria

- [ ] `/dashboard/resumes` shows real user-scoped data from Supabase
- [ ] empty accounts can create their first resume
- [ ] creating a resume redirects to `/dashboard/resume/[id]`
- [ ] `/dashboard/resume/[id]` loads only resumes owned by the current user
- [ ] user can rename a resume and save
- [ ] user can change template and save
- [ ] user can toggle sections on/off and reorder them
- [ ] saved changes appear when returning to the resumes list
- [ ] `CLAUDE.md` reflects current implemented progress

---

## Future Follow-Up

This design deliberately sets up the next phase without implementing it:

- builder preview pane
- LaTeX template rendering
- PDF generation jobs
- resume-specific content overrides

Those should build on the persisted `template_id` and `sections_config` introduced here.
