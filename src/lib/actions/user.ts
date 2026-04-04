'use server'

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function syncUser() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const clerkUser = await currentUser()
  if (!clerkUser) throw new Error('Could not fetch Clerk user')

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  if (!email) throw new Error('User has no email address')

  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('users')
    .upsert(
      {
        clerk_id: userId,
        email,
        name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
        avatar_url: clerkUser.imageUrl ?? null,
      },
      { onConflict: 'clerk_id' }
    )

  if (error) {
    console.error('Supabase upsert error:', error)
    throw new Error(`syncUser failed: ${error.message}`)
  }
}

export async function completeOnboarding() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('users')
    .update({ onboarding_completed: true })
    .eq('clerk_id', userId)

  if (error) throw new Error(`completeOnboarding failed: ${error.message}`)

  // Mirror to Clerk publicMetadata so middleware can read it without a DB call
  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { onboarding_completed: true },
  })
}

export async function getOnboardingStatus() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return false

  const metadata = sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  const metadataCompleted = Boolean(metadata?.onboarding_completed)

  const supabase = getSupabaseClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('clerk_id', userId)
    .single()

  if (error || !user) return metadataCompleted

  return Boolean(user.onboarding_completed || metadataCompleted)
}
