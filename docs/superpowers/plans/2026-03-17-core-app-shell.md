# Core App Shell & Resume Import Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the end-to-end loop from sign-up through onboarding wizard to an editable profile dashboard, with resume upload and AI parsing.

**Architecture:** Server-only Supabase access via `service_role` key scoped by Clerk `userId`. `onboarding_completed` stored in both Supabase (authoritative) and Clerk `publicMetadata` (for middleware). All LLM calls via Next.js API routes server-side only.

**Tech Stack:** Next.js 16 (App Router), Clerk v7 (`@clerk/nextjs`), Supabase (`@supabase/supabase-js`), OpenRouter API, `pdfjs-dist`, `mammoth`, `zod`, `vitest`

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `src/middleware.ts` | Clerk middleware: unauthenticated → sign-in, pre-onboarding → /onboarding |
| `src/lib/supabase.ts` | Server-only Supabase client factory (service_role) |
| `src/lib/types.ts` | Shared TypeScript types: Experience, Education, ProfileData |
| `src/lib/schemas.ts` | Zod schemas: parsedResumeSchema, profileFormSchema |
| `src/lib/profile-completeness.ts` | Pure function: profile completeness score (0–8) |
| `src/lib/actions/user.ts` | Server actions: syncUser(), completeOnboarding() |
| `src/lib/actions/profile.ts` | Server actions: saveProfile(), getProfile() |
| `src/components/profile/TagInput.tsx` | Tag-style free-form input (skills, interests, misc) |
| `src/components/profile/ExperienceBlock.tsx` | Repeating experience form block |
| `src/components/profile/EducationBlock.tsx` | Repeating education form block |
| `src/components/profile/ResumeUpload.tsx` | File picker + client-side PDF/DOCX text extraction |
| `src/components/profile/ProfileForm.tsx` | Shared profile editor (used in onboarding + dashboard) |
| `src/components/dashboard/Sidebar.tsx` | Desktop sidebar nav with UserButton |
| `src/app/onboarding/page.tsx` | Server component: syncUser + route to OnboardingClient |
| `src/app/onboarding/OnboardingClient.tsx` | Client component: wizard step shell (step 1/2/3) |
| `src/app/api/parse-resume/route.ts` | POST: text → OpenRouter → Zod-validated JSON |
| `src/app/dashboard/layout.tsx` | Dashboard layout: auth + onboarding guard + sidebar |
| `src/app/dashboard/profile/page.tsx` | Profile view: load profile + ProfileForm |
| `src/app/dashboard/resumes/page.tsx` | Resumes shell: empty state |
| `vitest.config.ts` | Vitest config for Next.js (node environment) |
| `src/__tests__/schemas.test.ts` | Zod schema unit tests |
| `src/__tests__/profile-completeness.test.ts` | Completeness function unit tests |
| `supabase/schema.sql` | Schema SQL for reference and version control |

### Modified files
| File | Change |
|---|---|
| `src/app/layout.tsx` | No code change needed; env vars handle Clerk redirects |
| `CLAUDE.md` | Update Auth0 → Clerk references throughout |
| `src/proxy.ts` | Delete (empty stub; middleware moves to `src/middleware.ts`) |

---

## Task 1: Dependencies & test tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install @supabase/supabase-js zod pdfjs-dist mammoth
npm install --save-dev @types/mammoth
```

- [ ] **Step 2: Install Vitest**

```bash
npm install --save-dev vitest @vitejs/plugin-react vite-tsconfig-paths
```

- [ ] **Step 3: Add test scripts to package.json**

In `package.json`, add inside `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
})
```

- [ ] **Step 5: Add missing env vars to .env.local**

Append to `.env.local` (fill real values from Supabase dashboard → Settings → API, and OpenRouter dashboard):
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

> **Important:** Use `SUPABASE_SERVICE_ROLE_KEY` (not the anon key). The service role key is in Supabase dashboard → Project Settings → API → "service_role" section.

- [ ] **Step 6: Verify npm test runs (will pass with no test files)**

```bash
npm test
```
Expected: 0 tests run, exit 0

- [ ] **Step 7: Commit**

```bash
git add package.json vitest.config.ts
git commit -m "chore: add supabase, zod, pdfjs-dist, mammoth, vitest"
```

---

## Task 2: Supabase database schema

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: Run schema SQL in Supabase dashboard → SQL Editor**

```sql
-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text not null,
  name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Profiles table
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  headline text,
  summary text,
  location text,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  miscellaneous text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Experiences table
