import { FileText } from 'lucide-react'

export default function ResumesPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Resumes</h1>
        <p className="text-muted-foreground mt-2">Build tailored resumes from your profile.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">No resumes yet</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Resume builder coming soon. Your profile data will power every resume you create.
        </p>
      </div>
    </div>
  )
}
