# Resume Import Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a resume upload + review step to onboarding so users can bootstrap their profile from an existing PDF, DOCX, or TXT file, with a confirm-before-save review card.

**Architecture:** Client-side text extraction (pdfjs-dist for PDF, mammoth for DOCX, FileReader for TXT — all already installed) feeds the existing `/api/parse-resume` endpoint. A new `ResumeImportStep` component manages the upload+processing UX; `ParsedResumeReview` handles the confirm step. `OnboardingClient` is rewired so "Upload" goes to the new step 2 and "Scratch" completes onboarding immediately.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest (node env), pdfjs-dist (already installed), mammoth (already installed), Clerk (`completeOnboarding` server action), Supabase (`saveProfile` server action).

**Spec deviation:** The design spec proposed a `/api/extract-resume` server route, but the codebase already has client-side extraction working in `ResumeUpload.tsx`. This plan reuses that approach — no new API route is needed.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/extract-resume-text.ts` | Pure function: `File → Promise<string>`. Handles PDF, DOCX, TXT. Testable in isolation. |
| Create | `src/__tests__/extract-resume-text.test.ts` | Unit tests for the extraction utility. |
| Create | `src/components/onboarding/ResumeImportStep.tsx` | Upload card with drag-drop, 3-state UI (idle → processing → done), calls extract util then parse API, emits `onParsed`. |
| Create | `src/components/onboarding/ParsedResumeReview.tsx` | Review card: shows parsed summary, "Import to Profile" / "Edit first" / reset actions. |
| Modify | `src/app/onboarding/OnboardingClient.tsx` | Rewire step 1: Upload → step=2 (new import step). Scratch → `completeOnboarding()` + redirect. Step 2 → renders `ResumeImportStep` + `ParsedResumeReview`. |
| Modify | `src/components/profile/ProfileForm.tsx` | On mount: check `sessionStorage["pendingProfile"]`, call existing `applyParsed()`, clear key. |

---

## Task 1: Text extraction utility

**Files:**
- Create: `src/lib/extract-resume-text.ts`
- Create: `src/__tests__/extract-resume-text.test.ts`

This extracts the browser text-extraction logic from `ResumeUpload.tsx` into a standalone, testable function. TXT files are newly supported here.

- [ ] **Step 1.1: Write the failing tests**

```ts
// src/__tests__/extract-resume-text.test.ts
import { describe, it, expect } from 'vitest'
import { extractResumeText } from '../lib/extract-resume-text'

function makeFile(content: string, name: string, type: string): File {
  return new File([content], name, { type })
}

describe('extractResumeText', () => {
  it('extracts text from a plain-text file', async () => {
    const file = makeFile('John Doe\nSoftware Engineer', 'resume.txt', 'text/plain')
    const text = await extractResumeText(file)
    expect(text).toContain('John Doe')
    expect(text).toContain('Software Engineer')
  })

  it('throws on an unsupported file type', async () => {
    const file = makeFile('...', 'resume.jpg', 'image/jpeg')
    await expect(extractResumeText(file)).rejects.toThrow('Unsupported file type')
  })

  it('caps output at 20 000 characters', async () => {
    const longText = 'x'.repeat(30_000)
    const file = makeFile(longText, 'resume.txt', 'text/plain')
    const text = await extractResumeText(file)
    expect(text.length).toBeLessThanOrEqual(20_000)
  })
})
```

- [ ] **Step 1.2: Run tests to verify they fail**

```bash
cd /Users/dandan/Desktop/Projects/UniSync
npx vitest run src/__tests__/extract-resume-text.test.ts
```

Expected: FAIL — `Cannot find module '../lib/extract-resume-text'`

- [ ] **Step 1.3: Create the extraction utility**

```ts
// src/lib/extract-resume-text.ts
const MAX_CHARS = 20_000

export async function extractResumeText(file: File): Promise<string> {
  const type = file.type || ''
  const name = file.name.toLowerCase()

  if (type === 'text/plain' || name.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(((e.target?.result as string) ?? '').slice(0, MAX_CHARS))
      reader.onerror = () => reject(new Error('Failed to read text file'))
      reader.readAsText(file)
    })
  }

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n'
    }
    return text.slice(0, MAX_CHARS)
  }

  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value.slice(0, MAX_CHARS)
  }

  throw new Error('Unsupported file type — try PDF, DOCX, or TXT')
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/extract-resume-text.test.ts
```

Expected: all 3 tests PASS. Note: the TXT tests use `FileReader` which vitest's node env provides via happy-dom. If `FileReader is not defined`, add `// @vitest-environment happy-dom` as the first line of the test file and re-run.

