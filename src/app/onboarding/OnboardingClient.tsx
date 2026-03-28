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
            <ResumeImportStep onParsed={setParsed} />
          )}

          <div className="text-center">
            <button
              onClick={handleScratch}
              disabled={skipping}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {skipping ? 'Redirecting…' : 'Skip — I\'ll fill this in manually'}
            </button>
          </div>
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
