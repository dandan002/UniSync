import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UniSyncNav } from '@/components/UniSyncNav'
import { getOnboardingStatus } from '@/lib/actions/user'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const onboardingCompleted = await getOnboardingStatus()
  if (!onboardingCompleted) redirect('/onboarding')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <UniSyncNav activePage="dashboard" />
      <main className="pt-20">{children}</main>
    </div>
  )
}
