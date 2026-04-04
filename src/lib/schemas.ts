import { z } from 'zod'
import type { ResumeSectionId } from './types'

export const experienceSchema = z.object({
  company: z.string().default(''),
  title: z.string().default(''),
  start_date: z.string().nullable().default(null),
  end_date: z.string().nullable().default(null),
  is_current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
}).strip()

export const educationSchema = z.object({
  school: z.string().default(''),
  degree: z.string().default(''),
  field: z.string().default(''),
  start_date: z.string().nullable().default(null),
  end_date: z.string().nullable().default(null),
}).strip()

// Validates the OpenRouter parse response — all fields optional since LLMs may return partial data
export const parsedResumeSchema = z.object({
  name: z.string().optional(),
  headline: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  miscellaneous: z.array(z.string()).optional(),
  experiences: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
}).strip()

export type ParsedResume = z.infer<typeof parsedResumeSchema>

// Validates profile form submissions — name is the only required field
export const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  headline: z.string().default(''),
  location: z.string().default(''),
  summary: z.string().default(''),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  miscellaneous: z.array(z.string()).default([]),
  experiences: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
}).strip()

export type ProfileFormData = z.infer<typeof profileFormSchema>

const resumeSectionIds = [
  'summary',
  'experience',
  'education',
  'skills',
  'interests',
  'miscellaneous',
] as const satisfies readonly ResumeSectionId[]

const resumeTemplateIds = [
  'modern-minimalist',
  'executive-classic',
  'academic-cv',
] as const

export const resumeSectionSchema = z.object({
  id: z.enum(resumeSectionIds),
  label: z.string().min(1),
  enabled: z.boolean(),
  order: z.number().int().nonnegative(),
}).strip()

export const resumeUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Resume name is required'),
  template_id: z.enum(resumeTemplateIds),
  sections_config: z.array(resumeSectionSchema).superRefine((sections, ctx) => {
    const ids = new Set<string>()
    for (const section of sections) {
      if (ids.has(section.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate section id: ${section.id}`,
        })
      }
      ids.add(section.id)
    }
  }),
}).strip()

export type ResumeSectionData = z.infer<typeof resumeSectionSchema>
export type ResumeUpdateData = z.infer<typeof resumeUpdateSchema>
