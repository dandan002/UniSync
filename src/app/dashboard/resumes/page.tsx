import Link from 'next/link'
import { listResumes } from '@/lib/actions/resume'
import { resumeTemplates } from '@/lib/resume'
import { ResumeCreateButton } from '@/components/resume/ResumeCreateButton'

function getTemplateName(templateId: string) {
  return resumeTemplates.find((template) => template.id === templateId)?.name ?? 'Unknown template'
}

export default async function ResumesPage() {
  const resumes = await listResumes()

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Resume Builder
          </p>
          <h1 className="font-display text-4xl font-bold text-foreground">Your resumes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create focused versions of your profile for different roles. Template previews and PDF
            export come next.
          </p>
        </div>
        <ResumeCreateButton />
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10">
          <h2 className="font-display text-2xl font-semibold">No resumes yet</h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Start with your saved profile and tailor the sections for a specific application.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ResumeCreateButton />
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Review profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resumes.map((resume) => {
            const enabledCount = resume.sections_config.filter((section) => section.enabled).length
            return (
              <Link
                key={resume.id}
                href={`/dashboard/resume/${resume.id}`}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {getTemplateName(resume.template_id)}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-foreground">
                  {resume.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {enabledCount} section{enabledCount === 1 ? '' : 's'} enabled
                </p>
                <p className="mt-6 text-xs text-muted-foreground">
                  Updated{' '}
                  {new Date(resume.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
