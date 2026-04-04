import { describe, expect, it } from 'vitest'
import {
  buildDefaultResumeSections,
  buildResumePreviewHeader,
  buildResumePreviewSections,
  getResumeTemplate,
  moveResumeSection,
} from '../lib/resume'

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

  it('enables interests and miscellaneous when those arrays have values', () => {
    const sections = buildDefaultResumeSections({
      interests: ['Writing'],
      miscellaneous: ['AWS Certified'],
    })

    expect(sections.find((section) => section.id === 'interests')?.enabled).toBe(true)
    expect(sections.find((section) => section.id === 'miscellaneous')?.enabled).toBe(true)
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

  it('returns the ordered list unchanged when the section id is missing', () => {
    const sections = [
      { id: 'experience', label: 'Experience', enabled: true, order: 1 },
      { id: 'summary', label: 'Summary', enabled: true, order: 0 },
    ]

    expect(moveResumeSection(sections, 'education', 'up').map((section) => section.id)).toEqual([
      'summary',
      'experience',
    ])
  })

  it('does not move the first section up or the last section down', () => {
    const sections = [
      { id: 'summary', label: 'Summary', enabled: true, order: 0 },
      { id: 'experience', label: 'Experience', enabled: true, order: 1 },
    ]

    expect(moveResumeSection(sections, 'summary', 'up')).toEqual(sections)
    expect(moveResumeSection(sections, 'experience', 'down')).toEqual(sections)
  })
})

describe('getResumeTemplate', () => {
  it('returns a matching template when the id is known', () => {
    expect(getResumeTemplate('academic-cv').name).toBe('Academic CV')
  })

  it('falls back to the default template when the id is unknown', () => {
    expect(getResumeTemplate('missing-template').id).toBe('modern-minimalist')
  })
})

describe('buildResumePreviewHeader', () => {
  it('falls back to placeholder text when profile fields are missing', () => {
    expect(buildResumePreviewHeader({})).toEqual({
      name: 'Your Name',
      headline: 'Your headline appears here',
      location: 'Location',
    })
  })

  it('trims populated profile fields', () => {
    expect(
      buildResumePreviewHeader({
        name: '  Jane Doe  ',
        headline: '  Platform Engineer  ',
        location: '  New York, NY  ',
      })
    ).toEqual({
      name: 'Jane Doe',
      headline: 'Platform Engineer',
      location: 'New York, NY',
    })
  })
})

