'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { createResume } from '@/lib/actions/resume'

export function ResumeCreateButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleCreate() {
    setPending(true)
    try {
      const id = await createResume()
      router.push(`/dashboard/resume/${id}`)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      {pending ? 'Creating…' : 'Create resume'}
    </button>
  )
}
