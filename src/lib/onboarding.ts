export function isOnboardingComplete(
  metadataCompleted: boolean | null | undefined,
  databaseCompleted: boolean | null | undefined
): boolean {
  return Boolean(databaseCompleted || metadataCompleted)
}

export function getParseResumeErrorMessage(
  status: number,
  payload: { error?: string } | null
): string {
  if (payload?.error) return payload.error

  if (status === 401) return 'Your session expired. Please sign in again.'
  if (status === 400) return 'Resume text could not be sent for parsing.'

  return 'Something went wrong while parsing your resume. Please try again.'
}

export function normalizeResumeTextInput(text: string): string {
  return text.replace(/\r\n/g, '\n').trim()
}
