import { describe, expect, it } from 'vitest'
import {
  getParseResumeErrorMessage,
  isOnboardingComplete,
} from '../lib/onboarding'

describe('isOnboardingComplete', () => {
  it('trusts the database flag even if session metadata is stale', () => {
    expect(isOnboardingComplete(false, true)).toBe(true)
  })

  it('returns false when neither source shows completion', () => {
    expect(isOnboardingComplete(false, false)).toBe(false)
  })
})

describe('getParseResumeErrorMessage', () => {
  it('surfaces a 502 parse error body', () => {
    expect(
      getParseResumeErrorMessage(502, { error: 'LLM returned invalid JSON' })
    ).toBe('LLM returned invalid JSON')
  })

  it('falls back to a friendly message for unknown failures', () => {
    expect(getParseResumeErrorMessage(500, null)).toBe(
      'Something went wrong while parsing your resume. Please try again.'
    )
  })
})
