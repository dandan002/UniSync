# UniSync

Resume builder that imports from LinkedIn, GitHub, and existing resumes — refines with AI — exports pixel-perfect LaTeX PDFs.

## Tech Stack

### Frontend (Deployed on Vercel)
- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: React 19 + shadcn/ui (Radix primitives) + Tailwind CSS 4
- **Fonts**: DM Serif Display (display) + Instrument Sans (body)
- **Theme**: Dark-first, amber accent (`oklch(0.82 0.14 75)`)

### Auth
- **Auth0** — social logins (Google, GitHub, LinkedIn), JWT-based sessions
- Auth0 tenant: `dev-leqagu36u50tw77h.us.auth0.com`

### Database
- **Supabase** (Postgres) — user profiles, resume data, template metadata
- Row-level security for multi-tenant isolation

### Backend (AWS)
- **AWS Lambda + API Gateway** — serverless API for resume processing
- **AWS S3** — file storage (uploaded resumes, generated PDFs, profile images)
- **AWS SQS** — job queue for async processing (PDF generation, data imports)

### AI
- **OpenRouter API** — LLM calls for resume bullet rewriting, profile extraction, job description matching

### PDF Generation
- **LaTeX** — server-side compilation (Lambda or containerized) for typographically precise output

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Landing page (done)
│   ├── layout.tsx        # Root layout (done)
│   ├── globals.css       # Theme + animations (done)
│   ├── (auth)/           # Auth0 login/callback routes
│   ├── dashboard/        # Main app after login
│   └── api/              # Next.js API routes (BFF)
├── components/
│   ├── ui/               # shadcn components
│   └── ...               # App-specific components
└── lib/
    └── utils.ts          # shadcn utilities
```

---

## Next Steps

### Phase 1: Auth & Core Layout
- [ ] Install and configure `@auth0/nextjs-auth0`
- [ ] Set up Auth0 routes: `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout`
- [ ] Create protected layout for `/dashboard` with sidebar navigation
- [ ] Build user onboarding flow (name, email, basic info)
- [ ] Add Supabase client (`@supabase/supabase-js`) + create initial schema:
  - `users` (id, auth0_id, email, name, created_at)
  - `profiles` (id, user_id, headline, summary, skills[], location)
  - `experiences` (id, profile_id, company, title, start_date, end_date, bullets[])
  - `education` (id, profile_id, school, degree, field, start_date, end_date)
  - `resumes` (id, user_id, name, template_id, sections_config, created_at, updated_at)
  - `generated_pdfs` (id, resume_id, s3_key, created_at)

### Phase 2: Data Import Pipeline
- [ ] LinkedIn import: OAuth flow → profile data extraction via API/scraping
- [ ] GitHub import: OAuth flow → fetch repos, contributions, README data
- [ ] Resume upload: PDF/DOCX upload to S3 → SQS trigger → Lambda parses via LLM
- [ ] Unified profile merge: reconcile data from multiple sources into one profile
- [ ] Build AWS infrastructure (Lambda functions, S3 buckets, SQS queues, API Gateway)

### Phase 3: Profile Editor
- [ ] WYSIWYG profile editor with sections: summary, experience, education, skills, projects
- [ ] Inline AI rewrite: select text → rewrite with LLM (OpenRouter)
- [ ] Bullet point optimizer: quantify achievements, action verbs, conciseness scoring
- [ ] Job description matcher: paste a JD → AI suggests tailored edits
- [ ] Drag-and-drop section reordering

### Phase 4: Resume Builder & Templates
- [ ] LaTeX template system: define templates as `.tex` files with variable slots
- [ ] Template gallery with live previews
- [ ] Resume builder: pick template → select which profile sections to include → configure order
- [ ] Real-time PDF preview (compile LaTeX on server, stream result)
- [ ] PDF generation pipeline: SQS → Lambda (runs `pdflatex`) → S3 → signed URL download

### Phase 5: Polish & Launch
- [ ] Version history for resumes
- [ ] Export in multiple formats (PDF, DOCX, plain text)
- [ ] Resume analytics (keyword density, ATS compatibility score)
- [ ] Sharing: public resume links
- [ ] Billing integration (if needed)
- [ ] Performance optimization, error handling, loading states
- [ ] Mobile responsiveness for editor

---

## Dev Commands

```bash
npm run dev     # Start dev server on :3000
npm run build   # Production build
npm run lint    # ESLint
```

## Environment Variables

See `.env.local` for Auth0 credentials. Additional variables needed:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Supabase project
- `OPENROUTER_API_KEY` — LLM API access
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — AWS services
- `AWS_S3_BUCKET` — resume file storage
- `AWS_SQS_QUEUE_URL` — processing queue