create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  company text,
  title text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  bullets text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Education table
create table if not exists education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  school text,
  degree text,
  field text,
  start_date date,
  end_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Resumes table (shell — not written to this phase)
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on all tables (defense in depth; primary guard is server-side filtering via service_role)
alter table users enable row level security;
alter table profiles enable row level security;
alter table experiences enable row level security;
alter table education enable row level security;
alter table resumes enable row level security;
```

- [ ] **Step 2: Verify tables exist in Supabase table editor**

In the Supabase dashboard → Table Editor, confirm all 5 tables are visible: `users`, `profiles`, `experiences`, `education`, `resumes`.

- [ ] **Step 3: Save schema to file and commit**

Save the same SQL to `supabase/schema.sql`, then:
```bash
mkdir -p supabase
git add supabase/schema.sql
git commit -m "chore: add supabase schema SQL"
```

---

## Task 3: Shared types & Zod schemas

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/schemas.ts`
- Create: `src/__tests__/schemas.test.ts`

- [ ] **Step 1: Write failing schema tests**

Create `src/__tests__/schemas.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parsedResumeSchema, profileFormSchema } from '../lib/schemas'

describe('parsedResumeSchema', () => {
  it('accepts a fully-populated object', () => {
    const input = {
      name: 'Jane Doe',
      headline: 'Software Engineer',
      location: 'London',
      summary: 'Experienced developer',
      skills: ['TypeScript', 'React'],
      interests: ['Open source'],
      miscellaneous: ['AWS Certified'],
      experiences: [{
        company: 'Acme', title: 'Engineer',
        start_date: '2020-01', end_date: null,
        is_current: true, bullets: ['Built things'],
      }],
      education: [{
        school: 'MIT', degree: 'BSc', field: 'Computer Science',
        start_date: '2016-09', end_date: '2020-06',
      }],
    }
    expect(() => parsedResumeSchema.parse(input)).not.toThrow()
  })

  it('accepts an empty object (all fields optional)', () => {
    expect(() => parsedResumeSchema.parse({})).not.toThrow()
  })

  it('strips unknown fields', () => {
    const result = parsedResumeSchema.parse({ name: 'Jane', unknown_field: 'value' })
    expect((result as Record<string, unknown>).unknown_field).toBeUndefined()
  })
})

describe('profileFormSchema', () => {
  it('rejects an object without a name', () => {
    expect(() => profileFormSchema.parse({})).toThrow()
  })

  it('accepts a minimal valid profile (name only)', () => {
    expect(() => profileFormSchema.parse({ name: 'Jane' })).not.toThrow()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```
Expected: FAIL — "Cannot find module '../lib/schemas'"

- [ ] **Step 3: Create src/lib/types.ts**

```typescript
export interface Experience {
  id?: string
  company: string
  title: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  bullets: string[]
  sort_order: number
}

export interface Education {
  id?: string
  school: string
  degree: string
  field: string
  start_date: string | null
  end_date: string | null
  sort_order: number
}
```

- [ ] **Step 4: Create src/lib/schemas.ts**

```typescript
import { z } from 'zod'

const experienceSchema = z.object({
  company: z.string().default(''),
  title: z.string().default(''),
  start_date: z.string().nullable().default(null),
  end_date: z.string().nullable().default(null),
  is_current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
}).strip()

const educationSchema = z.object({
  school: z.string().default(''),
  degree: z.string().default(''),
  field: z.string().default(''),
  start_date: z.string().nullable().default(null),
  end_date: z.string().nullable().default(null),
}).strip()

// Validates the OpenRouter parse response — all fields optional since LLMs may return partial data
export const parsedResumeSchema = z.object({
  name: z.string().optional(),
  headline: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  miscellaneous: z.array(z.string()).optional(),
  experiences: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
}).strip()

export type ParsedResume = z.infer<typeof parsedResumeSchema>

// Validates profile form submissions — name is the only required field
export const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  headline: z.string().default(''),
  location: z.string().default(''),
  summary: z.string().default(''),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  miscellaneous: z.array(z.string()).default([]),
  experiences: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
})

export type ProfileFormData = z.infer<typeof profileFormSchema>
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test
```
Expected: PASS — 5 tests green

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/schemas.ts src/__tests__/schemas.test.ts
git commit -m "feat: add shared types and Zod schemas"
```

---

## Task 4: Profile completeness

**Files:**
- Create: `src/lib/profile-completeness.ts`
- Create: `src/__tests__/profile-completeness.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/profile-completeness.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { getProfileCompleteness } from '../lib/profile-completeness'
import type { ProfileFormData } from '../lib/schemas'

