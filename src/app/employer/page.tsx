import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/shells";
import { spell } from "@/lib/format";
import { matchJob, whyRecommend } from "@/lib/match";
import { normalizeResume } from "@/lib/resume";
import type { Application, Job, Profile, ResumeRow, School } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { Board, type Candidate } from "./board";

export const metadata: Metadata = { title: "Applicants" };

type Row = Application & {
  student: Profile & { school: Pick<School, "id" | "short_name" | "required_hours"> | null };
};

export default async function ApplicantsPage({ searchParams }: PageProps<"/employer">) {
  const viewer = await requireRole(["supervisor"]);
  const { supabase, company } = viewer;
  const sp = await searchParams;
  const { data: jobsData } = await supabase.from("jobs").select("*").eq("company_id", company!.id).order("created_at", { ascending: false });
  const jobs = (jobsData ?? []) as Job[];
  const job = jobs.find((j) => j.id === sp.job) ?? jobs.find((j) => j.status === "open") ?? jobs[0];

  if (!job) {
    return (
      <>
        <PageHead kicker={company!.verified_at ? "No jobs yet" : "Your company is in review"} title="Post your first internship" />
        <p className="m-0 max-w-[560px]" style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6 }}>
          {company!.verified_at
            ? "Students see your jobs with a verified badge. Sync suggests the closest matches and never filters by age, gender or photo."
            : "We check your SEC or DTI record, work email and phone. You can draft jobs now; they go live once you're verified."}
        </p>
        <Link href="/employer/jobs?new=1" className="btn btn-p self-start">
          Post a job
        </Link>
      </>
    );
  }

  const [apps, pending, schools] = await Promise.all([
    supabase
      .from("applications")
      .select("*, student:profiles!applications_student_id_fkey(*, school:schools(id, short_name, required_hours))")
      .eq("job_id", job.id)
      .order("created_at", { ascending: true }),
    supabase.from("time_logs").select("student_id").eq("company_id", company!.id).eq("status", "pending"),
    supabase.from("school_partners").select("school_id, moa_status").eq("company_id", company!.id),
  ]);
  const rows = ((apps.data ?? []) as Row[]).filter((r) => r.student);
  const ids = rows.map((r) => r.student_id);
  const { data: resumes } = ids.length ? await supabase.from("resumes").select("*").in("student_id", ids) : { data: [] };
  const byStudent = new Map(((resumes ?? []) as ResumeRow[]).map((r) => [r.student_id, r]));
  const signed = new Set((schools.data ?? []).filter((s) => s.moa_status === "signed").map((s) => s.school_id as string));

  const candidates: Candidate[] = rows
    .filter((r) => r.status !== "hired" && r.status !== "withdrawn")
    .map((r) => {
      const resume = normalizeResume(byStudent.get(r.student_id)?.data, r.student.full_name);
      const m = matchJob(job, { resume, course: r.student.course, city: r.student.city });
      const line = resume.projects[0] ? `${resume.projects[0].line}` : resume.experience[0]?.line ?? "";
      return {
        id: r.id,
        studentId: r.student_id,
        name: r.student.full_name || "Student",
        school: [r.student.school?.short_name, shortCourse(r.student.course ?? resume.course)].filter(Boolean).join(" · ") || "Independent",
        verifiedBySchool: !!r.student.school,
        city: r.student.city ?? resume.city ?? "—",
        avail: resume.availability ?? "—",
        hours: String(r.student.school?.required_hours ?? job.hours),
        moa: r.student.school ? (signed.has(r.student.school.id) ? "Yes" : "No") : "—",
        line: r.status === "interview" && r.interview_at ? `Interview set for ${new Date(r.interview_at).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "Asia/Manila" })}.` : line,
        why: whyRecommend(job, resume, r.student.city),
        exp: [...resume.projects.map((p) => `${p.title}${p.when ? ` (${p.when})` : ""}`), ...resume.experience.map((e) => `${e.title}: ${e.line}`)].slice(0, 5),
        skills: resume.skills,
        score: m.score,
        status: r.status === "declined" ? "declined" : (r.status as Candidate["status"]),
        interviewAt: r.interview_at,
        interviewWhere: r.interview_where,
        viewed: !!r.viewed_at,
      };
    });

  const schoolsCount = new Set(rows.map((r) => r.student.school?.id ?? r.student_id)).size;
  const loggers = new Set((pending.data ?? []).map((p) => p.student_id as string)).size;

  return (
    <>
      <PageHead
        kicker={`${spell(rows.length, true)} ${rows.length === 1 ? "applicant" : "applicants"} from ${spell(schoolsCount)} ${schoolsCount === 1 ? "school" : "schools"}, ${spell(job.openings)} ${job.openings === 1 ? "opening" : "openings"}`}
        title={job.title}
        actions={
          <>
            <Link className="btn btn-sm" href={`/employer/jobs?edit=${job.id}`}>
              Edit job
            </Link>
            <Link className="btn btn-sm btn-p" href="/employer/jobs?new=1">
              Post a job
            </Link>
          </>
        }
      />
      {jobs.length > 1 ? (
        <nav aria-label="Jobs" className="flex flex-wrap gap-2">
          {jobs.map((j) => (
            <Link key={j.id} href={`/employer?job=${j.id}`} className="chip" aria-pressed={j.id === job.id} style={j.id === job.id ? { background: "var(--soft)", border: "1px solid #B8C1FA" } : undefined}>
              {j.title}
              {j.status === "closed" ? " (closed)" : ""}
            </Link>
          ))}
        </nav>
      ) : null}
      {!company!.verified_at ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl px-5 py-4" style={{ background: "var(--lilac-soft)" }}>
          <span className="flex-1" style={{ fontSize: 16, fontWeight: 500 }}>
            Your company is in review. Students see your jobs once we verify your records.
          </span>
        </div>
      ) : null}
      <Board candidates={candidates} loggers={loggers} />
    </>
  );
}

function shortCourse(c: string | null | undefined): string {
  if (!c) return "";
  const map: Record<string, string> = {
    "information technology": "BSIT",
    "computer science": "BSCS",
    "information systems": "BSIS",
    "industrial engineering": "BSIE",
    "business admin": "BSBA",
    accountancy: "BSA",
  };
  const k = c.toLowerCase().replace(/^bs\s+/, "");
  return map[k] ?? c;
}
