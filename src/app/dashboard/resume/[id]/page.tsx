import Link from 'next/link'
import { getResume } from '@/lib/actions/resume'
import { getProfile } from '@/lib/actions/profile'
import { ResumeBuilderForm } from '@/components/resume/ResumeBuilderForm'

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [resume, profile] = await Promise.all([getResume(id), getProfile()])

  return (
<<<<<<< HEAD
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6">
        <Link
          href="/dashboard/resumes"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to resumes
        </Link>
      </div>
      <ResumeBuilderForm resume={resume} profile={profile ?? {}} />
=======
    <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-10 lg:px-10">
      <div className="space-y-10">
        <header className="space-y-4">
          <Link
            href="/dashboard/resumes"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to resumes
          </Link>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Manual editing
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
              Shape the final resume
            </h1>
          </div>
        </header>
        <ResumeBuilderForm resume={resume} />
      </div>
>>>>>>> 180f651 (fix)
    </div>
  )
}
