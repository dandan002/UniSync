"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { loadJobsFor, loadResume, persistResume } from "@/lib/data";
import { ApplicationSentEmail, NewApplicantEmail, ResumeReadyEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { allowanceLabel, firstName } from "@/lib/format";
import { whyRecommend } from "@/lib/match";
import { draftToResume, EMPTY_DRAFT, type Draft } from "@/lib/resume";
import { ItemSchema, ResumeSchema } from "@/lib/resume-schema";
import type { Company, Job, ResumeData, Template } from "@/lib/types";
import { getViewer, type Viewer } from "@/lib/viewer";

export type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

async function student(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Sign in first.");
  if (viewer.profile.role !== "student") throw new Error("Only students can do that.");
  return viewer;
}

function fail(e: unknown): { ok: false; error: string } {
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}

const DraftSchema = z.object({
  course: z.string().max(120),
  name: z.string().min(1).max(120),
  language: z.enum(["English", "Filipino", "Taglish"]),
  capstone: z.string().max(800),
  capstoneItem: ItemSchema.nullable(),
  capstoneSkills: z.array(z.string().max(40)).max(8),
  experiences: z.array(z.string().max(40)).max(8),
  followup: z.string().max(800),
  followupItem: ItemSchema.nullable(),
  followupSkills: z.array(z.string().max(40)).max(8),
  places: z.array(z.string().max(40)).max(12),
  minAllowance: z.number().int().min(0).max(100000),
});

export type TopJob = { id: string; title: string; company: string; city: string; mode: string; allowance: number; logo: string; logo_bg: string };

export type MatchSummary = { matches: number; top: TopJob | null };

async function matchSummary(viewer: Viewer, resume: ResumeData, course?: string): Promise<MatchSummary> {
  const jobs = await loadJobsFor(course ? { ...viewer, profile: { ...viewer.profile, course } } : viewer, resume);
  const good = jobs.filter((j) => j.good);
  const best = good[0] ?? jobs[0];
  const top: TopJob | null = best
    ? { id: best.id, title: best.title, company: best.company.name, city: best.city, mode: best.mode, allowance: best.allowance, logo: best.company.logo, logo_bg: best.company.logo_bg }
    : null;
  return { matches: good.length, top };
}

// Step 8 of onboarding: the student is signed in, so save the draft. Returns
// the saved resume so Sync can refine it next.
export async function saveOnboarding(input: unknown, phone?: string): Promise<Result<MatchSummary & { resume: ResumeData; studentId: string }>> {
  try {
    const viewer = await student();
    const parsed = DraftSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Some answers are missing. Go back and check them." };
    const d = { ...EMPTY_DRAFT, ...parsed.data } as Draft;
    const { profile, school, supabase } = viewer;

    const resume = draftToResume(d, { school: school?.name, email: profile.email ?? undefined, phone: phone || profile.phone || undefined });
    const existing = await supabase.from("resumes").select("student_id").eq("student_id", profile.id).maybeSingle();

    const up = await supabase.from("profiles").update({ full_name: d.name.trim(), course: d.course.trim(), ...(phone ? { phone } : {}), last_active_at: new Date().toISOString() }).eq("id", profile.id);
    if (up.error) throw new Error(up.error.message);
    const res = await supabase.from("resumes").upsert({ student_id: profile.id, data: resume, template: "classic" }, { onConflict: "student_id" });
    if (res.error) throw new Error(res.error.message);

    const { matches, top } = await matchSummary(viewer, resume, d.course);

    if (!existing.data) {
      after(() =>
        sendEmail(
          profile.email,
          "Your resume is ready",
          ResumeReadyEmail({
            name: firstName(d.name),
            matches,
            skills: resume.skills,
            topJob: top ? { title: top.title, company: top.company, detail: `${top.city} · ${allowanceLabel(top.allowance)}` } : undefined,
          }),
        ),
      );
    }
    revalidatePath("/", "layout");
    return { ok: true, data: { matches, top, resume, studentId: profile.id } };
  } catch (e) {
    return fail(e);
  }
}

// Matches for the resume as saved now, after Sync's edits.
export async function refreshMatches(): Promise<Result<MatchSummary>> {
  try {
    const viewer = await student();
    const { data } = await loadResume(viewer);
    return { ok: true, data: await matchSummary(viewer, data) };
  } catch (e) {
    return fail(e);
  }
}

// Saves edits to an existing resume. Updates rather than upserts: students
// may only insert student_id, data and template, so an upsert carrying
// updated_at is refused.
export async function saveResume(input: unknown, template?: Template): Promise<Result> {
  try {
    const viewer = await student();
    const parsed = ResumeSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields." };
    if (template && !["classic", "modern", "compact"].includes(template)) return { ok: false, error: "Unknown template." };
    const res = await persistResume(viewer, parsed.data as ResumeData);
    if (!res.ok) throw new Error(res.error);
    if (template) {
      const t = await viewer.supabase.from("resumes").update({ template }).eq("student_id", viewer.profile.id);
      if (t.error) throw new Error(t.error.message);
    }
    revalidatePath("/resume");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function setTemplate(template: Template): Promise<Result> {
  try {
    const viewer = await student();
    if (!["classic", "modern", "compact"].includes(template)) return { ok: false, error: "Unknown template." };
    const res = await viewer.supabase.from("resumes").update({ template }).eq("student_id", viewer.profile.id);
    if (res.error) throw new Error(res.error.message);
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function approveResume(): Promise<Result> {
  try {
    const viewer = await student();
    const res = await viewer.supabase.rpc("approve_resume");
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function applyToJob(jobId: string): Promise<Result<{ company: string }>> {
  try {
    const viewer = await student();
    const { supabase, profile, school } = viewer;
    const { data: job } = await supabase.from("jobs").select("*, company:companies(*)").eq("id", jobId).single();
    if (!job) return { ok: false, error: "That job is no longer open." };
    const j = job as Job & { company: Company };
    const ins = await supabase.from("applications").insert({ job_id: jobId, student_id: profile.id });
    if (ins.error && ins.error.code !== "23505") throw new Error(ins.error.code === "42501" ? "That job isn't taking applications." : ins.error.message);

    const { data: resume } = await loadResume(viewer);
    after(async () => {
      await sendEmail(profile.email, `Application sent to ${j.company.name}`, ApplicationSentEmail({ name: firstName(profile.full_name), job: j.title, company: j.company.name, detail: `${j.city} · ${allowanceLabel(j.allowance)}` }));
      await sendEmail(
        j.company.work_email,
        `${profile.full_name || "A student"} applied to ${j.title}`,
        NewApplicantEmail({ company: j.company.name, student: profile.full_name || "A student", school: school?.name ?? "", job: j.title, why: whyRecommend(j, resume, profile.city) }),
      );
    });
    revalidatePath("/jobs");
    revalidatePath("/home");
    return { ok: true, data: { company: j.company.name } };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleSavedJob(jobId: string, save: boolean): Promise<Result> {
  try {
    const viewer = await student();
    const q = save
      ? viewer.supabase.from("saved_jobs").upsert({ student_id: viewer.profile.id, job_id: jobId })
      : viewer.supabase.from("saved_jobs").delete().eq("student_id", viewer.profile.id).eq("job_id", jobId);
    const res = await q;
    if (res.error) throw new Error(res.error.message);
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function acceptOffer(applicationId: string): Promise<Result> {
  try {
    const viewer = await student();
    const res = await viewer.supabase.rpc("accept_offer", { p_application: applicationId });
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/home");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function logHours(date: string, hours: number, note: string): Promise<Result> {
  try {
    const viewer = await student();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Pick a date." };
    if (!(hours > 0 && hours <= 12)) return { ok: false, error: "Log between 0.5 and 12 hours." };
    const res = await viewer.supabase.rpc("log_hours", { p_date: date, p_hours: hours, p_note: note.slice(0, 300) });
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/home");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function submitForm(formKey: string, path: string): Promise<Result> {
  try {
    const viewer = await student();
    const res = await viewer.supabase.rpc("submit_form", { p_form: formKey, p_path: path });
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function markUpdatesRead(): Promise<Result> {
  try {
    const viewer = await student();
    await viewer.supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", viewer.profile.id).is("read_at", null);
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}
