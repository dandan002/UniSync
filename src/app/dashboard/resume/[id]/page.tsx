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
    </div>
  )
}
