'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { getProfile } from '@/lib/actions/profile'
import { buildDefaultResumeSections, resumeTemplates } from '@/lib/resume'
import { resumeUpdateSchema } from '@/lib/schemas'
import type { ResumeRecord } from '@/lib/types'

async function getCurrentUserRow() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const supabase = getSupabaseClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (error || !user) throw new Error('User not found in database')

  return { supabase, userId: user.id }
}

function parseSectionsConfig(value: unknown) {
  return resumeUpdateSchema.shape.sections_config.parse(
    value ?? buildDefaultResumeSections({})
  )
}

function mapResume(row: {
  id: string
  name: string
  template_id: string | null
  sections_config: unknown
  updated_at: string
  created_at: string
}): ResumeRecord {
  return {
    id: row.id,
    name: row.name,
    template_id: row.template_id ?? resumeTemplates[0].id,
    sections_config: parseSectionsConfig(row.sections_config),
    updated_at: row.updated_at,
    created_at: row.created_at,
  }
}

export async function listResumes(): Promise<ResumeRecord[]> {
  const { supabase, userId } = await getCurrentUserRow()
  const { data, error } = await supabase
    .from('resumes')
    .select('id, name, template_id, sections_config, updated_at, created_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`Failed to load resumes: ${error.message}`)

  return (data ?? []).map(mapResume)
}

export async function getResume(id: string): Promise<ResumeRecord> {
  const { supabase, userId } = await getCurrentUserRow()
  const { data, error } = await supabase
    .from('resumes')
    .select('id, name, template_id, sections_config, updated_at, created_at')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) notFound()

  return mapResume(data)
}

export async function createResume() {
  const { supabase, userId } = await getCurrentUserRow()
  const profile = await getProfile()
  const sections = buildDefaultResumeSections(profile ?? {})

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      name: `Resume ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      template_id: resumeTemplates[0].id,
      sections_config: sections,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create resume: ${error?.message}`)

  revalidatePath('/dashboard/resumes')
  return data.id as string
}

export async function updateResume(id: string, payload: unknown) {
  const parsed = resumeUpdateSchema.parse(payload)
  const { supabase, userId } = await getCurrentUserRow()

  const { data, error } = await supabase
    .from('resumes')
    .update({
      name: parsed.name,
      template_id: parsed.template_id,
      sections_config: parsed.sections_config,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .single()

  if (error) throw new Error(`Failed to save resume: ${error.message}`)
  if (!data) notFound()

  revalidatePath('/dashboard/resumes')
  revalidatePath(`/dashboard/resume/${id}`)
}
