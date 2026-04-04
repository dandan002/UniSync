'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
import { updateResume } from '@/lib/actions/resume'
import { moveResumeSection, resumeTemplates } from '@/lib/resume'
import { ResumePreview } from '@/components/resume/ResumePreview'
import type { ProfileFormData } from '@/lib/schemas'
import type { ResumeRecord } from '@/lib/types'

interface Props {
  resume: ResumeRecord
  profile: Partial<ProfileFormData & { name: string }>
}

export function ResumeBuilderForm({ resume, profile }: Props) {
  const [name, setName] = useState(resume.name)
  const [templateId, setTemplateId] = useState(resume.template_id)
  const [sections, setSections] = useState(
    [...resume.sections_config].sort((a, b) => a.order - b.order)
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selectedTemplate = resumeTemplates.find((template) => template.id === templateId)
  const enabledSections = sections.filter((section) => section.enabled)

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
<<<<<<< HEAD
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
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
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save changes'}
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
=======
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
      <div className="space-y-8">
        <section className="rounded-[28px] bg-[color:var(--color-surface-container-low)] p-6 md:p-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-on-surface-variant)]">
                    Resume builder
>>>>>>> 180f651 (fix)
                  </p>
                  <h2 className="font-display text-3xl font-bold">Builder</h2>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-[color:var(--color-on-surface-variant)]">
                  Refine the editorial structure before preview and export. This workspace keeps the
                  composition focused on naming, template direction, and section order.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 lg:items-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {message && <p className="text-sm text-sky-700">{message}</p>}
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-on-surface-variant)]">
                Resume name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-4 w-full rounded-[24px] bg-[color:var(--color-surface-container-lowest)] px-5 py-5 font-display text-3xl font-semibold tracking-tight text-[color:var(--color-on-surface)] outline-none transition-shadow placeholder:text-[color:var(--color-on-surface-variant)] focus:ring-2 focus:ring-sky-200"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[28px] bg-[color:var(--color-surface-container-low)] p-6 md:p-8">
          <fieldset className="flex flex-col gap-6">
            <legend className="sr-only">Resume template</legend>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-on-surface-variant)]">
                Template gallery
              </p>
              <h3 className="font-display text-2xl font-semibold text-[color:var(--color-on-surface)]">
                Choose the page voice
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-[color:var(--color-on-surface-variant)]">
                Each template keeps the same content contract, but shifts the pacing and typographic
                emphasis of the final document.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {resumeTemplates.map((template) => {
                const active = template.id === templateId
                return (
                  <label
                    key={template.id}
                    className={`rounded-[24px] p-5 text-left transition-all ${
                      active
                        ? 'bg-[color:var(--color-surface-container-lowest)] text-[color:var(--color-on-surface)] shadow-[0_18px_40px_-28px_rgba(45,52,53,0.45)] ring-1 ring-sky-200'
                        : 'bg-[color:var(--color-surface-container)] text-[color:var(--color-on-surface)] hover:bg-[color:var(--color-surface-container-high)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume-template"
                      value={template.id}
                      checked={active}
                      onChange={() => setTemplateId(template.id)}
                      className="sr-only"
                    />
                    <div className="rounded-[18px] bg-[color:var(--color-surface-container-low)] px-4 py-5">
                      <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-outline)]">
                        {active ? 'Selected' : 'Template'}
                      </span>
                      <div className="mt-4 h-24 rounded-[14px] bg-gradient-to-br from-white via-[color:var(--color-surface-container-low)] to-[color:var(--color-surface-container)]" />
                    </div>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-on-surface-variant)]">
                      {template.category}
                    </p>
                    <p className="mt-2 font-display text-xl font-semibold">{template.name}</p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--color-on-surface-variant)]">
                      {template.description}
                    </p>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </section>

        <section className="rounded-[28px] bg-[color:var(--color-surface-container)] p-6 md:p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-on-surface-variant)]">
                Section organizer
              </p>
              <h3 className="font-display text-2xl font-semibold text-[color:var(--color-on-surface)]">
                Sequence the document
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-[color:var(--color-on-surface-variant)]">
                Keep the structure restrained. Toggle sections on or off, then nudge them into the
                reading order you want before preview arrives.
              </p>
            </div>

            <div className="space-y-3">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="flex items-center gap-4 rounded-[22px] bg-[color:var(--color-surface-container-low)] px-4 py-4"
                >
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    aria-label={section.label}
                    onChange={(event) =>
                      setSections((current) =>
                        current.map((item) =>
                          item.id === section.id
                            ? { ...item, enabled: event.target.checked }
                            : item
                        )
                      )
                    }
                    className="h-4 w-4 accent-sky-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[color:var(--color-on-surface)]">
                      {section.label}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-on-surface-variant)]">
                      Position {index + 1} · {section.enabled ? 'Included' : 'Hidden'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label={`Move ${section.label} up`}
                      onClick={() =>
                        setSections((current) => moveResumeSection(current, section.id, 'up'))
                      }
                      disabled={index === 0}
                      className="rounded-full bg-[color:var(--color-surface-container-lowest)] p-2.5 text-[color:var(--color-on-surface)] transition-colors hover:bg-white disabled:opacity-40"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${section.label} down`}
                      onClick={() =>
                        setSections((current) => moveResumeSection(current, section.id, 'down'))
                      }
                      disabled={index === sections.length - 1}
                      className="rounded-full bg-[color:var(--color-surface-container-lowest)] p-2.5 text-[color:var(--color-on-surface)] transition-colors hover:bg-white disabled:opacity-40"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

<<<<<<< HEAD
      <aside className="h-fit space-y-4 xl:sticky xl:top-24">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Snapshot
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Template</dt>
              <dd className="mt-1 font-medium">
                {resumeTemplates.find((template) => template.id === templateId)?.name}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Enabled</dt>
              <dd className="mt-1 font-medium">
                {sections.filter((section) => section.enabled).length}/{sections.length}
              </dd>
            </div>
          </dl>
        </div>

        <ResumePreview
          resumeName={name}
          templateId={templateId}
          sections={sections}
          profile={profile}
        />
=======
      <aside className="paper-shadow h-fit rounded-[32px] bg-[color:var(--color-surface-container-lowest)] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-on-surface-variant)]">
          Summary
        </p>
        <div className="mt-4 rounded-[24px] bg-[color:var(--color-surface-container-low)] px-6 py-7">
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-on-surface-variant)]">
            Resume object
          </p>
          <h3 className="mt-3 font-display text-[2rem] font-semibold leading-tight text-[color:var(--color-on-surface)]">
            {name}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--color-on-surface-variant)]">
            A composed overview of the current editorial setup. Preview and export will graduate
            this surface into a full paper review in the next phase.
          </p>
        </div>

        <dl className="mt-6 space-y-5 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-on-surface-variant)]">
              Selected template
            </dt>
            <dd className="mt-2 font-display text-xl font-semibold text-[color:var(--color-on-surface)]">
              {selectedTemplate?.name}
            </dd>
            <dd className="mt-1 text-sm leading-6 text-[color:var(--color-on-surface-variant)]">
              {selectedTemplate?.description}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-on-surface-variant)]">
              Enabled sections
            </dt>
            <dd className="mt-2 font-display text-xl font-semibold text-[color:var(--color-on-surface)]">
              {enabledSections.length} of {sections.length}
            </dd>
            <dd className="mt-1 text-sm leading-6 text-[color:var(--color-on-surface-variant)]">
              {enabledSections.length > 0
                ? enabledSections.map((section) => section.label).join(' · ')
                : 'No sections enabled'}
            </dd>
          </div>
        </dl>
        <p className="mt-8 text-sm leading-6 text-[color:var(--color-on-surface-variant)]">
          PDF preview and export arrive in the next phase. This step defines the structure,
          hierarchy, and template selection now.
        </p>
>>>>>>> 180f651 (fix)
      </aside>
    </div>
  )
}