- [ ] **Step 1.5: Commit**

```bash
git add src/lib/extract-resume-text.ts src/__tests__/extract-resume-text.test.ts
git commit -m "feat: add extract-resume-text utility with TXT/PDF/DOCX support"
```

---

## Task 2: `ParsedResumeReview` component

**Files:**
- Create: `src/components/onboarding/ParsedResumeReview.tsx`

Shows the parsed resume summary and handles the three user actions: import, edit-first, reset.

- [ ] **Step 2.1: Create the component**

```tsx
// src/components/onboarding/ParsedResumeReview.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { saveProfile } from '@/lib/actions/profile'
import { completeOnboarding } from '@/lib/actions/user'
import type { ParsedResume } from '@/lib/schemas'

interface Props {
  data: ParsedResume
  onReset: () => void
}

export function ParsedResumeReview({ data, onReset }: Props) {
  const router = useRouter()
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMinimal = !data.name && !data.experiences?.length

  const summaryExcerpt = data.summary
    ? data.summary.slice(0, 120) + (data.summary.length > 120 ? '…' : '')
    : null

  async function handleImport() {
    setImporting(true)
    setError(null)
    try {
      await saveProfile({
        name: data.name ?? '',
        headline: data.headline ?? '',
        location: data.location ?? '',
        summary: data.summary ?? '',
        skills: data.skills ?? [],
        interests: data.interests ?? [],
        miscellaneous: data.miscellaneous ?? [],
        experiences: data.experiences ?? [],
        education: data.education ?? [],
      })
      await completeOnboarding()
      router.push('/dashboard/profile')
    } catch {
      setError('Something went wrong. Please try again.')
      setImporting(false)
    }
  }

  async function handleEditFirst() {
    sessionStorage.setItem('pendingProfile', JSON.stringify(data))
    await completeOnboarding()
    router.push('/dashboard/profile')
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
      {isMinimal && (
        <p className="text-sm text-muted-foreground bg-muted rounded-md px-4 py-3">
          We couldn&apos;t extract much from this file — you can fill in the rest manually.
        </p>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-lg">{data.name || 'Name not found'}</p>
          {data.headline && <p className="text-sm text-muted-foreground">{data.headline}</p>}
          {data.location && <p className="text-xs text-muted-foreground">{data.location}</p>}
        </div>
        <span className="shrink-0 text-xs font-semibold bg-green-100 text-green-800 rounded-full px-3 py-1">
          Parsed
        </span>
      </div>

      {summaryExcerpt && (
        <p className="text-sm text-muted-foreground border-t border-border pt-4">{summaryExcerpt}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {(data.experiences?.length ?? 0) > 0 && (
          <span className="text-xs font-medium bg-muted rounded-full px-3 py-1">
            {data.experiences!.length} experience{data.experiences!.length !== 1 ? 's' : ''}
          </span>
        )}
        {(data.education?.length ?? 0) > 0 && (
          <span className="text-xs font-medium bg-muted rounded-full px-3 py-1">
            {data.education!.length} education
          </span>
        )}
        {(data.skills?.length ?? 0) > 0 && (
          <span className="text-xs font-medium bg-muted rounded-full px-3 py-1">
            {data.skills!.length} skills
          </span>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleImport}
          disabled={importing}
          className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {importing && <Loader2 className="h-4 w-4 animate-spin" />}
          {importing ? 'Importing…' : 'Import to Profile'}
        </button>
        <button
          onClick={handleEditFirst}
          disabled={importing}
          className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          Edit first
        </button>
      </div>

      <button
        onClick={onReset}
        disabled={importing}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Upload a different file
      </button>
    </div>
  )
}
```

- [ ] **Step 2.2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.3: Commit**

```bash
git add src/components/onboarding/ParsedResumeReview.tsx
git commit -m "feat: add ParsedResumeReview component"
```

---

## Task 3: `ResumeImportStep` component

**Files:**
- Create: `src/components/onboarding/ResumeImportStep.tsx`

Manages the upload card UI (idle → processing → calls `onParsed`). Drag-and-drop plus click-to-browse. Shows three visual progress steps during processing.

- [ ] **Step 3.1: Create the component**

