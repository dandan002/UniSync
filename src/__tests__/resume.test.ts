import { describe, expect, it } from 'vitest'
import { buildDefaultResumeSections, moveResumeSection } from '../lib/resume'

describe('buildDefaultResumeSections', () => {
  it('enables only sections that have profile content', () => {
    const sections = buildDefaultResumeSections({
      summary: 'Writes clearly',
      skills: ['TypeScript'],
      experiences: [],
      education: [],
      interests: [],
      miscellaneous: [],
    })

    expect(sections.find((section) => section.id === 'summary')?.enabled).toBe(true)
    expect(sections.find((section) => section.id === 'skills')?.enabled).toBe(true)
    expect(sections.find((section) => section.id === 'experience')?.enabled).toBe(false)
  })
})

describe('moveResumeSection', () => {
  it('reorders sections and rewrites order values', () => {
    const reordered = moveResumeSection(
      [
        { id: 'summary', label: 'Summary', enabled: true, order: 0 },
        { id: 'experience', label: 'Experience', enabled: true, order: 1 },
        { id: 'education', label: 'Education', enabled: true, order: 2 },
      ],
      'education',
      'up'
    )

    expect(reordered.map((section) => section.id)).toEqual([
      'summary',
      'education',
      'experience',
    ])
    expect(reordered.map((section) => section.order)).toEqual([0, 1, 2])
  })
})
