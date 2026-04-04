# Resume Builder Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static resumes area with real Supabase-backed resume CRUD and a first editable builder page.

**Architecture:** Add a dedicated resume domain alongside the existing profile domain. Resume records store only builder configuration (`name`, `template_id`, `sections_config`) while profile content remains the canonical source for underlying resume data. The UI is split into a real list page and a focused builder form page, both powered by server actions and validated with Zod.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Clerk, Supabase, Zod, Vitest

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `src/lib/resume.ts` | Resume template catalog, section constants, default-config helpers, reorder helper |
| `src/lib/actions/resume.ts` | Server actions for listing, creating, loading, and updating resumes |
| `src/components/resume/ResumeCreateButton.tsx` | Client action button to create a resume and redirect |
| `src/components/resume/ResumeBuilderForm.tsx` | Client builder form for name, template, and section config |
| `src/__tests__/resume.test.ts` | Unit tests for resume config schema helpers and reorder logic |

### Modified files
| File | Change |
|---|---|
| `src/lib/types.ts` | Add resume-related types |
| `src/lib/schemas.ts` | Add resume section/update schemas and exported types |
| `src/__tests__/schemas.test.ts` | Add failing tests for resume schemas |
| `src/app/dashboard/resumes/page.tsx` | Replace static mock with real resume list page |
| `src/app/dashboard/resume/[id]/page.tsx` | Implement builder page backed by server data |
| `CLAUDE.md` | Update implemented progress and active next phase |

---

### Task 1: Resume schema and helper foundations

**Files:**
- Create: `src/lib/resume.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/schemas.ts`
- Modify: `src/__tests__/schemas.test.ts`
- Create: `src/__tests__/resume.test.ts`

- [ ] **Step 1: Write the failing schema and helper tests**

Add tests to `src/__tests__/schemas.test.ts`:

```ts
import { resumeSectionSchema, resumeUpdateSchema } from '../lib/schemas'

describe('resumeSectionSchema', () => {
  it('accepts a valid section config row', () => {
    expect(() =>
      resumeSectionSchema.parse({
        id: 'summary',
        label: 'Summary',
        enabled: true,
        order: 0,
      })
    ).not.toThrow()
  })
})

describe('resumeUpdateSchema', () => {
  it('accepts a valid resume update payload', () => {
    expect(() =>
      resumeUpdateSchema.parse({
        name: 'Product Resume',
        template_id: 'modern-minimalist',
        sections_config: [
          { id: 'summary', label: 'Summary', enabled: true, order: 0 },
          { id: 'experience', label: 'Experience', enabled: true, order: 1 },
        ],
      })
    ).not.toThrow()
  })

  it('rejects duplicate section ids', () => {
    expect(() =>
      resumeUpdateSchema.parse({
        name: 'Duplicate Resume',
        template_id: 'modern-minimalist',
        sections_config: [
          { id: 'summary', label: 'Summary', enabled: true, order: 0 },
          { id: 'summary', label: 'Summary', enabled: false, order: 1 },
        ],
      })
    ).toThrow(/duplicate/i)
  })
})
```

Create `src/__tests__/resume.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildDefaultResumeSections, moveResumeSection } from '../lib/resume'

describe('buildDefaultResumeSections', () => {
  it('enables only sections that have profile content', () => {
    const sections = buildDefaultResumeSections({
      summary: 'Writes clearly',
      skills: ['TypeScript'],
      experiences: [],
      education: [],
      interests: [],
      miscellaneous: [],
    })

    expect(sections.find((section) => section.id === 'summary')?.enabled).toBe(true)
    expect(sections.find((section) => section.id === 'skills')?.enabled).toBe(true)
    expect(sections.find((section) => section.id === 'experience')?.enabled).toBe(false)
  })
})

describe('moveResumeSection', () => {
  it('reorders sections and rewrites order values', () => {
    const reordered = moveResumeSection(
      [
        { id: 'summary', label: 'Summary', enabled: true, order: 0 },
        { id: 'experience', label: 'Experience', enabled: true, order: 1 },
        { id: 'education', label: 'Education', enabled: true, order: 2 },
      ],
      'education',
      'up'
    )

    expect(reordered.map((section) => section.id)).toEqual([
      'summary',
      'education',
      'experience',
    ])
    expect(reordered.map((section) => section.order)).toEqual([0, 1, 2])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
npx vitest run src/__tests__/schemas.test.ts src/__tests__/resume.test.ts
```

Expected:
- FAIL because resume schemas/helpers do not exist yet

