# Manual Editing Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the manual editing dashboard at `/dashboard/resume/[id]` so it matches the Stitch `Resume Editor (Neutral)` screen while preserving the current resume editing behavior.

**Architecture:** Keep the existing route, loader, and server action flow intact, and replace the current generic editor card stack with a Stitch-aligned editorial workspace. The implementation is centered in the resume detail page and `ResumeBuilderForm`, with only minimal token or utility styling added if necessary to express the paper-on-glass visual system.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest

---

## File Structure

- Modify: `src/components/resume/ResumeBuilderForm.tsx`
  - Replace the stacked-card layout with the Stitch-first editorial builder workspace while preserving existing editing behavior.
- Modify: `src/app/dashboard/resume/[id]/page.tsx`
  - Align page framing and outer spacing with the Stitch editor layout.
- Create or modify: `src/__tests__/resume-builder-form.test.tsx`
  - Add focused tests for the manual editing dashboard interactions and persisted payload shape.
- Modify only if required: `src/app/globals.css`
  - Add minimal shared utility styling if the existing design tokens are insufficient for the Stitch-aligned editor surface treatments.

### Task 1: Cover Resume Builder Interactions With Tests

**Files:**
- Test: `src/__tests__/resume-builder-form.test.tsx`
- Modify: `src/components/resume/ResumeBuilderForm.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ResumeBuilderForm } from '@/components/resume/ResumeBuilderForm'

const updateResume = vi.fn()

vi.mock('@/lib/actions/resume', () => ({
  updateResume: (...args: unknown[]) => updateResume(...args),
}))

const resume = {
  id: 'resume-1',
  user_id: 'user-1',
  name: 'Spring 2026 Resume',
  template_id: 'modern',
  sections_config: [
    { id: 'summary', label: 'Professional Summary', order: 0, enabled: true },
    { id: 'experience', label: 'Experience', order: 1, enabled: true },
    { id: 'projects', label: 'Projects', order: 2, enabled: false },
  ],
  created_at: '2026-04-03T00:00:00.000Z',
  updated_at: '2026-04-03T00:00:00.000Z',
}

describe('ResumeBuilderForm', () => {
  beforeEach(() => {
    updateResume.mockReset()
    updateResume.mockResolvedValue(undefined)
  })

  it('submits the edited name, template, and reordered sections when saving', async () => {
    render(<ResumeBuilderForm resume={resume} />)

    fireEvent.change(screen.getByDisplayValue('Spring 2026 Resume'), {
      target: { value: 'Editorial Resume' },
    })

    fireEvent.click(screen.getByRole('button', { name: /classic/i }))
    fireEvent.click(screen.getByRole('button', { name: /move projects up/i }))

    const projectsToggle = screen.getByRole('checkbox', { name: /projects/i })
    fireEvent.click(projectsToggle)

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(updateResume).toHaveBeenCalledWith('resume-1', {
        name: 'Editorial Resume',
        template_id: 'classic',
        sections_config: [
          expect.objectContaining({ id: 'summary', order: 0, enabled: true }),
          expect.objectContaining({ id: 'projects', order: 1, enabled: true }),
          expect.objectContaining({ id: 'experience', order: 2, enabled: true }),
        ],
      })
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/resume-builder-form.test.tsx`
Expected: FAIL because the current component does not expose stable accessible controls for the Stitch-shaped editor interactions yet.

- [ ] **Step 3: Write minimal implementation to satisfy the interaction contract**

```tsx
<button
  type="button"
  onClick={() => setTemplateId(template.id)}
  aria-pressed={active}
  aria-label={template.name}
>
  ...
</button>

<input
  id={`section-${section.id}`}
  type="checkbox"
  aria-label={section.label}
  checked={section.enabled}
  onChange={...}
/>

<button
  type="button"
  aria-label={`Move ${section.label} up`}
  onClick={...}
>
  ...
</button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/resume-builder-form.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/resume-builder-form.test.tsx src/components/resume/ResumeBuilderForm.tsx
git commit -m "test: cover manual editing dashboard interactions"
```

### Task 2: Rebuild The Resume Detail Page Framing

**Files:**
- Modify: `src/app/dashboard/resume/[id]/page.tsx`
- Test: `src/__tests__/resume-builder-form.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('renders the editor within the stitch-style dashboard frame', () => {
  render(<ResumeBuilderForm resume={resume} />)

  expect(screen.getByText(/manual editing/i)).toBeInTheDocument()
  expect(screen.getByText(/back to resumes/i)).toBeInTheDocument()
  expect(screen.getByText(/current setup/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/resume-builder-form.test.tsx`
