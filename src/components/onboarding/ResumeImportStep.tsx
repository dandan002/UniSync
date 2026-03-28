'use client'

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { extractResumeText } from '@/lib/extract-resume-text'
import type { ParsedResume } from '@/lib/schemas'

type Step = 'idle' | 'uploading' | 'extracting' | 'parsing' | 'error'

interface Props {
  onParsed: (data: ParsedResume) => void
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export function ResumeImportStep({ onParsed }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    if (file.size > MAX_BYTES) {
      setErrorMsg('File too large — max 5 MB')
      return
    }

    setErrorMsg(null)
    setStep('uploading')

    let text: string
    try {
      setStep('extracting')
      text = await extractResumeText(file)
    } catch (err) {
      setStep('error')
      setErrorMsg(err instanceof Error ? err.message : "Couldn't read this file. Try a different format.")
      return
    }

    setStep('parsing')
    try {
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('Parse failed')
      const parsed: ParsedResume = await res.json()
      onParsed(parsed)
    } catch {
      setStep('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
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

  function handleDragLeave() { setDragging(false) }

  const isProcessing = step === 'uploading' || step === 'extracting' || step === 'parsing'

  function retry() {
    setStep('idle')
    setErrorMsg(null)
  }

  if (isProcessing) {
    return (
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-8 space-y-4">
        <div className="space-y-3">
          {[
            { label: 'File received', done: step !== 'uploading' },
            { label: 'Text extracted', done: step === 'parsing' },
            { label: 'Parsing with AI…', done: false, active: step === 'parsing' },
          ].map(({ label, done, active }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              {done ? (
                <span className="text-green-600 font-bold w-5">✓</span>
              ) : active ? (
                <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
              ) : (
                <span className="w-5 text-muted-foreground">○</span>
              )}
              <span className={done ? 'text-green-700' : active ? 'font-medium' : 'text-muted-foreground'}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Usually takes 3–5 seconds</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="sr-only"
        aria-label="Upload resume"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary hover:bg-primary/5'}
          ${step === 'error' ? 'border-destructive/50' : ''}`}
      >
        <Upload className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-semibold">Drop your resume here</p>
          <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, or TXT · max 5 MB</p>
        </div>
        <span className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground pointer-events-none">
          Choose file
        </span>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between rounded-md bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{errorMsg}</p>
          <button onClick={retry} className="text-xs font-semibold text-destructive hover:underline ml-4">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
