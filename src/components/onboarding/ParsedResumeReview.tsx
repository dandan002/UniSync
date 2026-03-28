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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMinimal = !data.name && !data.experiences?.length

  const summaryExcerpt = data.summary
    ? data.summary.slice(0, 120) + (data.summary.length > 120 ? '…' : '')
    : null

  async function handleImport() {
    setBusy(true)
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
      setBusy(false)
    }
  }

  async function handleEditFirst() {
    setBusy(true)
    setError(null)
    try {
      sessionStorage.setItem('pendingProfile', JSON.stringify(data))
      await completeOnboarding()
      router.push('/dashboard/profile')
    } catch {
      setError('Something went wrong. Please try again.')
      setBusy(false)
    }
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
          disabled={busy}
          className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? 'Importing…' : 'Import to Profile'}
        </button>
        <button
          onClick={handleEditFirst}
          disabled={busy}
          className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          Edit first
        </button>
      </div>

      <button
        onClick={onReset}
        disabled={busy}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Upload a different file
      </button>
    </div>
  )
}