- [ ] **Step 3: Add resume types**

Update `src/lib/types.ts`:

```ts
export type ResumeSectionId =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'interests'
  | 'miscellaneous'

export interface ResumeSectionConfig {
  id: ResumeSectionId
  label: string
  enabled: boolean
  order: number
}

export interface ResumeRecord {
  id: string
  name: string
  template_id: string
  sections_config: ResumeSectionConfig[]
  updated_at: string
  created_at: string
}
```

- [ ] **Step 4: Add resume schemas**

Update `src/lib/schemas.ts`:

```ts
import type { ResumeSectionId } from './types'

const resumeSectionIds = [
  'summary',
  'experience',
  'education',
  'skills',
  'interests',
  'miscellaneous',
] as const satisfies readonly ResumeSectionId[]

export const resumeSectionSchema = z.object({
  id: z.enum(resumeSectionIds),
  label: z.string().min(1),
  enabled: z.boolean(),
  order: z.number().int().nonnegative(),
}).strip()

export const resumeUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Resume name is required'),
  template_id: z.enum(['modern-minimalist', 'executive-classic', 'academic-cv']),
  sections_config: z.array(resumeSectionSchema).superRefine((sections, ctx) => {
    const ids = new Set<string>()
    for (const section of sections) {
      if (ids.has(section.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate section id: ${section.id}`,
        })
      }
      ids.add(section.id)
    }
  }),
}).strip()

export type ResumeUpdateData = z.infer<typeof resumeUpdateSchema>
```

- [ ] **Step 5: Add resume helpers and template catalog**

Create `src/lib/resume.ts`:

```ts
import type { ProfileFormData } from './schemas'
import type { ResumeSectionConfig, ResumeSectionId } from './types'

export const resumeTemplates = [
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    category: 'Modern',
    description: 'Clean lines and generous white space for a contemporary professional look.',
  },
  {
    id: 'executive-classic',
    name: 'Executive Classic',
    category: 'Professional',
    description: 'Traditional gravitas with refined typographic hierarchy for senior roles.',
  },
  {
    id: 'academic-cv',
    name: 'Academic CV',
    category: 'Academic',
    description: 'Structured and comprehensive for academic and research positions.',
  },
] as const

const sectionDefinitions: Array<{ id: ResumeSectionId; label: string }> = [
  { id: 'summary', label: 'Summary' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'interests', label: 'Interests' },
  { id: 'miscellaneous', label: 'Additional' },
]

export function buildDefaultResumeSections(profile: Partial<ProfileFormData>): ResumeSectionConfig[] {
  return sectionDefinitions.map((section, index) => ({
    ...section,
    order: index,
    enabled:
      (section.id === 'summary' && Boolean(profile.summary?.trim())) ||
      (section.id === 'experience' && (profile.experiences?.length ?? 0) > 0) ||
      (section.id === 'education' && (profile.education?.length ?? 0) > 0) ||
      (section.id === 'skills' && (profile.skills?.length ?? 0) > 0) ||
      (section.id === 'interests' && (profile.interests?.length ?? 0) > 0) ||
      (section.id === 'miscellaneous' && (profile.miscellaneous?.length ?? 0) > 0),
  }))
}

export function moveResumeSection(
  sections: ResumeSectionConfig[],
  id: ResumeSectionId,
  direction: 'up' | 'down'
): ResumeSectionConfig[] {
  const ordered = [...sections].sort((a, b) => a.order - b.order)
  const index = ordered.findIndex((section) => section.id === id)
  if (index === -1) return ordered

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= ordered.length) return ordered

  const copy = [...ordered]
  const [section] = copy.splice(index, 1)
  copy.splice(targetIndex, 0, section)

  return copy.map((item, order) => ({ ...item, order }))
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run:
```bash
npx vitest run src/__tests__/schemas.test.ts src/__tests__/resume.test.ts
```

Expected:
- PASS

---

### Task 2: Resume server actions

**Files:**
- Create: `src/lib/actions/resume.ts`

- [ ] **Step 1: Write the failing tests for helper behavior only if needed**

No new server-action tests are required in this slice because the current test setup is unit-focused and the action logic depends on Supabase/Clerk. Coverage comes from Task 1 helper/schema tests plus manual verification.

- [ ] **Step 2: Add resume server actions**

Create `src/lib/actions/resume.ts`:

```ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { buildDefaultResumeSections, resumeTemplates } from '@/lib/resume'
import { resumeUpdateSchema } from '@/lib/schemas'
import { getProfile } from '@/lib/actions/profile'
import type { ResumeRecord } from '@/lib/types'

async function getCurrentUserRow() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const supabase = getSupabaseClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (error || !user) throw new Error('User not found in database')
  return { supabase, userId: user.id }
}

function mapResume(row: {
  id: string
  name: string
  template_id: string | null
  sections_config: unknown
  updated_at: string
  created_at: string
}): ResumeRecord {
  return {
    id: row.id,
    name: row.name,
    template_id: row.template_id ?? resumeTemplates[0].id,
    sections_config: resumeUpdateSchema.shape.sections_config.parse(
      row.sections_config ?? buildDefaultResumeSections({})
    ),
    updated_at: row.updated_at,
    created_at: row.created_at,
  }
}

export async function listResumes(): Promise<ResumeRecord[]> {
  const { supabase, userId } = await getCurrentUserRow()
  const { data, error } = await supabase
    .from('resumes')
    .select('id, name, template_id, sections_config, updated_at, created_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`Failed to load resumes: ${error.message}`)
  return (data ?? []).map(mapResume)
}

export async function getResume(id: string): Promise<ResumeRecord> {
  const { supabase, userId } = await getCurrentUserRow()
  const { data, error } = await supabase
    .from('resumes')
    .select('id, name, template_id, sections_config, updated_at, created_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) notFound()
  return mapResume(data)
}

export async function createResume() {
  const { supabase, userId } = await getCurrentUserRow()
  const profile = await getProfile()
  const sections = buildDefaultResumeSections(profile ?? {})

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      name: `Resume ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      template_id: resumeTemplates[0].id,
      sections_config: sections,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create resume: ${error?.message}`)

  revalidatePath('/dashboard/resumes')
  return data.id as string
}

export async function updateResume(id: string, payload: unknown) {
  const parsed = resumeUpdateSchema.parse(payload)
  const { supabase, userId } = await getCurrentUserRow()

  const { error } = await supabase
    .from('resumes')
    .update({
      name: parsed.name,
      template_id: parsed.template_id,
      sections_config: parsed.sections_config,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to save resume: ${error.message}`)

  revalidatePath('/dashboard/resumes')
  revalidatePath(`/dashboard/resume/${id}`)
}
```

- [ ] **Step 3: Confirm types compile via targeted tests**

Run:
```bash
npx vitest run src/__tests__/schemas.test.ts src/__tests__/resume.test.ts
```

Expected:
- PASS

---

### Task 3: Real resumes list page

**Files:**
- Create: `src/components/resume/ResumeCreateButton.tsx`
- Modify: `src/app/dashboard/resumes/page.tsx`

- [ ] **Step 1: Add the create button client component**

Create `src/components/resume/ResumeCreateButton.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { createResume } from '@/lib/actions/resume'

export function ResumeCreateButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleCreate() {
    setPending(true)
    try {
      const id = await createResume()
      router.push(`/dashboard/resume/${id}`)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      {pending ? 'Creating…' : 'Create resume'}
    </button>
  )
}
```

- [ ] **Step 2: Replace the static resumes page with a data-backed list**

Update `src/app/dashboard/resumes/page.tsx`:

```tsx
import Link from 'next/link'
import { listResumes } from '@/lib/actions/resume'
import { resumeTemplates } from '@/lib/resume'
import { ResumeCreateButton } from '@/components/resume/ResumeCreateButton'

function getTemplateName(templateId: string) {
  return resumeTemplates.find((template) => template.id === templateId)?.name ?? 'Unknown template'
}