const empty: ProfileFormData = {
  name: '', headline: '', location: '', summary: '',
  skills: [], interests: [], miscellaneous: [],
  experiences: [], education: [],
}

describe('getProfileCompleteness', () => {
  it('returns 0/8 for a completely empty profile', () => {
    const r = getProfileCompleteness(empty)
    expect(r.filled).toBe(0)
    expect(r.total).toBe(8)
  })

  it('counts name as 1 filled section', () => {
    expect(getProfileCompleteness({ ...empty, name: 'Jane' }).filled).toBe(1)
  })

  it('counts experiences and education together as 1 section', () => {
    const withExp = {
      ...empty,
      name: 'Jane',
      experiences: [{ company: 'Acme', title: 'Eng', start_date: null, end_date: null, is_current: false, bullets: [], sort_order: 0 }],
    }
    expect(getProfileCompleteness(withExp).filled).toBe(2)
  })

  it('returns 8/8 for a fully complete profile', () => {
    const full: ProfileFormData = {
      name: 'Jane', headline: 'Engineer', location: 'London', summary: 'Great dev',
      skills: ['TS'], interests: ['OSS'], miscellaneous: ['AWS cert'],
      experiences: [{ company: 'Acme', title: 'Eng', start_date: null, end_date: null, is_current: false, bullets: [], sort_order: 0 }],
      education: [{ school: 'MIT', degree: 'BSc', field: 'CS', start_date: null, end_date: null, sort_order: 0 }],
    }
    const r = getProfileCompleteness(full)
    expect(r.filled).toBe(8)
    expect(r.total).toBe(8)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test
```
Expected: FAIL — "Cannot find module '../lib/profile-completeness'"

- [ ] **Step 3: Implement profile-completeness.ts**

Create `src/lib/profile-completeness.ts`:
```typescript
import type { ProfileFormData } from './schemas'

export interface CompletenessResult {
  filled: number
  total: number
  label: string
}

// 8 sections: name, headline, location, summary, skills, interests, miscellaneous,
// and experiences+education combined (having at least one of either counts as filled)
const TOTAL = 8

export function getProfileCompleteness(profile: Partial<ProfileFormData>): CompletenessResult {
  let filled = 0
  if (profile.name) filled++
  if (profile.headline) filled++
  if (profile.location) filled++
  if (profile.summary) filled++
  if (profile.skills?.length) filled++
  if (profile.interests?.length) filled++
  if (profile.miscellaneous?.length) filled++
  if ((profile.experiences?.length ?? 0) + (profile.education?.length ?? 0) > 0) filled++

  return { filled, total: TOTAL, label: `${filled} of ${TOTAL} sections filled` }
}
```

- [ ] **Step 4: Run to confirm passing**

```bash
npm test
```
Expected: PASS — 9 tests green (5 schema + 4 completeness)

- [ ] **Step 5: Commit**

```bash
git add src/lib/profile-completeness.ts src/__tests__/profile-completeness.test.ts
git commit -m "feat: add profile completeness calculator"
```

---

## Task 5: Supabase client & server actions

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/actions/user.ts`
- Create: `src/lib/actions/profile.ts`

- [ ] **Step 1: Create Supabase server client**

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

// Server-only. Never import in client components.
export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  }
  return createClient(url, key)
}
```

- [ ] **Step 2: Create user server actions**

Create `src/lib/actions/user.ts`:
```typescript
'use server'

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function syncUser() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const clerkUser = await currentUser()
  if (!clerkUser) throw new Error('Could not fetch Clerk user')

  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('users')
    .upsert(
      {
        clerk_id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
        avatar_url: clerkUser.imageUrl ?? null,
      },
      { onConflict: 'clerk_id' }
    )

  if (error) throw new Error(`syncUser failed: ${error.message}`)
}

export async function completeOnboarding() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('users')
    .update({ onboarding_completed: true })
    .eq('clerk_id', userId)

  if (error) throw new Error(`completeOnboarding failed: ${error.message}`)

  // Mirror to Clerk publicMetadata so middleware can read it without a DB call
  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { onboarding_completed: true },
  })
}
```

- [ ] **Step 3: Create profile server actions**

Create `src/lib/actions/profile.ts`:
```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseClient } from '@/lib/supabase'
import type { ProfileFormData } from '@/lib/schemas'
import type { Experience, Education } from '@/lib/types'

