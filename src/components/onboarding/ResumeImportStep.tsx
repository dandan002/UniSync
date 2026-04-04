'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { ResumePasteFallback } from '@/components/onboarding/ResumePasteFallback'
import { extractResumeText } from '@/lib/extract-resume-text'
import { getParseResumeErrorMessage } from '@/lib/onboarding'
import { parsedResumeSchema } from '@/lib/schemas'
import type { ParsedResume } from '@/lib/schemas'

type Step = 'idle' | 'extracting' | 'parsing' | 'error'

interface Props {
  onParsed: (data: ParsedResume) => void
}

const MAX_BYTES = 5 * 1024 * 1024

export function ResumeImportStep({ onParsed }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [showPasteFallback, setShowPasteFallback] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function parseResumeText(text: string) {
    setStep('parsing')

    const res = await fetch('/api/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      throw new Error(getParseResumeErrorMessage(res.status, payload))
    }

    const json = await res.json()
    const parsed = parsedResumeSchema.parse(json)
    onParsed(parsed)
  }

  async function processFile(file: File) {
    if (file.size > MAX_BYTES) {
      setStep('error')
      setErrorMsg('File too large, max 5 MB.')
      setShowPasteFallback(true)
      return
    }

    setErrorMsg(null)

    let text: string

    try {
      setStep('extracting')
      text = await extractResumeText(file)
    } catch (err) {
      setStep('error')
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Couldn't read this file. Try a different format or paste the text instead."
      )
      setShowPasteFallback(true)
      return
    }

    try {
      await parseResumeText(text)
    } catch (err) {
      setStep('error')
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Something went wrong while parsing your resume. Please try again.'
      )
      setShowPasteFallback(true)
    }
  }

  async function handlePasteSubmit(text: string) {
    setErrorMsg(null)
    await parseResumeText(text)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function retry() {
    setStep('idle')
    setErrorMsg(null)
  }

  const isProcessing = step === 'extracting' || step === 'parsing'

  if (isProcessing) {
    return (
      <div className="space-y-4 rounded-xl border-2 border-primary bg-primary/5 p-8">
        <div className="space-y-3">
          {[
            { label: 'File received', done: true },
            { label: 'Text extracted', done: step === 'parsing' },
            { label: 'Parsing with AI', done: false, active: step === 'parsing' },
          ].map(({ label, done, active }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              {done ? (
                <span className="w-5 font-bold text-green-600">OK</span>
              ) : active ? (
                <span className="inline-block h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <span className="w-5 text-muted-foreground">...</span>
              )}
              <span
                className={
                  done ? 'text-green-700' : active ? 'font-medium' : 'text-muted-foreground'
                }
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Usually takes 3-10 seconds.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="sr-only"
        aria-label="Upload resume"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processFile(file)
        }}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary hover:bg-primary/5'
        } ${step === 'error' ? 'border-destructive/50' : ''}`}
      >
        <Upload className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-semibold">Drop your resume here</p>
          <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX, or TXT • max 5 MB</p>
        </div>
        <span className="pointer-events-none rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
          Choose file
        </span>
      </div>

      {errorMsg && (
        <div className="flex flex-col gap-3 rounded-md bg-destructive/10 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <button
              type="button"
              onClick={() => setShowPasteFallback((current) => !current)}
              className="text-xs font-semibold text-destructive hover:underline"
            >
              {showPasteFallback ? 'Hide paste option' : 'Paste text instead'}
            </button>
          </div>
          <button
            type="button"
            onClick={retry}
            className="text-xs font-semibold text-destructive hover:underline"
          >
            Retry upload
          </button>
        </div>
      )}

      {(showPasteFallback || step === 'error') && (
        <ResumePasteFallback onSubmit={handlePasteSubmit} />
      )}
    </div>
  )
}
