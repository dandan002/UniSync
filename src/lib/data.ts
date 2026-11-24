import "server-only";
import { isMatch, matchJob, type Match } from "@/lib/match";
import { normalizeResume } from "@/lib/resume";
import { ResumeSchema } from "@/lib/resume-schema";
import type { Application, Company, Job, ResumeData, ResumeRow } from "@/lib/types";
import type { Viewer } from "@/lib/viewer";

export type JobCard = Job & {
  company: Company;
  partner: boolean;
  applied: boolean;
  saved: boolean;
  match: Match;
  good: boolean;
};

export async function loadResume(viewer: Viewer): Promise<{ row: ResumeRow | null; data: ResumeData }> {
  const { data } = await viewer.supabase.from("resumes").select("*").eq("student_id", viewer.profile.id).maybeSingle();
  const row = (data as ResumeRow | null) ?? null;
  const resume = normalizeResume(row?.data, viewer.profile.full_name);
  if (!resume.course && viewer.profile.course) resume.course = viewer.profile.course;
  if (!resume.school && viewer.school) resume.school = viewer.school.name;
  return { row, data: resume };
}

// Saves an existing resume's content after validating it. Returns what was
// stored, so callers can show exactly that.
export async function persistResume(viewer: Viewer, input: ResumeData): Promise<{ ok: true; data: ResumeData } | { ok: false; error: string }> {
  const parsed = ResumeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That change doesn't fit the resume format." };
  const data = normalizeResume(parsed.data);
  const res = await viewer.supabase.from("resumes").update({ data, updated_at: new Date().toISOString() }).eq("student_id", viewer.profile.id).select("student_id");
  if (res.error) return { ok: false, error: res.error.message };
  if (!res.data?.length) return { ok: false, error: "Save your resume first." };
  await viewer.supabase.from("profiles").update({ full_name: data.name, course: data.course, city: data.city ?? null }).eq("id", viewer.profile.id);
  return { ok: true, data };
}

// Open jobs at verified companies, ranked for this student.
export async function loadJobsFor(viewer: Viewer, resume: ResumeData): Promise<JobCard[]> {
  const sb = viewer.supabase;
  const [jobs, apps, saved, partners] = await Promise.all([
    sb.from("jobs").select("*, company:companies(*)").eq("status", "open").order("created_at", { ascending: false }),
    sb.from("applications").select("job_id").eq("student_id", viewer.profile.id),
    sb.from("saved_jobs").select("job_id").eq("student_id", viewer.profile.id),
    viewer.profile.school_id
      ? sb.from("school_partners").select("company_id, moa_status").eq("school_id", viewer.profile.school_id)
      : Promise.resolve({ data: [] as Array<{ company_id: string; moa_status: string }> }),
  ]);
  const appliedSet = new Set((apps.data ?? []).map((a) => a.job_id as string));
  const savedSet = new Set((saved.data ?? []).map((a) => a.job_id as string));
  const signed = new Set((partners.data ?? []).filter((p) => p.moa_status === "signed").map((p) => p.company_id as string));

  return ((jobs.data ?? []) as Array<Job & { company: Company | null }>)
    .filter((j): j is Job & { company: Company } => !!j.company && !!j.company.verified_at)
    .map((j) => {
      const match = matchJob(j, { resume, course: viewer.profile.course ?? resume.course, city: viewer.profile.city ?? resume.city });
      return { ...j, partner: signed.has(j.company_id), applied: appliedSet.has(j.id), saved: savedSet.has(j.id), match, good: isMatch(match) };
    })
    .sort((a, b) => Number(b.good) - Number(a.good) || b.match.score - a.match.score);
}

export type AppRow = Application & { job: Job & { company: Company } };

export async function loadApplications(viewer: Viewer): Promise<AppRow[]> {
  const { data } = await viewer.supabase
    .from("applications")
    .select("*, job:jobs(*, company:companies(*))")
    .eq("student_id", viewer.profile.id)
    .order("updated_at", { ascending: false });
  return ((data ?? []) as AppRow[]).filter((a) => a.job && a.job.company);
}