export async function saveProfile(data: ProfileFormData & { name: string }) {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const supabase = getSupabaseClient()

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (userError || !user) throw new Error('User not found in database')

  await supabase.from('users').update({ name: data.name }).eq('id', user.id)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        headline: data.headline,
        summary: data.summary,
        location: data.location,
        skills: data.skills,
        interests: data.interests,
        miscellaneous: data.miscellaneous,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('id')
    .single()

  if (profileError || !profile) throw new Error(`saveProfile failed: ${profileError?.message}`)

  const profileId = profile.id

  // Replace experiences: delete all, then re-insert in order
  await supabase.from('experiences').delete().eq('profile_id', profileId)
  if (data.experiences.length > 0) {
    await supabase.from('experiences').insert(
      data.experiences.map((exp: Experience, i: number) => ({
        profile_id: profileId,
        company: exp.company,
        title: exp.title,
        start_date: exp.start_date || null,
        end_date: exp.end_date || null,
        is_current: exp.is_current,
        bullets: exp.bullets,
        sort_order: i,
      }))
    )
  }

  // Replace education: delete all, then re-insert in order
  await supabase.from('education').delete().eq('profile_id', profileId)
  if (data.education.length > 0) {
    await supabase.from('education').insert(
      data.education.map((edu: Education, i: number) => ({
        profile_id: profileId,
        school: edu.school,
        degree: edu.degree,
        field: edu.field,
        start_date: edu.start_date || null,
        end_date: edu.end_date || null,
        sort_order: i,
      }))
    )
  }

  revalidatePath('/dashboard/profile')
}