Expected: FAIL because the current editor does not provide the Stitch-aligned framing copy and structure.

- [ ] **Step 3: Update the page framing**

```tsx
return (
  <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-10 lg:px-10">
    <ResumeBuilderForm resume={resume} />
  </div>
)
```
```tsx
<header className="space-y-4">
  <Link href="/dashboard/resumes" ...>
    Back to resumes
  </Link>
  <div className="space-y-2">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-on-surface-variant)]">
      Manual editing
    </p>
    <h1 className="font-display text-4xl text-[color:var(--color-on-surface)]">
      Shape the final resume
    </h1>
  </div>
</header>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/resume-builder-form.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/resume/[id]/page.tsx src/__tests__/resume-builder-form.test.tsx
git commit -m "feat: frame resume editor as editorial workspace"
```

### Task 3: Rebuild `ResumeBuilderForm` To Match The Stitch Editor

**Files:**
- Modify: `src/components/resume/ResumeBuilderForm.tsx`
- Modify if needed: `src/app/globals.css`
- Test: `src/__tests__/resume-builder-form.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('shows the stitch-style paper summary with live configuration details', () => {
  render(<ResumeBuilderForm resume={resume} />)

  expect(screen.getByText(/selected template/i)).toBeInTheDocument()
  expect(screen.getByText(/enabled sections/i)).toBeInTheDocument()
  expect(screen.getByText(/pdf preview and export arrive in the next phase/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/resume-builder-form.test.tsx`
Expected: FAIL because the current aside content and labels do not match the planned Stitch-first editor composition.

- [ ] **Step 3: Rebuild the form with the approved layout**

```tsx
return (
  <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
    <div className="space-y-8">
      <header className="rounded-[28px] bg-[color:var(--color-surface-container-low)] p-8">
        ...
      </header>

      <section className="rounded-[28px] bg-[color:var(--color-surface-container-low)] p-6 md:p-8">
        ...
      </section>

      <section className="rounded-[28px] bg-[color:var(--color-surface-container)] p-6 md:p-8">
        ...
      </section>
    </div>

    <aside className="paper-shadow rounded-[32px] bg-[color:var(--color-surface-container-lowest)] p-8">
      ...
    </aside>
  </div>
)
```
```css
.paper-shadow {
  box-shadow: 0 8px 32px rgba(45, 52, 53, 0.04);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/__tests__/resume-builder-form.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/resume/ResumeBuilderForm.tsx src/app/globals.css src/__tests__/resume-builder-form.test.tsx
git commit -m "feat: implement stitch-first manual editing dashboard"
```

### Task 4: Verify The Affected Surface

**Files:**
- Modify if needed: `src/components/resume/ResumeBuilderForm.tsx`
- Modify if needed: `src/app/dashboard/resume/[id]/page.tsx`
- Test: `src/__tests__/resume-builder-form.test.tsx`

- [ ] **Step 1: Run the focused test suite**

Run: `npm test -- src/__tests__/resume-builder-form.test.tsx`
Expected: PASS

- [ ] **Step 2: Run the broader related test suite**

Run: `npm test -- src/__tests__/resume.test.ts src/__tests__/schemas.test.ts`
Expected: PASS

- [ ] **Step 3: Start the app and visually inspect the resume editor route**

Run: `npm run dev`
Expected: Next.js starts locally and `/dashboard/resume/[id]` shows the Stitch-aligned editorial editor without layout regressions.

- [ ] **Step 4: Apply minimal fixes if the visual check reveals issues**

```tsx
className="min-w-0 rounded-[20px] bg-[color:var(--color-surface-container-lowest)]/80 ..."
```

- [ ] **Step 5: Commit**

```bash
git add src/components/resume/ResumeBuilderForm.tsx src/app/dashboard/resume/[id]/page.tsx src/__tests__/resume-builder-form.test.tsx src/app/globals.css
git commit -m "fix: polish stitch-aligned resume editor layout"
```

## Spec Coverage Check

- Stitch-first `Resume Editor (Neutral)` alignment: covered by Tasks 2 and 3.
- Preserve route and behavior: covered by Tasks 1 and 2.
- Keep save, rename, template selection, section toggles, and reordering: covered by Task 1 and Task 3.
- Minimal shared styling only if needed: covered by Task 3.
- Verification of affected surface: covered by Task 4.

## Placeholder Scan

No `TODO`, `TBD`, or deferred implementation placeholders remain. The plan keeps scope limited to the resume editor and verification of that surface.

## Type Consistency Check

The plan consistently refers to `ResumeBuilderForm`, `updateResume`, `template_id`, and `sections_config`, matching the existing code.
