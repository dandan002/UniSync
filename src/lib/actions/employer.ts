"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { InterviewEmail, MessageEmail, OfferEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { allowanceLabel, firstName, whenLabel } from "@/lib/format";
import type { AppStatus } from "@/lib/types";
import { getViewer, type Viewer } from "@/lib/viewer";
import type { Result } from "@/lib/actions/student";

async function supervisor(needCompany = true): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Sign in first.");
  if (viewer.profile.role !== "supervisor") throw new Error("Only company accounts can do that.");
  if (needCompany && !viewer.profile.company_id) throw new Error("Register your company first.");
  return viewer;
}

function fail(e: unknown): { ok: false; error: string } {
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}

type AppDetail = { id: string; status: AppStatus; student: { full_name: string; email: string | null }; job: { title: string; city: string; allowance: number } };

async function loadApp(v: Viewer, id: string): Promise<AppDetail> {
  const { data, error } = await v.supabase
    .from("applications")
    .select("id, status, student:profiles!applications_student_id_fkey(full_name, email), job:jobs(title, city, allowance)")
    .eq("id", id)
    .single();
  if (error || !data) throw new Error("Applicant not found.");
  return data as unknown as AppDetail;
}

const STATUSES: AppStatus[] = ["new", "reviewing", "interview", "offer", "declined"];

export async function moveApplicant(applicationId: string, status: AppStatus): Promise<Result> {
  try {
    const v = await supervisor();
    if (!STATUSES.includes(status)) return { ok: false, error: "Unknown stage." };
    const app = await loadApp(v, applicationId);
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status !== "new") patch.viewed_at = new Date().toISOString();
    const res = await v.supabase.from("applications").update(patch).eq("id", applicationId);
    if (res.error) throw new Error(res.error.message);
    if (status === "offer" && app.status !== "offer") {
      after(() =>
        sendEmail(app.student.email, `${v.company?.name} sent you an offer`, OfferEmail({ name: firstName(app.student.full_name), company: v.company?.name ?? "", job: app.job.title, detail: `${app.job.city} · ${allowanceLabel(app.job.allowance)}` })),
      );
    }
    revalidatePath("/employer");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function markViewed(applicationId: string): Promise<Result> {
  try {
    const v = await supervisor();
    await v.supabase.from("applications").update({ viewed_at: new Date().toISOString() }).eq("id", applicationId).is("viewed_at", null);
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function scheduleInterview(applicationId: string, at: string, where: string): Promise<Result> {
  try {
    const v = await supervisor();
    const when = new Date(at);
    if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() - 60_000) return { ok: false, error: "Pick a time in the future." };
    if (!where.trim()) return { ok: false, error: "Add where the interview happens." };
    const app = await loadApp(v, applicationId);
    const res = await v.supabase
      .from("applications")
      .update({ status: "interview", interview_at: when.toISOString(), interview_where: where.trim().slice(0, 200), viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", applicationId);
    if (res.error) throw new Error(res.error.message);
    after(() =>
      sendEmail(app.student.email, `${v.company?.name} wants to interview you`, InterviewEmail({ name: firstName(app.student.full_name), company: v.company?.name ?? "", job: app.job.title, when: whenLabel(when.toISOString()), where: where.trim() })),
    );
    revalidatePath("/employer");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function messageApplicant(applicationId: string, body: string): Promise<Result<{ status: "sent" | "blocked" }>> {
  try {
    const v = await supervisor();
    const text = body.trim();
    if (!text) return { ok: false, error: "Write a message first." };
    const res = await v.supabase.rpc("send_message", { p_application: applicationId, p_body: text });
    if (res.error) throw new Error(res.error.message);
    const status = res.data as "sent" | "blocked";
    if (status === "sent") {
      const app = await loadApp(v, applicationId);
      after(() => sendEmail(app.student.email, `Message from ${v.company?.name}`, MessageEmail({ name: firstName(app.student.full_name), company: v.company?.name ?? "", body: text })));
    }
    return { ok: true, data: { status } };
  } catch (e) {
    return fail(e);
  }
}

export async function approveHours(): Promise<Result<{ count: number }>> {
  try {
    const v = await supervisor();
    const res = await v.supabase.rpc("approve_hours");
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/employer", "layout");
    return { ok: true, data: { count: (res.data as number) ?? 0 } };
  } catch (e) {
    return fail(e);
  }
}

export async function signMoa(schoolId: string): Promise<Result> {
  try {
    const v = await supervisor();
    const res = await v.supabase.rpc("sign_moa", { p_school: schoolId });
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/employer", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

const lines = (max: number) =>
  z
    .string()
    .max(2000)
    .transform((s) => s.split("\n").map((x) => x.replace(/^[-•*]\s*/, "").trim()).filter(Boolean).slice(0, max));

const JobSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Add a title.").max(120),
  city: z.string().trim().min(1, "Add a city.").max(80),
  mode: z.enum(["On-site", "Hybrid", "Remote"]),
  allowance: z.coerce.number().int().min(0).max(200000),
  schedule: z.string().trim().max(120),
  dates: z.string().trim().max(120),
  hours: z.coerce.number().int().min(1).max(2000),
  openings: z.coerce.number().int().min(1).max(100),
  teaser: z.string().trim().max(160),
  about: z.string().trim().max(1200),
  duties: lines(8),
  needs: lines(8),
  perks: lines(8),
  programs: z.string().max(400).transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10)),
  skills: z.string().max(400).transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12)),
});

export async function saveJob(form: Record<string, string>): Promise<Result<{ id: string }>> {
  try {
    const v = await supervisor();
    const parsed = JobSchema.safeParse(form);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
    const { id, ...job } = parsed.data;
    const row = { ...job, company_id: v.profile.company_id! };
    const res = id ? await v.supabase.from("jobs").update(row).eq("id", id).select("id").single() : await v.supabase.from("jobs").insert(row).select("id").single();
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/employer", "layout");
    return { ok: true, data: { id: res.data.id as string } };
  } catch (e) {
    return fail(e);
  }
}

export async function setJobStatus(id: string, status: "open" | "closed"): Promise<Result> {
  try {
    const v = await supervisor();
    const res = await v.supabase.from("jobs").update({ status }).eq("id", id);
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/employer", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

const CompanySchema = z.object({
  name: z.string().trim().min(2, "Add your company name.").max(120),
  registration_type: z.enum(["SEC", "DTI"]),
  registration_no: z.string().trim().min(4, "Add your SEC or DTI registration number.").max(40),
  work_email: z.string().trim().email("Add a valid work email.").max(160),
  phone: z.string().trim().min(7, "Add a phone number.").max(32),
  city: z.string().trim().min(1, "Add your city.").max(80),
  about: z.string().trim().max(600).optional().default(""),
});

export async function registerCompany(form: Record<string, string>): Promise<Result<{ id: string }>> {
  try {
    const v = await supervisor(false);
    if (v.profile.company_id) return { ok: false, error: "Your account already has a company." };
    const parsed = CompanySchema.safeParse(form);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
    const c = parsed.data;
    const res = await v.supabase.rpc("register_company", {
      p_name: c.name,
      p_registration_type: c.registration_type,
      p_registration_no: c.registration_no,
      p_work_email: c.work_email,
      p_phone: c.phone,
      p_city: c.city,
      p_about: c.about || null,
    });
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/", "layout");
    return { ok: true, data: { id: res.data as string } };
  } catch (e) {
    return fail(e);
  }
}
