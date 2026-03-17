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