export async function getProfile(): Promise<(ProfileFormData & { name: string }) | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = getSupabaseClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, name')
    .eq('clerk_id', userId)
    .single()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) return null

  const { data: experiences } = await supabase
    .from('experiences')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order')

  const { data: education } = await supabase
    .from('education')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order')

  return {
    name: user.name ?? '',
    headline: profile.headline ?? '',
    location: profile.location ?? '',
    summary: profile.summary ?? '',
    skills: profile.skills ?? [],
    interests: profile.interests ?? [],
    miscellaneous: profile.miscellaneous ?? [],
    experiences: (experiences ?? []).map((e) => ({
      id: e.id,
      company: e.company ?? '',
      title: e.title ?? '',
      start_date: e.start_date,
      end_date: e.end_date,
      is_current: e.is_current,
      bullets: e.bullets ?? [],
      sort_order: e.sort_order,
    })),
    education: (education ?? []).map((e) => ({
      id: e.id,
      school: e.school ?? '',
      degree: e.degree ?? '',
      field: e.field ?? '',
      start_date: e.start_date,
      end_date: e.end_date,
      sort_order: e.sort_order,
    })),
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts src/lib/actions/
git commit -m "feat: add Supabase client and user/profile server actions"
```

---

## Task 6: Middleware

**Files:**
- Create: `src/middleware.ts`
- Delete: `src/proxy.ts`

- [ ] **Step 1: Create src/middleware.ts**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  const { pathname } = req.nextUrl

  // Unauthenticated user on a protected route → sign in
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Authenticated user hitting /dashboard without completing onboarding → /onboarding
  // onboarding_completed is read from Clerk publicMetadata (no DB call needed on Edge)
  if (userId && pathname.startsWith('/dashboard')) {
    const meta = sessionClaims?.publicMetadata as Record<string, unknown> | undefined
    if (!meta?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

- [ ] **Step 2: Delete src/proxy.ts (empty stub)**

```bash
git rm src/proxy.ts
```

- [ ] **Step 3: Start dev server and verify no startup errors**

```bash
npm run dev
```
Expected: server starts on :3000, no errors in terminal output

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add Clerk middleware with auth and onboarding redirect"
```

---

## Task 7: Parse-resume API route

**Files:**
- Create: `src/app/api/parse-resume/route.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/parse-resume/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { parsedResumeSchema } from '@/lib/schemas'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT = `You are a resume parser. Extract structured information from the resume text and return ONLY valid JSON (no markdown, no code fences). Use this exact structure:
{
  "name": "string or null",
  "headline": "current job title or professional headline",
  "location": "city, country or null",
  "summary": "professional summary or null",
  "skills": ["skill1", "skill2"],
  "interests": ["interest1"],
  "miscellaneous": ["certification or language or publication"],
  "experiences": [
    {
      "company": "company name",
      "title": "job title",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null",
      "is_current": true,
      "bullets": ["achievement or responsibility"]
    }
  ],
  "education": [
    {
      "school": "institution name",
      "degree": "degree type e.g. BSc",
      "field": "field of study",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null"
    }
  ]
}`

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.text || typeof body.text !== 'string') {
    return NextResponse.json({ error: 'Missing text field' }, { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenRouter not configured' }, { status: 500 })
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-flash-1.5',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: body.text.slice(0, 20000) }, // cap at 20k chars
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'LLM call failed' }, { status: 502 })
  }

  const llmData = await response.json()
  const rawContent = llmData.choices?.[0]?.message?.content ?? '{}'

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 502 })
  }

  // Validate response — partial results are fine, unknown fields are stripped
  const result = parsedResumeSchema.safeParse(parsed)
  const safeData = result.success ? result.data : {}

  return NextResponse.json(safeData)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/parse-resume/route.ts
git commit -m "feat: add parse-resume API route (OpenRouter + Zod validation)"
```

---

## Task 8: Profile UI components

**Files:**
- Create: `src/components/profile/TagInput.tsx`
- Create: `src/components/profile/ExperienceBlock.tsx`
- Create: `src/components/profile/EducationBlock.tsx`
- Create: `src/components/profile/ResumeUpload.tsx`

All are `'use client'` components.

- [ ] **Step 1: Create TagInput.tsx**

Create `src/components/profile/TagInput.tsx`:
```typescript
'use client'

import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  label: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ label, value, onChange, placeholder = 'Type and press Enter' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault()
      const tag = inputValue.trim().replace(/,$/, '')
      if (tag && !value.includes(tag)) {
        onChange([...value, tag])
      }
      setInputValue('')
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="min-h-10 flex flex-wrap gap-1.5 rounded-md border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-primary">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="hover:text-primary/60" aria-label={`Remove ${tag}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ExperienceBlock.tsx**

Create `src/components/profile/ExperienceBlock.tsx`:
```typescript
'use client'

import { Trash2 } from 'lucide-react'
import type { Experience } from '@/lib/types'

interface Props {
  value: Experience
  onChange: (exp: Experience) => void
  onRemove: () => void
  index: number
}

export function ExperienceBlock({ value, onChange, onRemove, index }: Props) {
  const update = (patch: Partial<Experience>) => onChange({ ...value, ...patch })

  return (
    <div className="rounded-md border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Experience {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove experience">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company" value={value.company} onChange={(v) => update({ company: v })} />
        <Field label="Title" value={value.title} onChange={(v) => update({ title: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date" value={value.start_date ?? ''} onChange={(v) => update({ start_date: v || null })} placeholder="YYYY-MM" />
        <div className="space-y-1.5">
          <Field
            label="End date"
            value={value.is_current ? '' : (value.end_date ?? '')}
            onChange={(v) => update({ end_date: v || null })}
            placeholder="YYYY-MM"
            disabled={value.is_current}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={value.is_current}
              onChange={(e) => update({ is_current: e.target.checked, end_date: e.target.checked ? null : value.end_date })}
              className="rounded"
            />
            Current role
          </label>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Bullets</label>
        <textarea
          value={value.bullets.join('\n')}
          onChange={(e) => update({ bullets: e.target.value.split('\n') })}
          placeholder="One achievement or responsibility per line"
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-y"
        />
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground disabled:opacity-50"
      />
    </div>
  )
}
```

- [ ] **Step 3: Create EducationBlock.tsx**

Create `src/components/profile/EducationBlock.tsx`:
```typescript
'use client'

import { Trash2 } from 'lucide-react'
import type { Education } from '@/lib/types'

interface Props {
  value: Education
  onChange: (edu: Education) => void
  onRemove: () => void
  index: number
}

export function EducationBlock({ value, onChange, onRemove, index }: Props) {
  const update = (patch: Partial<Education>) => onChange({ ...value, ...patch })

  return (
    <div className="rounded-md border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Education {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove education">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <Field label="School" value={value.school} onChange={(v) => update({ school: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Degree" value={value.degree} onChange={(v) => update({ degree: v })} placeholder="e.g. BSc, MSc" />
        <Field label="Field of study" value={value.field} onChange={(v) => update({ field: v })} placeholder="e.g. Computer Science" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date" value={value.start_date ?? ''} onChange={(v) => update({ start_date: v || null })} placeholder="YYYY-MM" />
        <Field label="End date" value={value.end_date ?? ''} onChange={(v) => update({ end_date: v || null })} placeholder="YYYY-MM" />
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
      />
    </div>
  )
}
```

- [ ] **Step 4: Create ResumeUpload.tsx**

Create `src/components/profile/ResumeUpload.tsx`:
```typescript
'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import type { ParsedResume } from '@/lib/schemas'

interface Props {
  onParsed: (data: ParsedResume) => void
  onError: (message: string) => void
}

export function ResumeUpload({ onParsed, onError }: Props) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function extractText(file: File): Promise<string> {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const pdfjsLib = await import('pdfjs-dist')
      // CDN version must match installed pdfjs-dist package version exactly
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((item: { str?: string }) => item.str ?? '').join(' ') + '\n'
      }
      return text
    }

    if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    }

    throw new Error('Unsupported file type. Please upload a PDF or DOCX.')
  }

  async function handleFile(file: File) {
    setLoading(true)
    try {
      const text = await extractText(file)
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!response.ok) throw new Error('Failed to parse resume. Please try again.')
      const parsed = await response.json()
      onParsed(parsed)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept=".pdf,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} className="sr-only" aria-label="Upload resume" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
        <div>
          <p className="text-sm font-medium">{loading ? 'Parsing your resume…' : 'Click to upload your resume'}</p>
          <p className="text-xs text-muted-foreground mt-1">PDF or DOCX</p>
        </div>
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/profile/
git commit -m "feat: add TagInput, ExperienceBlock, EducationBlock, ResumeUpload components"
```

---

## Task 9: ProfileForm component

**Files:**
- Create: `src/components/profile/ProfileForm.tsx`

- [ ] **Step 1: Create ProfileForm.tsx**

Create `src/components/profile/ProfileForm.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { TagInput } from './TagInput'
import { ExperienceBlock } from './ExperienceBlock'
import { EducationBlock } from './EducationBlock'
import { ResumeUpload } from './ResumeUpload'
import type { ProfileFormData } from '@/lib/schemas'
import type { Experience, Education } from '@/lib/types'

interface Props {
  initialData?: Partial<ProfileFormData & { name: string }>
  onSave: (data: ProfileFormData & { name: string }) => Promise<void>
  showUpload?: boolean
  saveLabel?: string
}

const emptyExperience = (): Experience => ({
  company: '', title: '', start_date: null, end_date: null,
  is_current: false, bullets: [], sort_order: 0,
})

const emptyEducation = (): Education => ({
  school: '', degree: '', field: '', start_date: null, end_date: null, sort_order: 0,
})

export function ProfileForm({ initialData, onSave, showUpload = false, saveLabel = 'Save profile' }: Props) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [headline, setHeadline] = useState(initialData?.headline ?? '')
  const [location, setLocation] = useState(initialData?.location ?? '')
  const [summary, setSummary] = useState(initialData?.summary ?? '')
  const [skills, setSkills] = useState<string[]>(initialData?.skills ?? [])
  const [interests, setInterests] = useState<string[]>(initialData?.interests ?? [])
  const [miscellaneous, setMiscellaneous] = useState<string[]>(initialData?.miscellaneous ?? [])
  const [experiences, setExperiences] = useState<Experience[]>(initialData?.experiences ?? [])
  const [education, setEducation] = useState<Education[]>(initialData?.education ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function applyParsed(parsed: Partial<ProfileFormData & { name: string }>) {
    if (parsed.name) setName(parsed.name)
    if (parsed.headline) setHeadline(parsed.headline)
    if (parsed.location) setLocation(parsed.location)
    if (parsed.summary) setSummary(parsed.summary)
    if (parsed.skills?.length) setSkills(parsed.skills)
    if (parsed.interests?.length) setInterests(parsed.interests)
    if (parsed.miscellaneous?.length) setMiscellaneous(parsed.miscellaneous)
    if (parsed.experiences?.length) {
      setExperiences(parsed.experiences.map((e, i) => ({ ...emptyExperience(), ...e, sort_order: i })))
    }
    if (parsed.education?.length) {
      setEducation(parsed.education.map((e, i) => ({ ...emptyEducation(), ...e, sort_order: i })))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({ name, headline, location, summary, skills, interests, miscellaneous, experiences, education })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {showUpload && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Import from file</h2>
          <ResumeUpload onParsed={applyParsed} onError={(msg) => setError(msg)} />
          <p className="text-xs text-muted-foreground text-center">Upload to pre-fill the form, or fill it in manually below.</p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Basic info</h2>
        <Field label="Name *" value={name} onChange={setName} placeholder="Your full name" />
        <Field label="Headline" value={headline} onChange={setHeadline} placeholder="e.g. Senior Software Engineer at Acme" />
        <Field label="Location" value={location} onChange={setLocation} placeholder="e.g. London, UK" />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Summary</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A brief professional summary…" rows={4} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-y" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Experience</h2>
          <button type="button" onClick={() => setExperiences([...experiences, emptyExperience()])} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add experience
          </button>
        </div>
        {experiences.length === 0 && <p className="text-sm text-muted-foreground">No experiences added yet.</p>}
        {experiences.map((exp, i) => (
          <ExperienceBlock key={i} index={i} value={exp}
            onChange={(updated) => setExperiences(experiences.map((e, j) => j === i ? updated : e))}
            onRemove={() => setExperiences(experiences.filter((_, j) => j !== i))}
          />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Education</h2>
          <button type="button" onClick={() => setEducation([...education, emptyEducation()])} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add education
          </button>
        </div>
        {education.length === 0 && <p className="text-sm text-muted-foreground">No education added yet.</p>}
        {education.map((edu, i) => (
          <EducationBlock key={i} index={i} value={edu}
            onChange={(updated) => setEducation(education.map((e, j) => j === i ? updated : e))}
            onRemove={() => setEducation(education.filter((_, j) => j !== i))}
          />
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">More about you</h2>
        <TagInput label="Skills" value={skills} onChange={setSkills} placeholder="Type a skill and press Enter" />
        <TagInput label="Interests" value={interests} onChange={setInterests} placeholder="Type an interest and press Enter" />
        <TagInput label="Miscellaneous" value={miscellaneous} onChange={setMiscellaneous} placeholder="Certifications, languages, publications…" />
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? 'Saving…' : saveLabel}
      </button>
    </form>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/ProfileForm.tsx
git commit -m "feat: add ProfileForm shared component"
```

---

## Task 10: Onboarding flow

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/app/onboarding/OnboardingClient.tsx`

- [ ] **Step 1: Create onboarding page server component**

Create `src/app/onboarding/page.tsx`:
```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncUser } from '@/lib/actions/user'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Idempotent upsert — safe to call on every visit
  await syncUser()

  const params = await searchParams
  const step = params.step ?? '1'

  return <OnboardingClient initialStep={step} />
}
```

- [ ] **Step 2: Create OnboardingClient**

Create `src/app/onboarding/OnboardingClient.tsx`:
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { saveProfile } from '@/lib/actions/profile'
import { completeOnboarding } from '@/lib/actions/user'
import type { ProfileFormData } from '@/lib/schemas'

export function OnboardingClient({ initialStep }: { initialStep: string }) {
  const router = useRouter()

  async function handleSave(data: ProfileFormData & { name: string }) {
    await saveProfile(data)
    router.push('/onboarding?step=3')
  }

  async function handleComplete() {
    await completeOnboarding()
    router.push('/dashboard/profile')
  }

  if (initialStep === '3') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-5xl">✓</div>
          <h1 className="font-display text-3xl font-bold">Your profile is ready.</h1>
          <p className="text-muted-foreground">You can always edit it from your dashboard.</p>
          <button onClick={handleComplete} className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Go to dashboard →
          </button>
        </div>
      </div>
    )
  }

  if (initialStep === '2') {
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="mb-8">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Step 2 of 2</p>
            <h1 className="font-display text-3xl font-bold">Build your profile</h1>
            <p className="text-muted-foreground mt-2">Upload your resume to pre-fill, or fill in the form directly.</p>
          </div>
          <ProfileForm onSave={handleSave} showUpload={true} saveLabel="Save and continue →" />
        </div>
      </div>
    )
  }

  // Step 1: choose path
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Step 1 of 2</p>
          <h1 className="font-display text-3xl font-bold">How do you want to start?</h1>
          <p className="text-muted-foreground mt-2">You can always add more later.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button onClick={() => router.push('/onboarding?step=2')} className="rounded-xl border-2 border-border p-6 text-left hover:border-primary hover:bg-primary/5 transition-all">
            <div className="text-2xl mb-3">📄</div>
            <h2 className="font-semibold">Upload your resume</h2>
            <p className="text-sm text-muted-foreground mt-1">PDF or DOCX — we'll extract your info automatically.</p>
          </button>
          <button onClick={() => router.push('/onboarding?step=2')} className="rounded-xl border-2 border-border p-6 text-left hover:border-primary hover:bg-primary/5 transition-all">
            <div className="text-2xl mb-3">✏️</div>
            <h2 className="font-semibold">Start from scratch</h2>
            <p className="text-sm text-muted-foreground mt-1">Fill in your details directly.</p>
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Manual smoke test — onboarding flow**

Start dev server (`npm run dev`). Sign up with a new account and verify:
1. After sign-up, redirected to `/dashboard` → middleware redirects to `/onboarding` (step 1)
2. Both cards navigate to `?step=2`
3. ProfileForm renders with upload widget
4. Upload a test PDF or DOCX — form pre-fills
5. Manually editing the form works
6. Save → advances to `?step=3`
7. "Go to dashboard" → redirected to `/dashboard/profile`

Check Supabase table editor: `users`, `profiles`, `experiences`, `education` rows created correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/
git commit -m "feat: add onboarding wizard (steps 1–3)"
```

