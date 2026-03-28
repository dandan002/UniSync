const MAX_CHARS = 20_000

export async function extractResumeText(file: File): Promise<string> {
  const type = file.type || ''
  const name = file.name.toLowerCase()

  if (type === 'text/plain' || name.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(((e.target?.result as string) ?? '').slice(0, MAX_CHARS))
      reader.onerror = () => reject(new Error('Failed to read text file'))
      reader.readAsText(file)
    })
  }

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n'
    }
    return text.slice(0, MAX_CHARS)
  }

  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value.slice(0, MAX_CHARS)
  }

  throw new Error('Unsupported file type — try PDF, DOCX, or TXT')
}
