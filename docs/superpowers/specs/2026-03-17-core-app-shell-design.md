# UniSync — Core App Shell & Resume Import
**Date:** 2026-03-17
**Scope:** Phase 1 completion + Phase 2 (resume upload only)
**Approach:** Option A — thin slice, no AWS

---

## Goal

Get a working end-to-end loop: user signs up → onboarding wizard → uploads resume or enters manually → profile stored in Supabase → lands on editable dashboard. No AWS infrastructure yet; all processing goes through Next.js API routes + OpenRouter.

---

## Data Model (Supabase)

### `users`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| clerk_id | text unique | from Clerk |
| email | text | |
| name | text | |
| avatar_url | text | |
| onboarding_completed | boolean | default false |
| created_at | timestamptz | |

### `profiles`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | unique |
| headline | text | |
| summary | text | |
| location | text | |
| skills | text[] | |
| interests | text[] | |
| miscellaneous | text[] | certifications, publications, languages, etc. |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `experiences`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid FK → profiles | |
| company | text | |
| title | text | |
| start_date | date | |
| end_date | date | nullable (null = current) |
| is_current | boolean | |
| bullets | text[] | achievement/responsibility lines |
| sort_order | int | for drag reorder later |
| created_at | timestamptz | |

### `education`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid FK → profiles | |
| school | text | |
| degree | text | |
| field | text | |
| start_date | date | |
| end_date | date | nullable |
| sort_order | int | |
| created_at | timestamptz | |

### `resumes`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| name | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

> **Note:** The `resumes` table is created now for forward compatibility but is not written to in this phase. The Resumes dashboard view is a shell only.

**Supabase access model:** All Supabase calls are made server-side only (Server Actions and Route Handlers) using the `service_role` key. The server reads the authenticated user's Clerk `userId` via `auth()` and manually scopes all queries to that user. RLS policies are enabled as a defense-in-depth layer but the primary access guard is server-side filtering. No Supabase client is ever instantiated on the client.

---

## Routing & Auth

| Route | Auth | Condition |
|---|---|---|
| `/` | public | landing page |
| `/sign-in`, `/sign-up` | public | Clerk pages |
| `/onboarding` | auth required | redirect to `/sign-in` if not authed |
| `/dashboard/*` | auth required | redirect to `/onboarding` if `onboarding_completed = false` |

Clerk middleware (`middleware.ts`) handles authentication redirects. The onboarding check (is `onboarding_completed` true?) is **not** done in middleware — middleware runs on the Edge runtime and cannot query Supabase. Instead, `onboarding_completed` is stored in Clerk's `publicMetadata` on the user object, so middleware can read it without a DB call via `auth().sessionClaims`. The `/dashboard` layout server component also re-checks this as a secondary guard.

**Clerk redirect config:**
- `afterSignUpUrl` → `/dashboard` (middleware intercepts and redirects to `/onboarding` if `publicMetadata.onboarding_completed` is falsy)
- `afterSignInUrl` → `/dashboard`

**User sync:** `syncUser()` is a server action called at the top of the `/onboarding` page server component. It upserts the Supabase `users` row using the Clerk `userId`, email, name, and avatar from `currentUser()`. This is the first authenticated destination after sign-up, so it is always called before any profile work begins.

When onboarding completes (Step 3), both the Supabase `users.onboarding_completed` column and Clerk's `publicMetadata.onboarding_completed` are set to `true`. Clerk's value drives the middleware redirect; Supabase's value is the authoritative record.

---

## Onboarding Flow (`/onboarding`)

Step state is managed via URL search params (`?step=1`, `?step=2`, `?step=3`). This survives page refresh and browser back/forward navigation.

### Step 1 — Choose path (`?step=1`)
Two options presented as large cards:
- **Upload your resume** (PDF or DOCX)
- **Start from scratch**

### Step 2 — Edit your profile (`?step=2`)
Both paths land on the same profile editor form. Upload triggers client-side text extraction → API parse → form pre-fill. Manual entry starts blank.

