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

type ExperienceItem = Experience & { _key: string }
type EducationItem = Education & { _key: string }

const emptyExperience = (): ExperienceItem => ({
  company: '', title: '', start_date: null, end_date: null,
  is_current: false, bullets: [], sort_order: 0, _key: crypto.randomUUID(),
})

const emptyEducation = (): EducationItem => ({
  school: '', degree: '', field: '', start_date: null, end_date: null, sort_order: 0, _key: crypto.randomUUID(),
})

export function ProfileForm({ initialData, onSave, showUpload = false, saveLabel = 'Save profile' }: Props) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [headline, setHeadline] = useState(initialData?.headline ?? '')
  const [location, setLocation] = useState(initialData?.location ?? '')
  const [summary, setSummary] = useState(initialData?.summary ?? '')
  const [skills, setSkills] = useState<string[]>(initialData?.skills ?? [])
  const [interests, setInterests] = useState<string[]>(initialData?.interests ?? [])
  const [miscellaneous, setMiscellaneous] = useState<string[]>(initialData?.miscellaneous ?? [])
  const [experiences, setExperiences] = useState<ExperienceItem[]>(
    (initialData?.experiences ?? []).map((e, i) => ({ ...emptyExperience(), ...e, sort_order: i }))
  )
  const [education, setEducation] = useState<EducationItem[]>(
    (initialData?.education ?? []).map((e, i) => ({ ...emptyEducation(), ...e, sort_order: i }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function applyParsed(parsed: Partial<ProfileFormData & { name: string }>) {
    setError(null)
    if (parsed.name) setName(parsed.name)
    if (parsed.headline) setHeadline(parsed.headline)
    if (parsed.location) setLocation(parsed.location)
    if (parsed.summary) setSummary(parsed.summary)
    if (parsed.skills?.length) setSkills(parsed.skills)
    if (parsed.interests?.length) setInterests(parsed.interests)
    if (parsed.miscellaneous?.length) setMiscellaneous(parsed.miscellaneous)
    if (parsed.experiences?.length) {
      setExperiences(parsed.experiences.map((e, i) => ({ ...emptyExperience(), ...e, sort_order: i, _key: crypto.randomUUID() })))
    }
    if (parsed.education?.length) {
      setEducation(parsed.education.map((e, i) => ({ ...emptyEducation(), ...e, sort_order: i, _key: crypto.randomUUID() })))
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
          <button type="button" onClick={() => setExperiences(prev => [...prev, { ...emptyExperience(), sort_order: prev.length }])} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add experience
          </button>
        </div>
        {experiences.length === 0 && <p className="text-sm text-muted-foreground">No experiences added yet.</p>}
        {experiences.map((exp, i) => (
          <ExperienceBlock key={exp._key} index={i} value={exp}
            onChange={(updated) => setExperiences(experiences.map((e, j) => j === i ? { ...updated, _key: e._key } : e))}
            onRemove={() => setExperiences(experiences.filter((_, j) => j !== i))}
          />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Education</h2>
          <button type="button" onClick={() => setEducation(prev => [...prev, { ...emptyEducation(), sort_order: prev.length }])} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add education
          </button>
        </div>
        {education.length === 0 && <p className="text-sm text-muted-foreground">No education added yet.</p>}
        {education.map((edu, i) => (
          <EducationBlock key={edu._key} index={i} value={edu}
            onChange={(updated) => setEducation(education.map((e, j) => j === i ? { ...updated, _key: e._key } : e))}
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
