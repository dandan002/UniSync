const MAX_CHARS = 20_000

const PDF_TYPES = new Set(['application/pdf'])
const DOCX_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
])
const TEXT_TYPES = new Set(['text/plain'])

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function hasExtension(name: string, extension: string) {
  return name.endsWith(extension)
}

function getFileKind(file: File) {
  const type = (file.type || '').toLowerCase()
  const name = file.name.toLowerCase()

  if (TEXT_TYPES.has(type) || hasExtension(name, '.txt')) return 'txt'
  if (PDF_TYPES.has(type) || hasExtension(name, '.pdf')) return 'pdf'
  if (type === 'application/msword' || hasExtension(name, '.doc')) return 'doc'
  if (DOCX_TYPES.has(type) || hasExtension(name, '.docx')) return 'docx'

  return 'unsupported'
}

function finalizeText(text: string, emptyMessage: string) {
  const normalized = normalizeExtractedText(text).slice(0, MAX_CHARS)

  if (!normalized) {
    throw new Error(emptyMessage)
  }

  return normalized
}

async function readTextFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        resolve(
          finalizeText(
            (e.target?.result as string) ?? '',
            'This text file appears to be empty. Try a different file or paste the resume text instead.'
          )
        )
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () =>
      reject(
        new Error('Failed to read this text file. Try again or upload a PDF, DOCX, or TXT file.')
      )
    reader.readAsText(file)
  })
}

async function readPdfFile(file: File) {
  try {
    const pdfjsLib = await import('pdfjs-dist')

    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pageTexts: string[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const lines = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (lines) {
        pageTexts.push(lines)
      }
    }

    return finalizeText(
      pageTexts.join('\n'),
      "Couldn't extract readable text from this PDF. It may be scanned, image-based, or export-protected. Try a DOCX, TXT, or paste the resume text instead."
    )
  } catch {
    throw new Error(
      'Failed to read this PDF in the browser. Try re-exporting it as a standard PDF, uploading a DOCX, or pasting the resume text instead.'
    )
  }
}

async function readDocxFile(file: File) {
  try {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })

    return finalizeText(
      result.value,
      "Couldn't extract readable text from this DOCX. Try saving it again from Word/Google Docs, or upload a PDF/TXT instead."
    )
  } catch {
    throw new Error(
      'Failed to read this DOCX file. Try saving it again as .docx, or upload a PDF/TXT instead.'
    )
  }
}

export async function extractResumeText(file: File): Promise<string> {
  const kind = getFileKind(file)

  if (kind === 'txt') return readTextFile(file)
  if (kind === 'pdf') return readPdfFile(file)
  if (kind === 'docx') return readDocxFile(file)
  if (kind === 'doc') {
    throw new Error('Legacy .doc files are not supported. Please resave as .docx, PDF, or TXT.')
  }

  throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.')
}