describe('buildResumePreviewSections', () => {
  it('returns only enabled sections in order with profile-backed content', () => {
    const sections = buildResumePreviewSections(
      {
        summary: 'Operator who ships clean systems.',
        experiences: [
          {
            company: 'UniSync',
            title: 'Founding Engineer',
            start_date: '2024-01',
            end_date: null,
            is_current: true,
            bullets: ['Built the resume builder', 'Shipped onboarding import'],
            sort_order: 0,
          },
        ],
        skills: ['TypeScript', 'Next.js'],
      },
      [
        { id: 'skills', label: 'Skills', enabled: true, order: 2 },
        { id: 'summary', label: 'Summary', enabled: true, order: 0 },
        { id: 'experience', label: 'Experience', enabled: true, order: 1 },
        { id: 'education', label: 'Education', enabled: false, order: 3 },
      ]
    )

    expect(sections.map((section) => section.id)).toEqual(['summary', 'experience', 'skills'])
    expect(sections[0]).toMatchObject({
      id: 'summary',
      kind: 'text',
      content: 'Operator who ships clean systems.',
    })
    expect(sections[1]).toMatchObject({
      id: 'experience',
      kind: 'list',
    })
    expect(sections[2]).toMatchObject({
      id: 'skills',
      kind: 'tags',
      content: ['TypeScript', 'Next.js'],
    })
  })

  it('creates placeholder content when an enabled section has no backing profile data', () => {
    const [summary] = buildResumePreviewSections(
      { summary: '' },
      [{ id: 'summary', label: 'Summary', enabled: true, order: 0 }]
    )

    expect(summary).toMatchObject({
      id: 'summary',
      isPlaceholder: true,
      kind: 'text',
    })
  })

  it('creates placeholder content for education, skills, interests, and miscellaneous', () => {
    const sections = buildResumePreviewSections(
      {},
      [
        { id: 'education', label: 'Education', enabled: true, order: 0 },
        { id: 'skills', label: 'Skills', enabled: true, order: 1 },
        { id: 'interests', label: 'Interests', enabled: true, order: 2 },
        { id: 'miscellaneous', label: 'Additional', enabled: true, order: 3 },
      ]
    )

    expect(sections).toMatchObject([
      {
        id: 'education',
        kind: 'list',
        isPlaceholder: true,
        content: [{ title: 'No education added yet' }],
      },
      {
        id: 'skills',
        kind: 'tags',
        isPlaceholder: true,
        content: ['Add skills in your profile'],
      },
      {
        id: 'interests',
        kind: 'tags',
        isPlaceholder: true,
        content: ['Add interests in your profile'],
      },
      {
        id: 'miscellaneous',
        kind: 'tags',
        isPlaceholder: true,
        content: ['Add awards, certifications, or extras in your profile'],
      },
    ])
  })

  it('covers education, interests, and miscellaneous content branches', () => {
    const sections = buildResumePreviewSections(
      {
        education: [
          {
            school: 'MIT',
            degree: 'BS',
            field: 'Computer Science',
            start_date: '2016-09',
            end_date: '2020-06',
            sort_order: 0,
          },
        ],
        interests: ['Climbing'],
        miscellaneous: ['AWS Certified'],
      },
      [
        { id: 'education', label: 'Education', enabled: true, order: 0 },
        { id: 'interests', label: 'Interests', enabled: true, order: 1 },
        { id: 'miscellaneous', label: 'Additional', enabled: true, order: 2 },
      ]
    )

    expect(sections[0]).toMatchObject({
      id: 'education',
      kind: 'list',
      content: [
        {
          title: 'BS, Computer Science',
          subtitle: 'MIT',
          meta: 'Sep 2016 - Jun 2020',
        },
      ],
    })
    expect(sections[1]).toMatchObject({
      id: 'interests',
      kind: 'tags',
      content: ['Climbing'],
    })
    expect(sections[2]).toMatchObject({
      id: 'miscellaneous',
      kind: 'tags',
      content: ['AWS Certified'],
    })
  })

  it('uses role, company, and date fallbacks for sparse experience data', () => {
    const [experience] = buildResumePreviewSections(
      {
        experiences: [
          {
            company: '',
            title: '',
            start_date: null,
            end_date: null,
            is_current: false,
            bullets: ['', 'Shipped feature'],
            sort_order: 0,
          },
        ],
      },
      [{ id: 'experience', label: 'Experience', enabled: true, order: 0 }]
    )

    expect(experience).toMatchObject({
      id: 'experience',
      kind: 'list',
      content: [
        {
          title: 'Untitled role',
          subtitle: 'Company',
          meta: 'Start date - End date',
          bullets: ['Shipped feature'],
        },
      ],
    })
  })

  it('uses the degree fallback and present-date formatting for current entries', () => {
    const sections = buildResumePreviewSections(
      {
        experiences: [
          {
            company: 'UniSync',
            title: 'Engineer',
            start_date: '2024-01',
            end_date: '2024-02',
            is_current: true,
            bullets: [],
            sort_order: 0,
          },
        ],
        education: [
          {
            school: '',
            degree: '',
            field: '',
            start_date: '2020-01',
            end_date: '2022-01',
            sort_order: 0,
          },
        ],
      },
      [
        { id: 'experience', label: 'Experience', enabled: true, order: 0 },
        { id: 'education', label: 'Education', enabled: true, order: 1 },
      ]
    )

    expect(sections[0]).toMatchObject({
      content: [{ meta: 'Jan 2024 - Present' }],
    })
    expect(sections[1]).toMatchObject({
      content: [{ title: 'Degree', subtitle: 'School', meta: 'Jan 2020 - Jan 2022' }],
    })
  })

  it('returns the raw date value when the month is missing', () => {
    const [education] = buildResumePreviewSections(
      {
        education: [
          {
            school: 'Example University',
            degree: '',
            field: '',
            start_date: '2020',
            end_date: null,
            sort_order: 0,
          },
        ],
      },
      [{ id: 'education', label: 'Education', enabled: true, order: 0 }]
    )

    expect(education).toMatchObject({
      content: [
        {
          meta: '2020 - End date',
        },
      ],
    })
  })
})