---

## Task 11: Dashboard layout & sidebar

**Files:**
- Create: `src/components/dashboard/Sidebar.tsx`
- Create: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Create Sidebar.tsx**

Create `src/components/dashboard/Sidebar.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { User, FileText } from 'lucide-react'

const navItems = [
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/resumes', label: 'Resumes', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-background">
      <div className="flex items-center px-4 py-5 border-b border-border">
        <span className="font-display font-bold text-lg">UniSync</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border">
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create dashboard layout**

Create `src/app/dashboard/layout.tsx`:
```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')

  const meta = sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  if (!meta?.onboarding_completed) redirect('/onboarding')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/Sidebar.tsx src/app/dashboard/layout.tsx
git commit -m "feat: add dashboard layout with sidebar"
```

---

## Task 12: Dashboard views

**Files:**
- Create: `src/app/dashboard/profile/page.tsx`
- Create: `src/app/dashboard/resumes/page.tsx`

- [ ] **Step 1: Create profile view**

Create `src/app/dashboard/profile/page.tsx`:
```typescript
import { getProfile, saveProfile } from '@/lib/actions/profile'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { getProfileCompleteness } from '@/lib/profile-completeness'

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Your profile</h1>
        {profile && (
          <p className="text-sm text-muted-foreground mt-2">
            {getProfileCompleteness(profile).label}
          </p>
        )}
      </div>
      <ProfileForm
        initialData={profile ?? undefined}
        onSave={saveProfile}
        saveLabel="Save changes"
      />
    </div>
  )
}
```

- [ ] **Step 2: Create resumes shell**

Create `src/app/dashboard/resumes/page.tsx`:
```typescript
import { FileText } from 'lucide-react'

