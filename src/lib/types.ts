export interface Experience {
  id?: string
  company: string
  title: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  bullets: string[]
  sort_order: number
}

export interface Education {
  id?: string
  school: string
  degree: string
  field: string
  start_date: string | null
  end_date: string | null
  sort_order: number
}

export type ResumeSectionId =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'interests'
  | 'miscellaneous'

export interface ResumeSectionConfig {
  id: ResumeSectionId
  label: string
  enabled: boolean
  order: number
}

export interface ResumeRecord {
  id: string
  name: string
  template_id: string
  sections_config: ResumeSectionConfig[]
  updated_at: string
  created_at: string
}

export interface ResumePreviewHeader {
  name: string
  headline: string
  location: string
}

export interface ResumePreviewListItem {
  title: string
  subtitle?: string
  meta?: string
  bullets?: string[]
}

export interface ResumePreviewSection {
  id: ResumeSectionId
  label: string
  kind: 'text' | 'list' | 'tags'
  content: string | string[] | ResumePreviewListItem[]
  isPlaceholder?: boolean
}
