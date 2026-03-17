'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseClient } from '@/lib/supabase'
import type { ProfileFormData } from '@/lib/schemas'

export async function saveProfile(data: ProfileFormData & { name: string }) {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const supabase = getSupabaseClient()

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (userError || !user) throw new Error('User not found in database')

  await supabase.from('users').update({ name: data.name }).eq('id', user.id)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        headline: data.headline,
        summary: data.summary,
        location: data.location,
        skills: data.skills,
        interests: data.interests,
        miscellaneous: data.miscellaneous,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('id')
    .single()

  if (profileError || !profile) throw new Error(`saveProfile failed: ${profileError?.message}`)

  const profileId = profile.id

  // Replace experiences: delete all, then re-insert in order
  await supabase.from('experiences').delete().eq('profile_id', profileId)
  if (data.experiences.length > 0) {
    const { error: expError } = await supabase.from('experiences').insert(
      data.experiences.map((exp, i) => ({
        profile_id: profileId,
        company: exp.company,
        title: exp.title,
        start_date: exp.start_date || null,
        end_date: exp.end_date || null,
        is_current: exp.is_current,
        bullets: exp.bullets,
        sort_order: i,
      }))
    )
    if (expError) throw new Error(`Failed to save experiences: ${expError.message}`)
  }

  // Replace education: delete all, then re-insert in order
  await supabase.from('education').delete().eq('profile_id', profileId)
  if (data.education.length > 0) {
    const { error: eduError } = await supabase.from('education').insert(
      data.education.map((edu, i) => ({
        profile_id: profileId,
        school: edu.school,
        degree: edu.degree,
        field: edu.field,
        start_date: edu.start_date || null,
        end_date: edu.end_date || null,
        sort_order: i,
      }))
    )
    if (eduError) throw new Error(`Failed to save education: ${eduError.message}`)
  }

  revalidatePath('/dashboard/profile')
}

export async function getProfile(): Promise<(ProfileFormData & { name: string }) | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = getSupabaseClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, name')
    .eq('clerk_id', userId)
    .single()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) return null

  const { data: experiences } = await supabase
    .from('experiences')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order')

  const { data: education } = await supabase
    .from('education')
    .select('*')
    .eq('profile_id', profile.id)
    .order('sort_order')

  return {
    name: user.name ?? '',
    headline: profile.headline ?? '',
    location: profile.location ?? '',
    summary: profile.summary ?? '',
    skills: profile.skills ?? [],
    interests: profile.interests ?? [],
    miscellaneous: profile.miscellaneous ?? [],
    experiences: (experiences ?? []).map((e) => ({
      id: e.id,
      company: e.company ?? '',
      title: e.title ?? '',
      start_date: e.start_date,
      end_date: e.end_date,
      is_current: e.is_current,
      bullets: e.bullets ?? [],
      sort_order: e.sort_order,
    })),
    education: (education ?? []).map((e) => ({
      id: e.id,
      school: e.school ?? '',
      degree: e.degree ?? '',
      field: e.field ?? '',
      start_date: e.start_date,
      end_date: e.end_date,
      sort_order: e.sort_order,
    })),
  }
}
