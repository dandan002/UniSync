# Unisync

Early-career platform for the Philippines: students go from no resume to their first OJT application by chatting with Sync, schools track every CHED internship form, and employers hire school-verified interns.

Built with Next.js 16, Supabase (Postgres, row-level security, Storage), Clerk (passwordless sign-in), Claude Haiku (Sync), Resend (email) and Motion. The original mockups live in `design/`.

## What's in the app

| Area | Routes | What it does |
| --- | --- | --- |
| Public | `/`, `/start`, `/schools`, `/employers`, `/privacy`, `/terms` | Landing page with the first question inline; eight-question onboarding with a live resume, saved on the device until the student signs in, then a chat with Sync that fills in the specifics |
| Sign-in | `/sign-in`, `/welcome` | Email or phone code (Clerk), one-click demo accounts, role-based routing |
| Students | `/home`, `/jobs`, `/resume`, `/resume/sync` | Next interview or offer, applications, updates, CHED forms with uploads, hours log; matched jobs with filters and apply; resume templates, strength score, hold to approve, PDF, editor; Sync chat |
| Schools | `/school`, `/school/companies`, `/school/forms`, `/school/people`, `/api/reports/ched` | KPIs, needs attention with one-click fixes, roster with bulk remind and endorse; MOAs; form review; people, roles, company verification, activity; CHED CSV export |
| Employers | `/register`, `/employer`, `/employer/jobs`, `/employer/interns` | Company registration and verification; applicant board with Sync recommendations, interviews, offers and messages (requests for money are blocked); jobs; hours approval and MOA signing |

Sync (`/api/sync`) rewrites Taglish answers into English resume lines with `claude-haiku-5-5` and structured output. Without `ANTHROPIC_API_KEY`, or if the call fails, it falls back to a rule-based rewrite.

### Sync chat

Once the student has answered the quick questions and saved, Sync becomes a chat (`/api/sync/chat`, `src/lib/agent`). A checklist in `src/lib/review.ts` finds the weak spots (stock placeholder entries, entries without specifics or numbers, missing dates, skills, summary, city and start date) and scores the resume. Sync works through that list one question at a time, in English, Filipino or Taglish, and edits the resume as the student answers: titles like "Cashier, 7-Eleven", a one-line description, and two to four bullets with the student's own numbers. The resume and strength score update live, every change shows as a chip, and the latest change can be undone. Students can come back any time from Improve with Sync on `/resume`.

It runs on `claude-haiku-5-5` with adaptive thinking at medium effort, streamed, with five tools and at most six steps per message. Without `ANTHROPIC_API_KEY` it walks the same checklist with fixed questions and the rule-based rewrite.

How it's guarded:

- **Who and what:** signed-in students only, same-origin JSON requests only, and only on their own saved resume, which is reloaded from the database every turn. The tools can edit projects, experience, skills, summary, city and availability. They can't reach name, email, phone or job preferences.
- **Untrusted input:** the browser's transcript is capped (24 turns, 1,200 characters per message, 64 KB per request) and replayed as plain text only, so no tool calls or thinking blocks can be forged. The resume and checklist travel as tagged data in the user turn, never in the system prompt, and the prompt tells Sync to treat them as content, not instructions. It refuses off-topic requests and prompt-injection attempts and steers back to the resume.
- **What gets saved:** every tool input is validated, stripped of control and invisible characters, length-capped and capped in count. First-person text ("I", "my", "we", "our") is sent back to Sync to rewrite, and so is any number the student never gave (digits or number words in English or Filipino; years and dates are exempt), so a made-up "35%" can't reach the resume. The result passes the same `ResumeSchema` as manual edits before it's stored. The prompt forbids inventing facts, and summaries are written only from what the student says they want.
- **Cost:** 20 messages per 10 minutes and 150 per day per student, enforced in Postgres by `take_sync_turn()` (migration `20261124090000_sync_chat_limits.sql`). Until that migration is applied, the route falls back to per-instance in-memory limits and logs a warning. Output is capped at 8,000 tokens per step.

### Privacy policy and terms

`/privacy` and `/terms` describe what the app actually does: the data each role creates, who can see it (schools see their students; companies see applicants), the outside services that handle it (`PROCESSORS` in `src/lib/legal.ts`), Sync's use of Claude, account deletion and rights under the Data Privacy Act of 2012. Sign-in, the onboarding save step and company registration link to both. Privacy requests go to mail@unisync.dev (`LEGAL.email`). Before launch, put the registered business name in `LEGAL.operator`, and have a lawyer review both pages. Update them whenever data handling changes.

Emails (`src/lib/email`) cover resume ready, application sent, new applicant, interview, offer, reminder, invite, company verified, message and MOA. With demo mode on, preview them at `/api/emails/index`.

## Architecture

- **Auth:** Clerk issues session tokens with `role: authenticated` and the verified `email` claim. Supabase trusts Clerk as a third-party auth provider, so every query runs as the signed-in user under row-level security.
- **Profiles:** `public.ensure_profile()` runs on first sign-in. It claims a matching invited or seeded profile by verified email, or creates one. A school email domain links a student to their school.
- **Authorization:** in the database. Students see their own rows, staff see their school, supervisors see their company and its applicants. State changes (approvals, forms, hours, invites, roles, company checks) go through checked `security definer` functions in `supabase/migrations`.
- **Uploads:** CHED form files go to the private `forms` bucket, one folder per student.
- **Deleting:** students can delete their resume from `/resume` and start over (`delete_my_resume()` also resets the resume form). Anyone can delete their account from the account menu by typing DELETE. That removes their uploaded forms through the Storage API, then calls `delete_my_account()`, which deletes the profile and everything that cascades from it (resume, applications, forms, hours, saved jobs, notifications), and finally deletes the Clerk user. Companies with open applications get a notification, the school's activity log notes it, and when the last supervisor of a company leaves, its open jobs close. A school's only admin has to hand the role over first. Demo personas (`profiles.demo`, plus Clerk `external_id` `demo-*`) can't be deleted. Clerk session tokens stay valid for up to a minute after the user is gone, so deleted logins are kept in `private.deleted_accounts` for a day, and `ensure_profile()` won't recreate them.

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

They're Clerk users matched by `external_id` (`demo-*`) and are signed in with short-lived sign-in tokens. An hourly `pg_cron` job (`roll-demo-interviews`) keeps demo interviews in the future by moving any that are less than a day away forward by whole weeks. Their emails use reserved `example.com` subdomains, so no mail is sent. Turn demo mode off in production.

## Tests

```bash
npm test                 # unit tests (Vitest)
npm run test:e2e         # browser tests (Playwright) against http://localhost:3000
E2E_BASE_URL=https://your-app.vercel.app npm run test:e2e
```

The onboarding email-code tests sign up with Clerk test addresses (`+clerk_test`, code `424242`) and delete the account afterwards. Only Clerk development instances accept those, so the tests skip when `E2E_BASE_URL` is set.

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
