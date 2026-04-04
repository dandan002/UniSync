import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOnboardingStatus, syncUser } from '@/lib/actions/user'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Idempotent upsert — safe to call on every visit
  await syncUser()

  // Guard: if already onboarded, send to dashboard
  if (await getOnboardingStatus()) redirect('/dashboard/profile')

  const params = await searchParams
  const step = params.step ?? '1'

  return <OnboardingClient initialStep={step} />
}
