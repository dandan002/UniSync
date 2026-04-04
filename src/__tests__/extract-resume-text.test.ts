// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pdfState = vi.hoisted(() => ({
  workerSrc: '',
  pages: [
    ['Jane', 'Doe'],
    ['Platform', 'Engineer'],
  ] as string[][],
  shouldThrow: false,
}))

const mammothState = vi.hoisted(() => ({
  value: 'DOCX content',
  shouldThrow: false,
}))

vi.mock('pdfjs-dist', () => ({
  version: '5.5.207',
  GlobalWorkerOptions: {
    get workerSrc() {
      return pdfState.workerSrc
    },
    set workerSrc(value: string) {
      pdfState.workerSrc = value
    },
  },
  getDocument: () => {
    if (pdfState.shouldThrow) {
      throw new Error('pdf failed')
    }

    return {
      promise: Promise.resolve({
        numPages: pdfState.pages.length,
        getPage: async (pageNumber: number) => ({
          getTextContent: async () => ({
            items: pdfState.pages[pageNumber - 1].map((str) => ({ str })),
          }),
        }),
      }),
    }
  },
}))

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(async () => {
    if (mammothState.shouldThrow) {
      throw new Error('docx failed')
    }

    return { value: mammothState.value }
  }),
}))

import { extractResumeText } from '../lib/extract-resume-text'

function makeFile(content: string, name: string, type: string): File {
  return new File([content], name, { type })
}

describe('extractResumeText', () => {
  beforeEach(() => {
    pdfState.workerSrc = ''
    pdfState.pages = [
      ['Jane', 'Doe'],
      ['Platform', 'Engineer'],
    ]
    pdfState.shouldThrow = false
    mammothState.value = 'DOCX content'
    mammothState.shouldThrow = false
  })

  it('extracts text from a plain-text file', async () => {
    const file = makeFile('John Doe\nSoftware Engineer', 'resume.txt', 'text/plain')
    const text = await extractResumeText(file)

    expect(text).toContain('John Doe')
    expect(text).toContain('Software Engineer')
  })

  it('rejects empty text files with a clearer message', async () => {
    const file = makeFile(' \n \n ', 'resume.txt', 'text/plain')

    await expect(extractResumeText(file)).rejects.toThrow('appears to be empty')
  })

  it('extracts text from a PDF and sets the worker source when missing', async () => {
    const file = makeFile('pdf-bytes', 'resume.pdf', 'application/pdf')
    const text = await extractResumeText(file)

    expect(text).toBe('Jane Doe\nPlatform Engineer')
    expect(pdfState.workerSrc).toContain('pdf.worker.mjs')
  })

  it('does not overwrite the PDF worker source when it is already configured', async () => {
    pdfState.workerSrc = 'already-set'

    const file = makeFile('pdf-bytes', 'resume.pdf', 'application/pdf')
    await extractResumeText(file)

    expect(pdfState.workerSrc).toBe('already-set')
  })

  it('normalizes PDF spacing and drops empty pages', async () => {
    pdfState.pages = [['Jane', '', 'Doe'], ['   '], ['Senior', 'Engineer']]

    const file = makeFile('pdf-bytes', 'resume.pdf', 'application/pdf')
    const text = await extractResumeText(file)

    expect(text).toBe('Jane Doe\nSenior Engineer')
  })

  it('surfaces a user-safe PDF error when parsing fails', async () => {
    pdfState.shouldThrow = true

    const file = makeFile('pdf-bytes', 'resume.pdf', 'application/pdf')

    await expect(extractResumeText(file)).rejects.toThrow('Failed to read this PDF')
  })

  it('extracts text from a DOCX file', async () => {
    mammothState.value = 'Extracted from docx'

    const file = makeFile(
      'docx-bytes',
      'resume.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    const text = await extractResumeText(file)

    expect(text).toBe('Extracted from docx')
  })

  it('accepts docx files even when the browser reports application/zip', async () => {
    const file = makeFile('docx-bytes', 'resume.docx', 'application/zip')
    const text = await extractResumeText(file)

    expect(text).toBe('DOCX content')
  })

  it('surfaces a user-safe DOCX error when parsing fails', async () => {
    mammothState.shouldThrow = true

    const file = makeFile(
      'docx-bytes',
      'resume.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )

    await expect(extractResumeText(file)).rejects.toThrow('Failed to read this DOCX')
  })

  it('caps output at 20 000 characters for extracted formats', async () => {
    mammothState.value = 'x'.repeat(30_000)

    const file = makeFile(
      'docx-bytes',
      'resume.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    const text = await extractResumeText(file)

    expect(text.length).toBe(20_000)
  })

  it('rejects legacy .doc files with a specific message', async () => {
    const file = makeFile('doc-bytes', 'resume.doc', 'application/msword')

    await expect(extractResumeText(file)).rejects.toThrow('Legacy .doc files are not supported')
  })

  it('throws on an unsupported file type', async () => {
    const file = makeFile('...', 'resume.jpg', 'image/jpeg')

    await expect(extractResumeText(file)).rejects.toThrow(
      'Unsupported file type. Please upload a PDF, DOCX, or TXT file.'
    )
  })
})
