"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { InviteEmail, MoaEmail, ReminderEmail, VerifiedEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { firstName } from "@/lib/format";
import { FORM_LABELS, FORM_ORDER, type FormKey, type Role } from "@/lib/types";
import { getViewer, type Viewer } from "@/lib/viewer";
import type { Result } from "@/lib/actions/student";

async function staff(adminOnly = false): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Sign in first.");
  const ok = adminOnly ? viewer.profile.role === "admin" : viewer.profile.role === "coordinator" || viewer.profile.role === "admin";
  if (!ok || !viewer.profile.school_id) throw new Error(adminOnly ? "Only admins can do that." : "Only school staff can do that.");
  return viewer;
}

function fail(e: unknown): { ok: false; error: string } {
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

export async function sendReminders(studentIds: string[], message?: string): Promise<Result<{ count: number }>> {
  try {
    const v = await staff();
    const ids = studentIds.filter(isUuid).slice(0, 500);
    const msg = (message ?? "").trim() || "Your coordinator sent a reminder: finish your resume and school forms.";
    const res = await v.supabase.rpc("send_reminders", { p_students: ids, p_message: msg });
    if (res.error) throw new Error(res.error.message);

    const [{ data: people }, { data: forms }] = await Promise.all([
      v.supabase.from("profiles").select("id, full_name, email").in("id", ids),
      v.supabase.from("student_forms").select("student_id, form_key, status").in("student_id", ids),
    ]);
    after(async () => {
      for (const p of people ?? []) {
        const missing = FORM_ORDER.filter((k) => (forms ?? []).some((f) => f.student_id === p.id && f.form_key === k && f.status === "missing")).map((k) => FORM_LABELS[k as FormKey]);
        await sendEmail(p.email, `A reminder from ${v.school?.short_name ?? "your school"}`, ReminderEmail({ name: firstName(p.full_name ?? ""), school: v.school?.name ?? "your school", message: msg, missing }));
      }
    });
    revalidatePath("/school", "layout");
    return { ok: true, data: { count: (res.data as number) ?? 0 } };
  } catch (e) {
    return fail(e);
  }
}

export async function endorseStudents(studentIds: string[]): Promise<Result<{ count: number }>> {
  try {
    const v = await staff();
    const res = await v.supabase.rpc("endorse_students", { p_students: studentIds.filter(isUuid) });
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/school", "layout");
    return { ok: true, data: { count: (res.data as number) ?? 0 } };
  } catch (e) {
    return fail(e);
  }
}

export async function sendMoas(companyIds?: string[]): Promise<Result<{ count: number }>> {
  try {
    const v = await staff();
    const { data: before } = await v.supabase.from("school_partners").select("company_id, moa_status, company:companies(name, work_email)").eq("school_id", v.profile.school_id!);
    const targets = (before ?? []).filter((p) => p.moa_status === "none" && (!companyIds || companyIds.includes(p.company_id as string)));
    const res = await v.supabase.rpc("send_moas", companyIds ? { p_companies: companyIds.filter(isUuid) } : {});
    if (res.error) throw new Error(res.error.message);
    after(async () => {
      for (const t of targets) {
        const c = t.company as unknown as { name: string; work_email: string | null } | null;
        if (c) await sendEmail(c.work_email, `${v.school?.name ?? "A school"} sent you an MOA`, MoaEmail({ company: c.name, school: v.school?.name ?? "A school" }));
      }
    });
    revalidatePath("/school", "layout");
    return { ok: true, data: { count: targets.length } };
  } catch (e) {
    return fail(e);
  }
}

export async function remindSupervisors(): Promise<Result<{ count: number }>> {
  try {
    const v = await staff();
    const res = await v.supabase.rpc("remind_supervisors");
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/school", "layout");
    return { ok: true, data: { count: (res.data as number) ?? 0 } };
  } catch (e) {
    return fail(e);
  }
}

export async function reviewForm(studentId: string, formKey: FormKey, approve: boolean): Promise<Result> {
  try {
    const v = await staff();
    const res = await v.supabase.rpc("review_form", { p_student: studentId, p_form: formKey, p_approve: approve });
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/school/forms");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function formFileUrl(path: string): Promise<Result<{ url: string }>> {
  try {
    const v = await staff();
    const res = await v.supabase.storage.from("forms").createSignedUrl(path, 120);
    if (res.error || !res.data) throw new Error(res.error?.message ?? "File not found.");
    return { ok: true, data: { url: res.data.signedUrl } };
  } catch (e) {
    return fail(e);
  }
}

export async function invitePeople(raw: string, role: Role, scope?: string): Promise<Result<{ count: number }>> {
  try {
    const v = await staff(role !== "student");
    const emails = [...new Set(raw.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)))].slice(0, 500);
    if (!emails.length) return { ok: false, error: "Add at least one email." };
    const res = await v.supabase.rpc("invite_people", { p_emails: emails, p_role: role, p_scope: scope?.trim() || null });
    if (res.error) throw new Error(res.error.message);
    after(async () => {
      for (const email of emails) {
        await sendEmail(email, `Join ${v.school?.name ?? "your school"} on Unisync`, InviteEmail({ school: v.school?.name ?? "your school", role, inviter: v.profile.full_name || "Your school", email }));
      }
    });
    revalidatePath("/school/people");
    return { ok: true, data: { count: (res.data as number) ?? emails.length } };
  } catch (e) {
    return fail(e);
  }
}

export async function setMember(userId: string, patch: { role?: Role; status?: "active" | "paused" }): Promise<Result> {
  try {
    const v = await staff(true);
    const res = await v.supabase.rpc("set_member", { p_user: userId, p_role: patch.role ?? null, p_status: patch.status ?? null });
    if (res.error) throw new Error(res.error.message);
    revalidatePath("/school/people");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function approveCompany(companyId: string): Promise<Result> {
  try {
    const v = await staff(true);
    const { data: c } = await v.supabase.from("companies").select("name, work_email").eq("id", companyId).single();
    const res = await v.supabase.rpc("approve_company", { p_company: companyId });
    if (res.error) throw new Error(res.error.message);
    if (c) after(() => sendEmail(c.work_email, `${c.name} is verified on Unisync`, VerifiedEmail({ company: c.name })));
    revalidatePath("/school", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}
