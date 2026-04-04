'use client'

import { useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { extractResumeText } from '@/lib/extract-resume-text'
import type { ParsedResume } from '@/lib/schemas'

interface Props {
  onParsed: (data: ParsedResume) => void
  onError: (message: string) => void
}

export function ResumeUpload({ onParsed, onError }: Props) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setLoading(true)

    try {
      const text = await extractResumeText(file)
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('Failed to parse resume. Please try again.')
      }

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
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
        className="sr-only"
        aria-label="Upload resume"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">{loading ? 'Parsing your resume…' : 'Click to upload your resume'}</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, or TXT</p>
        </div>
      </button>
    </div>
  )
}
