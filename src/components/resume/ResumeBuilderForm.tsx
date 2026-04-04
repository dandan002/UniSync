'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
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
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
                    onClick={() =>
                      setSections((current) => moveResumeSection(current, section.id, 'up'))
                    }
                    disabled={index === 0}
                    className="rounded-md border border-border p-2 hover:bg-muted disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSections((current) => moveResumeSection(current, section.id, 'down'))
                    }
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
          PDF preview and export land in the next builder phase. This step defines the structure and
          template selection now.
        </p>
      </aside>
    </div>
  )
}
