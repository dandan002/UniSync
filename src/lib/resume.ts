import type { ProfileFormData } from './schemas'
import type { ResumeSectionConfig, ResumeSectionId } from './types'

export const resumeTemplates = [
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    category: 'Modern',
    description: 'Clean lines and generous white space for a contemporary professional look.',
  },
  {
    id: 'executive-classic',
    name: 'Executive Classic',
    category: 'Professional',
    description: 'Traditional gravitas with refined typographic hierarchy for senior roles.',
  },
  {
    id: 'academic-cv',
    name: 'Academic CV',
    category: 'Academic',
    description: 'Structured and comprehensive for academic and research positions.',
  },
] as const

const sectionDefinitions: Array<{ id: ResumeSectionId; label: string }> = [
  { id: 'summary', label: 'Summary' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'interests', label: 'Interests' },
  { id: 'miscellaneous', label: 'Additional' },
]

export function buildDefaultResumeSections(
  profile: Partial<ProfileFormData>
): ResumeSectionConfig[] {
  return sectionDefinitions.map((section, index) => ({
    ...section,
    order: index,
    enabled:
      (section.id === 'summary' && Boolean(profile.summary?.trim())) ||
      (section.id === 'experience' && (profile.experiences?.length ?? 0) > 0) ||
      (section.id === 'education' && (profile.education?.length ?? 0) > 0) ||
      (section.id === 'skills' && (profile.skills?.length ?? 0) > 0) ||
      (section.id === 'interests' && (profile.interests?.length ?? 0) > 0) ||
      (section.id === 'miscellaneous' && (profile.miscellaneous?.length ?? 0) > 0),
  }))
}

export function moveResumeSection(
  sections: ResumeSectionConfig[],
  id: ResumeSectionId,
  direction: 'up' | 'down'
): ResumeSectionConfig[] {
  const ordered = [...sections].sort((a, b) => a.order - b.order)
  const index = ordered.findIndex((section) => section.id === id)
  if (index === -1) return ordered

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= ordered.length) return ordered

  const next = [...ordered]
  const [section] = next.splice(index, 1)
  next.splice(targetIndex, 0, section)

  return next.map((item, order) => ({ ...item, order }))
}