**Form sections:**
1. **Basic info** — name, headline, location, summary
2. **Experience** — repeating blocks (company, title, start/end dates, is_current toggle, bullets as line-separated textarea). "Add experience" appends a new block.
3. **Education** — repeating blocks (school, degree, field, start/end dates). "Add education" appends a new block.
4. **Skills** — tag-style free-form input
5. **Interests** — tag-style free-form input
6. **Miscellaneous** — tag-style input for items that don't fit other sections (certifications, languages, publications, etc.)

**Save:** Explicit save button. No auto-save in this phase. On save, all profile data is written to Supabase via a Server Action, then navigation advances to `?step=3`.

### Step 3 — Done (`?step=3`)
- "Your profile is ready" confirmation screen
- Sets `onboarding_completed = true` on the `users` row
- CTA button navigates to `/dashboard/profile`

---

## Resume Parsing

### Client-side text extraction
- **PDF:** `pdfjs-dist` — extracts plain text in the browser. The PDF.js worker must be loaded from a CDN; the CDN URL version must exactly match the installed `pdfjs-dist` package version (e.g., if `pdfjs-dist@4.10.38` is installed, use `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.mjs`). A version mismatch will cause silent failures at runtime. Configure via `GlobalWorkerOptions.workerSrc` before calling `getDocument()`.
- **DOCX:** `mammoth` — converts to plain text in the browser.

No files are uploaded to the server. Only extracted plain text is sent to the API route.

### API route: `POST /api/parse-resume`
- Receives `{ text: string }` in the request body
- Calls OpenRouter with a structured prompt requesting JSON output
- Prompt instructs the LLM to extract: name, headline, location, summary, experiences (with bullets), education, skills, interests, miscellaneous
- Response is validated with a Zod schema before being returned to the client. Fields that fail validation are omitted rather than causing an error.
- Returns validated JSON → client pre-fills the Step 2 form

**Error handling:** Partial or failed parses pre-fill whatever was successfully extracted. The form remains fully editable. Parsed data is never written directly to Supabase — the user always confirms via the save button first.

---

## Dashboard

Protected via Clerk middleware. Users with `onboarding_completed = false` redirect to `/onboarding`.

**Layout:** Sidebar on desktop with nav items (Profile, Resumes) and `<UserButton>` at the bottom for account management and sign-out. Mobile layout is deferred to Phase 5; desktop-only for this phase is acceptable.

### Profile view (`/dashboard/profile`)
- The same profile editor form as onboarding Step 2, always editable
- Profile completeness indicator (e.g. "5 of 8 sections filled") to encourage completion
- Explicit save button. Saves via Server Action.

### Resumes view (`/dashboard/resumes`)
- Lists saved resumes (name, last updated) — no records written this phase
- Empty state with "Create resume" placeholder (builder not yet implemented)
- Shell only

---

## Environment Variables

All must be present in `.env.local`:

| variable | purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk server-side key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; used for all DB calls. **Not** the anon key. |
| `OPENROUTER_API_KEY` | LLM API access for resume parsing |

> The Clerk and Supabase URL/anon keys are already in `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` and `OPENROUTER_API_KEY` need to be added.

---

## Notes on Intentional Schema Simplifications

The roadmap (`CLAUDE.md`) includes `template_id` and `sections_config` on `resumes`. These are intentionally omitted from this phase's schema — the resume builder is out of scope. They will be added in a future migration when the builder is implemented.

`CLAUDE.md` also references Auth0 throughout; the project has already migrated to Clerk (commit `805f49d`). `CLAUDE.md` should be updated to reflect this.

---

## Out of Scope (this phase)

- LinkedIn / GitHub import
- AWS Lambda, S3, SQS
- AI bullet rewriting / job description matching
- LaTeX PDF generation
- Resume builder (template selection, section config)
- Version history
- Mobile-specific layout optimizations
