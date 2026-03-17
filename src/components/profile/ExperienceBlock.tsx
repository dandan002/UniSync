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
          onChange={(e) => update({ bullets: e.target.value.split('\n').filter(Boolean) })}
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