```tsx
// src/components/onboarding/ResumeImportStep.tsx
'use client'

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { extractResumeText } from '@/lib/extract-resume-text'
import type { ParsedResume } from '@/lib/schemas'

type Step = 'idle' | 'uploading' | 'extracting' | 'parsing' | 'error'

interface Props {
  onParsed: (data: ParsedResume) => void
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export function ResumeImportStep({ onParsed }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    if (file.size > MAX_BYTES) {
      setErrorMsg('File too large — max 5 MB')
      return
    }

    setErrorMsg(null)
    setStep('uploading')

    let text: string
    try {
      setStep('extracting')
      text = await extractResumeText(file)
    } catch (err) {
      setStep('error')
      setErrorMsg(err instanceof Error ? err.message : "Couldn't read this file. Try a different format.")
      return
    }

    setStep('parsing')
    try {
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('Parse failed')
      const parsed: ParsedResume = await res.json()
      onParsed(parsed)
    } catch {
      setStep('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() { setDragging(false) }

  const isProcessing = step === 'uploading' || step === 'extracting' || step === 'parsing'

  function retry() {
    setStep('idle')
    setErrorMsg(null)
  }

  if (isProcessing) {
    return (
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-8 space-y-4">
        <div className="space-y-3">
          {[
            { label: 'File received', done: step !== 'uploading' },
            { label: 'Text extracted', done: step === 'parsing' },
            { label: 'Parsing with AI…', done: false, active: step === 'parsing' },
          ].map(({ label, done, active }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              {done ? (
                <span className="text-green-600 font-bold w-5">✓</span>
              ) : active ? (
                <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
              ) : (
                <span className="w-5 text-muted-foreground">○</span>
              )}
              <span className={done ? 'text-green-700' : active ? 'font-medium' : 'text-muted-foreground'}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Usually takes 3–5 seconds</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="sr-only"
        aria-label="Upload resume"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary hover:bg-primary/5'}
          ${step === 'error' ? 'border-destructive/50' : ''}`}
      >
        <Upload className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-semibold">Drop your resume here</p>
          <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, or TXT · max 5 MB</p>
        </div>
        <span className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground pointer-events-none">
          Choose file
        </span>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between rounded-md bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{errorMsg}</p>
          <button onClick={retry} className="text-xs font-semibold text-destructive hover:underline ml-4">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3.2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/components/onboarding/ResumeImportStep.tsx
