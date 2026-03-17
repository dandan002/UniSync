'use client'

import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { saveProfile } from '@/lib/actions/profile'
import { completeOnboarding } from '@/lib/actions/user'
import type { ProfileFormData } from '@/lib/schemas'

export function OnboardingClient({ initialStep }: { initialStep: string }) {
  const router = useRouter()

  async function handleSave(data: ProfileFormData & { name: string }) {
    await saveProfile(data)
    router.push('/onboarding?step=3')
  }

  async function handleComplete() {
    await completeOnboarding()
    router.push('/dashboard/profile')
  }

  if (initialStep === '3') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-5xl">✓</div>
          <h1 className="font-display text-3xl font-bold">Your profile is ready.</h1>
          <p className="text-muted-foreground">You can always edit it from your dashboard.</p>
          <button onClick={handleComplete} className="w-full rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Go to dashboard →
          </button>
        </div>
      </div>
    )
  }

  if (initialStep === '2') {
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="mb-8">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Step 2 of 2</p>
            <h1 className="font-display text-3xl font-bold">Build your profile</h1>
            <p className="text-muted-foreground mt-2">Upload your resume to pre-fill, or fill in the form directly.</p>
          </div>
          <ProfileForm onSave={handleSave} showUpload={true} saveLabel="Save and continue →" />
        </div>
      </div>
    )
  }

  // Step 1: choose path
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Step 1 of 2</p>
          <h1 className="font-display text-3xl font-bold">How do you want to start?</h1>
          <p className="text-muted-foreground mt-2">You can always add more later.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button onClick={() => router.push('/onboarding?step=2')} className="rounded-xl border-2 border-border p-6 text-left hover:border-primary hover:bg-primary/5 transition-all">
            <div className="text-2xl mb-3">📄</div>
            <h2 className="font-semibold">Upload your resume</h2>
            <p className="text-sm text-muted-foreground mt-1">PDF or DOCX — we&apos;ll extract your info automatically.</p>
          </button>
          <button onClick={() => router.push('/onboarding?step=2')} className="rounded-xl border-2 border-border p-6 text-left hover:border-primary hover:bg-primary/5 transition-all">
            <div className="text-2xl mb-3">✏️</div>
            <h2 className="font-semibold">Start from scratch</h2>
            <p className="text-sm text-muted-foreground mt-1">Fill in your details directly.</p>
          </button>
        </div>
      </div>
    </div>
  )
}
