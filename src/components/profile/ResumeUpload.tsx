'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import type { ParsedResume } from '@/lib/schemas'

interface Props {
  onParsed: (data: ParsedResume) => void
  onError: (message: string) => void
}

export function ResumeUpload({ onParsed, onError }: Props) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function extractText(file: File): Promise<string> {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const pdfjsLib = await import('pdfjs-dist')
      // CDN version must match installed pdfjs-dist package version exactly
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
      return text
    }

    if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    }

    throw new Error('Unsupported file type. Please upload a PDF or DOCX.')
  }

  async function handleFile(file: File) {
    setLoading(true)
    try {
      const text = await extractText(file)
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!response.ok) throw new Error('Failed to parse resume. Please try again.')
      const parsed = await response.json()
      onParsed(parsed)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept=".pdf,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} className="sr-only" aria-label="Upload resume" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
        <div>
          <p className="text-sm font-medium">{loading ? 'Parsing your resume\u2026' : 'Click to upload your resume'}</p>
          <p className="text-xs text-muted-foreground mt-1">PDF or DOCX</p>
        </div>
      </button>
    </div>
  )
}
