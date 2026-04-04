import { describe, expect, it } from 'vitest'
import {
  getParseResumeErrorMessage,
  normalizeResumeTextInput,
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

  it('returns a session-expired message for 401 responses', () => {
    expect(getParseResumeErrorMessage(401, null)).toBe(
      'Your session expired. Please sign in again.'
    )
  })

  it('returns a request-format message for 400 responses', () => {
    expect(getParseResumeErrorMessage(400, null)).toBe(
      'Resume text could not be sent for parsing.'
    )
  })

  it('falls back to a friendly message for unknown failures', () => {
    expect(getParseResumeErrorMessage(500, null)).toBe(
      'Something went wrong while parsing your resume. Please try again.'
    )
  })
})

describe('normalizeResumeTextInput', () => {
  it('normalizes windows newlines and trims outer whitespace', () => {
    expect(normalizeResumeTextInput('  Jane Doe\r\nEngineer\r\n\r\n ')).toBe('Jane Doe\nEngineer')
  })

  it('returns an empty string for whitespace-only input', () => {
    expect(normalizeResumeTextInput(' \r\n\t ')).toBe('')
  })
})