export default function ResumesPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Resumes</h1>
        <p className="text-muted-foreground mt-2">Build tailored resumes from your profile.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">No resumes yet</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Resume builder coming soon. Your profile data will power every resume you create.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Manual end-to-end test**

With dev server running, verify the full flow works:
1. Sign up → onboarding → fill profile → complete → `/dashboard/profile`
2. Completeness indicator shows correct count
3. Edit a field → Save changes → refresh → changes persisted (check Supabase table viewer)
4. Navigate to Resumes → empty state displays
5. Sign out → visit `/dashboard/profile` → redirected to `/sign-in`
6. Sign in → redirected to `/dashboard/profile` (onboarding already complete)

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/
git commit -m "feat: add dashboard profile view and resumes shell"
```

---

## Task 13: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace Auth section**

In `CLAUDE.md`, replace:
```
### Auth
- **Auth0** — social logins (Google, GitHub, LinkedIn), JWT-based sessions
- Auth0 tenant: `dev-leqagu36u50tw77h.us.auth0.com`
```

With:
```
### Auth
- **Clerk** (`@clerk/nextjs` v7) — social logins (Google, GitHub), JWT-based sessions
- Sign-in: `/sign-in`, Sign-up: `/sign-up`
- `onboarding_completed` stored in Supabase `users` table (authoritative) and Clerk `publicMetadata` (used by middleware)
```

Also update the Phase 1 checklist item from `Install and configure clerk authentication.` to `[x] Install and configure Clerk authentication.` (mark as done).

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md — Clerk (was Auth0), mark Phase 1 auth done"
```
