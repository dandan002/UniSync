// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { extractResumeText } from '../lib/extract-resume-text'

function makeFile(content: string, name: string, type: string): File {
  return new File([content], name, { type })
}

describe('extractResumeText', () => {
  it('extracts text from a plain-text file', async () => {
    const file = makeFile('John Doe\nSoftware Engineer', 'resume.txt', 'text/plain')
    const text = await extractResumeText(file)
    expect(text).toContain('John Doe')
    expect(text).toContain('Software Engineer')
  })

  it('throws on an unsupported file type', async () => {
    const file = makeFile('...', 'resume.jpg', 'image/jpeg')
    await expect(extractResumeText(file)).rejects.toThrow('Unsupported file type')
  })

  it('caps output at 20 000 characters', async () => {
    const longText = 'x'.repeat(30_000)
    const file = makeFile(longText, 'resume.txt', 'text/plain')
    const text = await extractResumeText(file)
    expect(text.length).toBeLessThanOrEqual(20_000)
  })
})
