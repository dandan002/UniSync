import { describe, it, expect } from 'vitest'
import { parsedResumeSchema, profileFormSchema } from '../lib/schemas'

describe('parsedResumeSchema', () => {
  it('accepts a fully-populated object', () => {
    const input = {
      name: 'Jane Doe',
      headline: 'Software Engineer',
      location: 'London',
      summary: 'Experienced developer',
      skills: ['TypeScript', 'React'],
      interests: ['Open source'],
      miscellaneous: ['AWS Certified'],
      experiences: [{
        company: 'Acme', title: 'Engineer',
        start_date: '2020-01', end_date: null,
        is_current: true, bullets: ['Built things'],
      }],
      education: [{
        school: 'MIT', degree: 'BSc', field: 'Computer Science',
        start_date: '2016-09', end_date: '2020-06',
      }],
    }
    expect(() => parsedResumeSchema.parse(input)).not.toThrow()
  })

  it('accepts an empty object (all fields optional)', () => {
    expect(() => parsedResumeSchema.parse({})).not.toThrow()
  })

  it('strips unknown fields', () => {
    const result = parsedResumeSchema.parse({ name: 'Jane', unknown_field: 'value' })
    expect((result as Record<string, unknown>).unknown_field).toBeUndefined()
  })
})

describe('profileFormSchema', () => {
  it('rejects an object without a name', () => {
    expect(() => profileFormSchema.parse({})).toThrow()
  })

  it('accepts a minimal valid profile (name only)', () => {
    expect(() => profileFormSchema.parse({ name: 'Jane' })).not.toThrow()
  })
})