export default async function ResumesPage() {
  const resumes = await listResumes()

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Resume Builder
          </p>
          <h1 className="font-display text-4xl font-bold text-foreground">Your resumes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create focused versions of your profile for different roles. Template previews and PDF export come next.
          </p>
        </div>
        <ResumeCreateButton />
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10">
          <h2 className="font-display text-2xl font-semibold">No resumes yet</h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Start with your saved profile and tailor the sections for a specific application.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ResumeCreateButton />
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Review profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resumes.map((resume) => {
            const enabledCount = resume.sections_config.filter((section) => section.enabled).length
            return (
              <Link
                key={resume.id}
                href={`/dashboard/resume/${resume.id}`}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {getTemplateName(resume.template_id)}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-foreground">
                  {resume.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {enabledCount} section{enabledCount === 1 ? '' : 's'} enabled
                </p>
                <p className="mt-6 text-xs text-muted-foreground">
                  Updated {new Date(resume.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Manually verify the page renders without static mock content**

Run:
```bash
npm run lint
```

Expected:
- No lint errors from the new list page/button

---

### Task 4: Resume builder detail page

**Files:**
- Create: `src/components/resume/ResumeBuilderForm.tsx`
- Modify: `src/app/dashboard/resume/[id]/page.tsx`

- [ ] **Step 1: Create the builder form**

Create `src/components/resume/ResumeBuilderForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Loader2, ArrowDown, ArrowUp } from 'lucide-react'
import { updateResume } from '@/lib/actions/resume'
import { moveResumeSection, resumeTemplates } from '@/lib/resume'
import type { ResumeRecord } from '@/lib/types'

interface Props {
  resume: ResumeRecord
}

export function ResumeBuilderForm({ resume }: Props) {
  const [name, setName] = useState(resume.name)
  const [templateId, setTemplateId] = useState(resume.template_id)
  const [sections, setSections] = useState(
    [...resume.sections_config].sort((a, b) => a.order - b.order)
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      await updateResume(resume.id, {
        name,
        template_id: templateId,
        sections_config: sections,
      })
      setMessage('Saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resume')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Resume
              </p>
              <h1 className="font-display text-3xl font-bold">Builder</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          <label className="block text-sm font-medium text-foreground">
            Resume name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl font-semibold">Template</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {resumeTemplates.map((template) => {
              const active = template.id === templateId
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {template.category}
                  </p>
                  <p className="mt-2 font-semibold">{template.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{template.description}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl font-semibold">Sections</h2>
          <div className="mt-4 space-y-3">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="flex items-center gap-4 rounded-xl border border-border px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={(event) =>
                    setSections((current) =>
                      current.map((item) =>
                        item.id === section.id ? { ...item, enabled: event.target.checked } : item
                      )
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{section.label}</p>
                  <p className="text-xs text-muted-foreground">Order {index + 1}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSections((current) => moveResumeSection(current, section.id, 'up'))}
                    disabled={index === 0}
                    className="rounded-md border border-border p-2 hover:bg-muted disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSections((current) => moveResumeSection(current, section.id, 'down'))}
                    disabled={index === sections.length - 1}
                    className="rounded-md border border-border p-2 hover:bg-muted disabled:opacity-40"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Summary
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold">Current setup</h2>
        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Template</dt>
            <dd className="mt-1 font-medium">
              {resumeTemplates.find((template) => template.id === templateId)?.name}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Enabled sections</dt>
            <dd className="mt-1 font-medium">
              {sections.filter((section) => section.enabled).length} of {sections.length}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-muted-foreground">
          PDF preview and export land in the next builder phase. This step defines the structure and template selection now.
        </p>
      </aside>
    </div>
  )
}
```

- [ ] **Step 2: Implement the builder page**

Update `src/app/dashboard/resume/[id]/page.tsx`:

```tsx
import Link from 'next/link'
import { getResume } from '@/lib/actions/resume'
import { ResumeBuilderForm } from '@/components/resume/ResumeBuilderForm'

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const resume = await getResume(id)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <Link href="/dashboard/resumes" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to resumes
        </Link>
      </div>
      <ResumeBuilderForm resume={resume} />
    </div>
  )
}
```

- [ ] **Step 3: Run lint to verify UI files are clean**

Run:
```bash
npm run lint
```

Expected:
- No lint errors

---

### Task 5: Update project guidance and verify the full slice

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md to reflect actual current status**

Make these edits:
- mark auth/core layout/onboarding/profile as implemented
- mark resume upload/import as implemented
- mark LinkedIn/GitHub import and AWS infrastructure as still pending
- add resume builder foundation as in progress/implemented for this slice

- [ ] **Step 2: Run the full verification suite**

Run:
```bash
npm test
npm run lint
```

Expected:
- all tests PASS
- lint exits 0

- [ ] **Step 3: Review requirement coverage**

Check each acceptance criterion from the spec against the implemented files:
- list page uses real Supabase data
- create button redirects to builder page
- builder page saves name/template/sections
- `CLAUDE.md` reflects progress

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md src/lib/types.ts src/lib/schemas.ts src/lib/resume.ts src/lib/actions/resume.ts src/components/resume/ResumeCreateButton.tsx src/components/resume/ResumeBuilderForm.tsx src/app/dashboard/resumes/page.tsx src/app/dashboard/resume/[id]/page.tsx src/__tests__/schemas.test.ts src/__tests__/resume.test.ts docs/superpowers/plans/2026-04-03-resume-builder-foundation.md
git commit -m "feat: add resume builder foundation"
```
