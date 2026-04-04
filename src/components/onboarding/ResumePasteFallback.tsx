'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { normalizeResumeTextInput } from '@/lib/onboarding'

interface Props {
  onSubmit: (text: string) => Promise<void>
}

export function ResumePasteFallback({ onSubmit }: Props) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const normalized = normalizeResumeTextInput(text)
    if (!normalized) {
      setError('Paste some resume text before continuing.')
      return
    }

    setPending(true)
    setError(null)

    try {
      await onSubmit(normalized)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while parsing your pasted resume text.'
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#dde4e5] bg-white p-5 paper-shadow">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Paste Instead
        </p>
        <h2 className="text-xl font-semibold text-[#2d3435]">Paste your resume text manually</h2>
        <p className="text-sm text-[#5a6061]">
          If the file parser fails, paste the raw resume text here and continue with AI parsing.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste your resume content here..."
        className="mt-4 min-h-48 w-full rounded-xl border border-border bg-[#f9f9f9] px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Best results come from full plain text, including headings, jobs, dates, and bullets.
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? 'Parsing...' : 'Parse pasted text'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  )
}
