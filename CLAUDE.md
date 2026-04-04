# UniSync

Resume builder that imports from existing resumes today, with LinkedIn and GitHub import planned next, then AI refinement and LaTeX PDF export.

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: React 19 + Tailwind CSS 4 + selected shadcn/ui primitives
- **Auth UI**: Clerk sign-in and sign-up routes

### Auth
- **Clerk** (`@clerk/nextjs` v7)
- Sign-in: `/sign-in`
- Sign-up: `/sign-up`
- `onboarding_completed` is stored in both Supabase `users` and Clerk `publicMetadata`

### Database
- **Supabase** (Postgres)
- Server-only Supabase access through the service-role key
- Current tables in repo schema:
  - `users`
  - `profiles`
  - `experiences`
  - `education`
  - `resumes`

### AI
- **OpenRouter API**
- Currently used for resume parsing during onboarding import

### Planned Infrastructure
- AWS Lambda / API Gateway / S3 / SQS for later processing and PDF generation phases

---

## Current Project Structure

```text
src/
├── app/
│   ├── page.tsx                     # landing page
│   ├── onboarding/                 # onboarding flow
│   ├── dashboard/
│   │   ├── profile/                # live profile editor
│   │   ├── resumes/                # resume list
│   │   └── resume/[id]/            # resume builder detail page
│   └── api/parse-resume/           # OpenRouter parsing endpoint
├── components/
│   ├── onboarding/                 # import/review onboarding components
│   ├── profile/                    # profile form/editor components
│   └── resume/                     # resume builder components
├── lib/
│   ├── actions/                    # server actions
│   ├── schemas.ts                  # zod validation
│   ├── resume.ts                   # resume config helpers/template catalog
│   └── supabase.ts                 # server-only Supabase client
└── __tests__/                      # vitest coverage for pure logic
```

---

## Implemented Progress

### Phase 1: Auth, Onboarding, and Core Profile
- [x] Clerk authentication is configured
- [x] Middleware/dashboard gating uses Clerk auth plus onboarding metadata
- [x] Supabase server client and base schema are in place
- [x] User sync and onboarding completion actions are implemented
- [x] Profile editor persists:
  - basic info
  - experience
  - education
  - skills
  - interests
  - miscellaneous
- [x] Dashboard profile page loads and saves real profile data

### Phase 2: Resume Import Pipeline
- [x] Resume upload path exists in onboarding
- [x] PDF, DOCX, and TXT extraction are supported
- [x] `/api/parse-resume` validates parsed AI output with Zod
- [x] Parsed resumes can be:
  - imported directly into the profile
  - sent to the profile form for manual review first
- [ ] LinkedIn import is not built yet
- [ ] GitHub import is not built yet
- [ ] Unified multi-source merge is not built yet
- [ ] AWS-backed async import infrastructure is not built yet

### Phase 3: Profile Editor Enhancements
- [x] Core profile editor is implemented
- [ ] AI rewrite tools are not built yet
- [ ] JD matching is not built yet
- [ ] Drag-and-drop reordering is not built yet
- [ ] Mobile-specific editor optimization is not built yet

### Phase 4: Resume Builder Foundation
- [x] Resume list page is backed by Supabase instead of static mock data
- [x] Resume creation is implemented
- [x] Resume records now store:
  - `name`
  - `template_id`
  - `sections_config`
- [x] `/dashboard/resume/[id]` is now a real builder page
- [x] Builder currently supports:
  - renaming a resume
  - selecting a template
  - enabling/disabling sections
  - reordering sections
- [x] Template-aware preview rendering is implemented
- [ ] LaTeX output and PDF preview are not built yet
- [ ] Resume-specific content overrides are not built yet

---

## Active Next Phase

The next logical slice after the current builder foundation is:

1. Introduce LaTeX template output contracts
2. Build PDF generation/export
3. Add resume-specific content overrides

LinkedIn and GitHub import remain separate unfinished Phase 2 tracks.

---

## Dev Commands

```bash
npm run dev
npm run build
npm run lint
npm test
```

## Environment Variables

Required now:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`

Needed later for AWS-backed phases:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_SQS_QUEUE_URL`
