import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncUser } from '@/lib/actions/user'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')

  // Idempotent upsert — safe to call on every visit
  await syncUser()

  // Guard: if already onboarded, send to dashboard
  const meta = sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  if (meta?.onboarding_completed) redirect('/dashboard/profile')

  const params = await searchParams
  const step = params.step ?? '1'

  return <OnboardingClient initialStep={step} />
}
