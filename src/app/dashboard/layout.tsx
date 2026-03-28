import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UniSyncNav } from '@/components/UniSyncNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')

  const meta = sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  if (!meta?.onboarding_completed) redirect('/onboarding')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <UniSyncNav activePage="dashboard" />
      <main className="pt-20">{children}</main>
    </div>
  )
}
