import { describe, it, expect } from 'vitest'
import { getProfileCompleteness } from '../lib/profile-completeness'
import type { ProfileFormData } from '../lib/schemas'

const empty: ProfileFormData = {
  name: '', headline: '', location: '', summary: '',
  skills: [], interests: [], miscellaneous: [],
  experiences: [], education: [],
}

describe('getProfileCompleteness', () => {
  it('returns 0/8 for a completely empty profile', () => {
    const r = getProfileCompleteness(empty)
    expect(r.filled).toBe(0)
    expect(r.total).toBe(8)
  })

  it('counts name as 1 filled section', () => {
    expect(getProfileCompleteness({ ...empty, name: 'Jane' }).filled).toBe(1)
  })

  it('counts experiences and education together as 1 section', () => {
    const withExp = {
      ...empty,
      name: 'Jane',
      experiences: [{ company: 'Acme', title: 'Eng', start_date: null, end_date: null, is_current: false, bullets: [] }],
    }
    expect(getProfileCompleteness(withExp).filled).toBe(2)
  })

  it('returns 8/8 for a fully complete profile', () => {
    const full: ProfileFormData = {
      name: 'Jane', headline: 'Engineer', location: 'London', summary: 'Great dev',
      skills: ['TS'], interests: ['OSS'], miscellaneous: ['AWS cert'],
      experiences: [{ company: 'Acme', title: 'Eng', start_date: null, end_date: null, is_current: false, bullets: [] }],
      education: [{ school: 'MIT', degree: 'BSc', field: 'CS', start_date: null, end_date: null }],
    }
    const r = getProfileCompleteness(full)
    expect(r.filled).toBe(8)
    expect(r.total).toBe(8)
  })
})