git commit -m "feat: add ResumeImportStep upload component"
```

---

## Task 4: `ProfileForm` — sessionStorage pre-fill

**Files:**
- Modify: `src/components/profile/ProfileForm.tsx`

On mount, check `sessionStorage["pendingProfile"]`. If present, call the already-existing `applyParsed()` to merge it into form state, then clear the key.

- [ ] **Step 4.1: Add `useEffect` import and sessionStorage check**

In `src/components/profile/ProfileForm.tsx`, add `useEffect` to the existing React import:

```ts
import { useState, useEffect } from 'react'
```

Then add this block immediately after all the `useState` declarations (before `applyParsed`):

```ts
  useEffect(() => {
    const raw = sessionStorage.getItem('pendingProfile')
    if (!raw) return
    sessionStorage.removeItem('pendingProfile')
    try {
      const pending = JSON.parse(raw)
      applyParsed(pending)
    } catch {
      // malformed JSON — ignore silently
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4.2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.3: Commit**

```bash
git add src/components/profile/ProfileForm.tsx
git commit -m "feat: pre-fill ProfileForm from sessionStorage pendingProfile"
```

---

## Task 5: Wire up `OnboardingClient`

**Files:**
- Modify: `src/app/onboarding/OnboardingClient.tsx`

Rewire step 1 and step 2. Step 1 "Upload" navigates to `step=2`. Step 1 "Scratch" calls `completeOnboarding` and redirects directly to `/dashboard/profile`. Step 2 renders `ResumeImportStep`; when parsed, shows `ParsedResumeReview` inline.

- [ ] **Step 5.1: Replace `OnboardingClient.tsx`**

```tsx
// src/app/onboarding/OnboardingClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { completeOnboarding } from '@/lib/actions/user'
import { ResumeImportStep } from '@/components/onboarding/ResumeImportStep'
import { ParsedResumeReview } from '@/components/onboarding/ParsedResumeReview'
import type { ParsedResume } from '@/lib/schemas'

export function OnboardingClient({ initialStep }: { initialStep: string }) {
  const router = useRouter()
  const [skipping, setSkipping] = useState(false)
  const [parsed, setParsed] = useState<ParsedResume | null>(null)

  async function handleScratch() {
    setSkipping(true)
    try {
      await completeOnboarding()
      router.push('/dashboard/profile')
    } finally {
      setSkipping(false)
    }
  }

  // Step 2: import flow
  if (initialStep === '2') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Step 2 of 3</p>
            <h1 className="font-display text-3xl font-bold">Import your experience</h1>
            <p className="text-muted-foreground mt-2">
              We&apos;ll extract your history and let you review it before saving.
            </p>
          </div>

          {parsed ? (
            <ParsedResumeReview data={parsed} onReset={() => setParsed(null)} />
          ) : (
            <>
              <ResumeImportStep onParsed={setParsed} />
              <div className="text-center">
                <button
                  onClick={handleScratch}
                  disabled={skipping}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {skipping ? 'Redirecting…' : 'Skip — I\'ll fill this in manually'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Step 1: choose path (default / step=1)
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Step 1 of 3</p>
          <h1 className="font-display text-3xl font-bold">How do you want to start?</h1>
          <p className="text-muted-foreground mt-2">You can always add more later.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push('/onboarding?step=2')}
            className="rounded-xl border-2 border-border p-6 text-left hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="text-2xl mb-3">📄</div>
            <h2 className="font-semibold">Upload your resume</h2>
            <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, or TXT — we&apos;ll extract your info automatically.</p>
          </button>
          <button
            onClick={handleScratch}
            disabled={skipping}
            className="rounded-xl border-2 border-border p-6 text-left hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
          >
            {skipping ? <Loader2 className="h-6 w-6 animate-spin mb-3" /> : <div className="text-2xl mb-3">✏️</div>}
            <h2 className="font-semibold">Start from scratch</h2>
            <p className="text-sm text-muted-foreground mt-1">Fill in your details directly.</p>
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5.2: Verify TypeScript and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: no type errors, build succeeds with all routes present including `/onboarding`.

- [ ] **Step 5.3: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5.4: Commit**

```bash
git add src/app/onboarding/OnboardingClient.tsx
git commit -m "feat: wire resume import step into onboarding flow"
```

---

## Task 6: Manual acceptance testing

Work through each acceptance criterion from the spec. Do this against the local dev server (`npm run dev`).

- [ ] **Step 6.1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 6.2: Test upload path (PDF)**

1. Sign up for a new account (or use a test account that hasn't completed onboarding — reset `onboarding_completed = false` in Supabase if needed)
2. Complete step 1 → click "Upload your resume"
3. Drop a real PDF onto the upload card
4. Verify the three processing steps appear: "File received ✓" → "Text extracted ✓" → "Parsing with AI… ⟳"
5. Verify the review card appears with name, headline, experience/education/skill counts
6. Click "Import to Profile"
7. Verify you land on `/dashboard/profile` with the form pre-populated and saved

- [ ] **Step 6.3: Test "Edit first" path**

1. Repeat steps 1–5 above
2. Click "Edit first" instead
3. Verify you land on `/dashboard/profile` with the form pre-populated but **not yet saved** (save button still says "Save changes")
4. Change a field and click "Save changes" — verify it saves

- [ ] **Step 6.4: Test "Start from scratch" on step 1**

1. Go to `/onboarding` (reset onboarding if needed)
2. Click "Start from scratch"
3. Verify you land on `/dashboard/profile` with an empty form

- [ ] **Step 6.5: Test "Skip" link on step 2**

1. Navigate to `/onboarding?step=2`
2. Click "Skip — I'll fill this in manually"
3. Verify you land on `/dashboard/profile` with an empty form

- [ ] **Step 6.6: Test file errors**

1. Try uploading a `.jpg` file → expect "Unsupported file type" error inline
2. Try uploading a file > 5 MB → expect "File too large — max 5 MB" error inline
3. Verify the Retry button resets the upload card

- [ ] **Step 6.7: Test DOCX upload**

Drop a real `.docx` file and verify the review card appears.

- [ ] **Step 6.8: Test TXT upload**

Drop a plain `.txt` resume and verify the review card appears.

- [ ] **Step 6.9: Final commit**

```bash
git add -A
git commit -m "feat: resume import pipeline — onboarding upload + review flow complete"
```
