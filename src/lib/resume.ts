import type { ProfileFormData } from './schemas'
import type {
  ResumePreviewHeader,
  ResumePreviewListItem,
  ResumePreviewSection,
  ResumeSectionConfig,
  ResumeSectionId,
} from './types'

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

export type ResumeTemplateId = (typeof resumeTemplates)[number]['id']

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

export function getResumeTemplate(templateId: string) {
  return resumeTemplates.find((template) => template.id === templateId) ?? resumeTemplates[0]
}

function formatDate(value: string | null | undefined) {
  if (!value) return null

  const [year, month] = value.split('-')
  if (!year || !month) return value

  const date = new Date(Number(year), Number(month) - 1, 1)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function formatDateRange(start: string | null, end: string | null, isCurrent = false) {
  const startLabel = formatDate(start) ?? 'Start date'
  const endLabel = isCurrent ? 'Present' : (formatDate(end) ?? 'End date')
  return `${startLabel} - ${endLabel}`
}

function buildPlaceholderSection(section: ResumeSectionConfig): ResumePreviewSection {
  const placeholderById: Record<ResumeSectionId, ResumePreviewSection> = {
    summary: {
      id: 'summary',
      label: section.label,
      kind: 'text',
      content: 'Add a short professional summary to anchor the resume.',
      isPlaceholder: true,
    },
    experience: {
      id: 'experience',
      label: section.label,
      kind: 'list',
      content: [
        {
          title: 'No experience added yet',
          subtitle: 'Add roles in your profile to populate this section.',
        },
      ],
      isPlaceholder: true,
    },
    education: {
      id: 'education',
      label: section.label,
      kind: 'list',
      content: [
        {
          title: 'No education added yet',
          subtitle: 'Add academic history in your profile to populate this section.',
        },
      ],
      isPlaceholder: true,
    },
    skills: {
      id: 'skills',
      label: section.label,
      kind: 'tags',
      content: ['Add skills in your profile'],
      isPlaceholder: true,
    },
    interests: {
      id: 'interests',
      label: section.label,
      kind: 'tags',
      content: ['Add interests in your profile'],
      isPlaceholder: true,
    },
    miscellaneous: {
      id: 'miscellaneous',
      label: section.label,
      kind: 'tags',
      content: ['Add awards, certifications, or extras in your profile'],
      isPlaceholder: true,
    },
  }

  return placeholderById[section.id]
}

export function buildResumePreviewHeader(
  profile: Partial<ProfileFormData & { name: string }>
): ResumePreviewHeader {
  return {
    name: profile.name?.trim() || 'Your Name',
    headline: profile.headline?.trim() || 'Your headline appears here',
    location: profile.location?.trim() || 'Location',
  }
}

export function buildResumePreviewSections(
  profile: Partial<ProfileFormData>,
  sections: ResumeSectionConfig[]
): ResumePreviewSection[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .filter((section) => section.enabled)
    .map((section) => {
      let nextSection: ResumePreviewSection | null = null

      if (section.id === 'summary') {
        nextSection = profile.summary?.trim()
          ? {
              id: section.id,
              label: section.label,
              kind: 'text',
              content: profile.summary.trim(),
            }
          : buildPlaceholderSection(section)
      }

      if (section.id === 'experience') {
        const items: ResumePreviewListItem[] =
          profile.experiences?.map((experience) => ({
            title: experience.title || 'Untitled role',
            subtitle: experience.company || 'Company',
            meta: formatDateRange(
              experience.start_date,
              experience.end_date,
              experience.is_current
            ),
            bullets: experience.bullets.filter(Boolean),
          })) ?? []

        nextSection = items.length
          ? {
              id: section.id,
              label: section.label,
              kind: 'list',
              content: items,
            }
          : buildPlaceholderSection(section)
      }

      if (section.id === 'education') {
        const items: ResumePreviewListItem[] =
          profile.education?.map((education) => ({
            title: [education.degree, education.field].filter(Boolean).join(', ') || 'Degree',
            subtitle: education.school || 'School',
            meta: formatDateRange(education.start_date, education.end_date),
          })) ?? []

        nextSection = items.length
          ? {
              id: section.id,
              label: section.label,
              kind: 'list',
              content: items,
            }
          : buildPlaceholderSection(section)
      }

      if (section.id === 'skills') {
        const items = profile.skills?.filter(Boolean) ?? []
        nextSection = items.length
          ? {
              id: section.id,
              label: section.label,
              kind: 'tags',
              content: items,
            }
          : buildPlaceholderSection(section)
      }

      if (section.id === 'interests') {
        const items = profile.interests?.filter(Boolean) ?? []
        nextSection = items.length
          ? {
              id: section.id,
              label: section.label,
              kind: 'tags',
              content: items,
            }
          : buildPlaceholderSection(section)
      }

      if (section.id === 'miscellaneous') {
        const items = profile.miscellaneous?.filter(Boolean) ?? []
        nextSection = items.length
          ? {
              id: section.id,
              label: section.label,
              kind: 'tags',
              content: items,
            }
          : buildPlaceholderSection(section)
      }

      return nextSection ?? buildPlaceholderSection(section)
    })
}
