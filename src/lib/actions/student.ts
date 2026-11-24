"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { loadJobsFor, loadResume } from "@/lib/data";
import { ApplicationSentEmail, NewApplicantEmail, ResumeReadyEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { allowanceLabel, firstName } from "@/lib/format";
import { whyRecommend } from "@/lib/match";
import { currentResume, EMPTY_DRAFT, normalizeResume, type Draft } from "@/lib/resume";
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

const ItemSchema = z.object({
  title: z.string().max(120),
  line: z.string().max(300),
  bullets: z.array(z.string().max(200)).max(4).optional(),
  when: z.string().max(40).optional(),
  section: z.enum(["Leadership", "Work", "Volunteer", "Activities"]).optional(),
  kind: z.string().max(40).optional(),
});

const DraftSchema = z.object({
  course: z.string().max(120),
  name: z.string().min(1).max(120),
  language: z.enum(["English", "Filipino", "Taglish"]),
  capstone: z.string().max(800),
  capstoneItem: ItemSchema.nullable(),
  capstoneSkills: z.array(z.string().max(40)).max(8),
  experiences: z.array(z.string().max(40)).max(8),
  places: z.array(z.string().max(40)).max(12),
  minAllowance: z.number().int().min(0).max(100000),
  // The resume after the chat with Sync, when the student had one.
  refined: z
    .object({
      projects: z.array(ItemSchema).max(8),
      experience: z.array(ItemSchema).max(12),
      skills: z.array(z.string().max(40)).max(20),
      city: z.string().max(80).optional(),
      availability: z.string().max(80).optional(),
    })
    .nullable()
    .optional(),
});

export type TopJob = { id: string; title: string; company: string; city: string; mode: string; allowance: number; logo: string; logo_bg: string };

// The last step of onboarding: the student is signed in, so save the draft
// and whatever Sync refined in the chat.
export async function saveOnboarding(input: unknown, phone?: string): Promise<Result<{ matches: number; top: TopJob | null }>> {
  try {
    const viewer = await student();
    const parsed = DraftSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Some answers are missing. Go back and check them." };
    const { refined, ...answers } = parsed.data;
    const d = { ...EMPTY_DRAFT, ...answers, coach: null } as Draft;
    if (refined) d.coach = { resume: refined, messages: [], strikes: 0, sig: "", done: true, quickReplies: [] };
    const { profile, school, supabase } = viewer;

    const resume = normalizeResume(
      currentResume(d, { school: school?.name, email: profile.email ?? undefined, phone: phone || profile.phone || undefined, city: profile.city ?? undefined }),
      d.name.trim(),
    );
    const existing = await supabase.from("resumes").select("student_id").eq("student_id", profile.id).maybeSingle();

    const up = await supabase
      .from("profiles")
      .update({ full_name: d.name.trim(), course: d.course.trim(), ...(phone ? { phone } : {}), ...(resume.city ? { city: resume.city } : {}), last_active_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (up.error) throw new Error(up.error.message);
    const res = await supabase.from("resumes").upsert({ student_id: profile.id, data: resume, template: "classic" }, { onConflict: "student_id" });
    if (res.error) throw new Error(res.error.message);

    const jobs = await loadJobsFor({ ...viewer, profile: { ...profile, course: d.course, city: resume.city ?? profile.city } }, resume);
    const good = jobs.filter((j) => j.good);
    const best = good[0] ?? jobs[0];
    const top: TopJob | null = best
      ? { id: best.id, title: best.title, company: best.company.name, city: best.city, mode: best.mode, allowance: best.allowance, logo: best.company.logo, logo_bg: best.company.logo_bg }
      : null;

    if (!existing.data) {
      after(() =>
        sendEmail(
          profile.email,
          "Your resume is ready",
          ResumeReadyEmail({
            name: firstName(d.name),
            matches: good.length,
            skills: resume.skills,
            topJob: top ? { title: top.title, company: top.company, detail: `${top.city} · ${allowanceLabel(top.allowance)}` } : undefined,
          }),
        ),
      );
    }
    revalidatePath("/", "layout");
    return { ok: true, data: { matches: good.length, top } };
  } catch (e) {
    return fail(e);
  }
}

const ResumeSchema = z.object({
  name: z.string().min(1).max(120),
  course: z.string().max(120),
  school: z.string().max(160).optional(),
  email: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  availability: z.string().max(60).optional(),
  language: z.enum(["English", "Filipino", "Taglish"]).optional(),
  projects: z.array(ItemSchema).max(8),
  experience: z.array(ItemSchema).max(12),
  skills: z.array(z.string().max(40)).max(20),
  prefs: z.object({ places: z.array(z.string().max(40)).max(12), minAllowance: z.number().int().min(0).max(100000) }),
});

export async function saveResume(input: unknown, template?: Template): Promise<Result> {
  try {
    const viewer = await student();
    const parsed = ResumeSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields." };
    const data = normalizeResume(parsed.data) as ResumeData;
    // Students may update data, template and updated_at but only insert
    // student_id, data and template, so update first and insert if missing.
    // (An upsert needs insert rights on every column it sends.)
    const patch: Record<string, unknown> = { data, updated_at: new Date().toISOString() };
    if (template) patch.template = template;
    const upd = await viewer.supabase.from("resumes").update(patch).eq("student_id", viewer.profile.id).select("student_id");
    if (upd.error) throw new Error(upd.error.message);
    if (!upd.data?.length) {
      const ins = await viewer.supabase.from("resumes").insert({ student_id: viewer.profile.id, data, ...(template ? { template } : {}) });
      if (ins.error) throw new Error(ins.error.message);
    }
    await viewer.supabase.from("profiles").update({ full_name: data.name, course: data.course, city: data.city ?? null }).eq("id", viewer.profile.id);
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
