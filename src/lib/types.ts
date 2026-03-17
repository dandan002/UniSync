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
