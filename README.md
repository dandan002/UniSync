# Unisync

Early-career platform for the Philippines: students go from no resume to their first OJT application by chatting with Sync, schools track every CHED internship form, and employers hire school-verified interns.

Built with Next.js 16, Supabase (Postgres, row-level security, Storage), Clerk (passwordless sign-in), Claude Haiku (Sync), Resend (email) and Motion. The original mockups live in `design/`.

## What's in the app

| Area | Routes | What it does |
| --- | --- | --- |
| Public | `/`, `/start`, `/schools`, `/employers` | Landing page with the first question inline; eight-question onboarding with a live resume, saved on the device until the student signs in |
| Sign-in | `/sign-in`, `/welcome` | Email or phone code (Clerk), one-click demo accounts, role-based routing |
| Students | `/home`, `/jobs`, `/resume` | Next interview or offer, applications, updates, CHED forms with uploads, hours log; matched jobs with filters and apply; resume templates, hold to approve, PDF, editor |
| Schools | `/school`, `/school/companies`, `/school/forms`, `/school/people`, `/api/reports/ched` | KPIs, needs attention with one-click fixes, roster with bulk remind and endorse; MOAs; form review; people, roles, company verification, activity; CHED CSV export |
| Employers | `/register`, `/employer`, `/employer/jobs`, `/employer/interns` | Company registration and verification; applicant board with Sync recommendations, interviews, offers and messages (requests for money are blocked); jobs; hours approval and MOA signing |

Sync (`/api/sync`) rewrites Taglish answers into English resume lines with `claude-haiku-5-5` and structured output. Without `ANTHROPIC_API_KEY`, or if the call fails, it falls back to a rule-based rewrite.

Emails (`src/lib/email`) cover resume ready, application sent, new applicant, interview, offer, reminder, invite, company verified, message and MOA. With demo mode on, preview them at `/api/emails/index`.

## Architecture

- **Auth:** Clerk issues session tokens with `role: authenticated` and the verified `email` claim. Supabase trusts Clerk as a third-party auth provider, so every query runs as the signed-in user under row-level security.
- **Profiles:** `public.ensure_profile()` runs on first sign-in. It claims a matching invited or seeded profile by verified email, or creates one. A school email domain links a student to their school.
- **Authorization:** in the database. Students see their own rows, staff see their school, supervisors see their company and its applicants. State changes (approvals, forms, hours, invites, roles, company checks) go through checked `security definer` functions in `supabase/migrations`.
- **Uploads:** CHED form files go to the private `forms` bucket, one folder per student.

## Setup

1. **Supabase.** Apply `supabase/migrations/*.sql` in order, then `supabase/seed.sql` for demo data.
2. **Connect Clerk to Supabase.** In the Supabase dashboard, go to Authentication, Sign In / Providers, Third-Party Auth, and add Clerk with your Clerk domain (for this project, `aware-dragon-9446.clerk.accounts.dev`).
3. **Clerk.** Under Sessions, customize the session token with:
   ```json
   { "role": "authenticated", "email": "{{user.primary_email_address}}", "name": "{{user.full_name}}" }
   ```
   Then enable email code sign-in, plus phone code if you want SMS.
4. **Env vars.** Copy `.env.example` to `.env.local` and fill it in. On Vercel, set the same variables.
5. **Run it:**
   ```bash
   npm install
   npm run dev
   ```

### Demo accounts

With `DEMO_LOGINS=on`, the sign-in page offers six personas:

- Bea (student with applications)
- Nina (new student)
- Maria (coordinator)
- Ramon (admin)
- Liza (verified employer)
- Tess (employer in review)

They're Clerk users matched by `external_id` (`demo-*`) and are signed in with short-lived sign-in tokens. Their emails use reserved `example.com` subdomains, so no mail is sent. Turn demo mode off in production.

## Tests

```bash
npm test                 # unit tests (Vitest)
npm run test:e2e         # browser tests (Playwright) against http://localhost:3000
E2E_BASE_URL=https://your-app.vercel.app npm run test:e2e
```

## Design system

- **Font:** Instrument Sans 400–600 everywhere; headings at 400 with tight tracking.
- **Colors:** one periwinkle family plus a matching lilac.
  - Ink `#1E2140`, muted text `#5E6280`
  - Borders `#E6E7F2`, surface `#F4F5FC`
  - Primary fill `#D4DAFF` (hover `#B8C1FA`), soft fill `#E8EBFF`
  - Accent mark `#7C88DC`, accent text `#4A55A8`
  - Lilac `#A99BF0` / `#F1EDFF` / `#6A5DC2`
  - Dark mode tokens are in `src/app/globals.css`.
- **Spacing and shape:** 8px spacing scale, 8px button radii and 10–12px card radii, hairline borders, faint shadows.
- **Motion:** spring transitions, staggered reveals, hover lift and press feedback (Motion for React).

Company names and logos are placeholders.
