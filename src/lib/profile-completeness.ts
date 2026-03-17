import type { ProfileFormData } from './schemas'

export interface CompletenessResult {
  filled: number
  total: number
  label: string
}

// 8 sections: name, headline, location, summary, skills, interests, miscellaneous,
// and experiences+education combined (having at least one of either counts as filled)
const TOTAL = 8

export function getProfileCompleteness(profile: Partial<ProfileFormData>): CompletenessResult {
  let filled = 0
  if (profile.name) filled++
  if (profile.headline) filled++
  if (profile.location) filled++
  if (profile.summary) filled++
  if (profile.skills?.length) filled++
  if (profile.interests?.length) filled++
  if (profile.miscellaneous?.length) filled++
  if ((profile.experiences?.length ?? 0) + (profile.education?.length ?? 0) > 0) filled++

  return { filled, total: TOTAL, label: `${filled} of ${TOTAL} sections filled` }
}
