import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadApplications } from "@/lib/data";
import { ago, apDate, firstName, until, whenLabel } from "@/lib/format";
import { FORM_LABELS, FORM_ORDER, UPLOADABLE, type Notification, type StudentForm, type TimeLog } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { HomeView, type AppView, type Hero } from "./view";

export const metadata: Metadata = { title: "Home" };

const STATUS: Record<string, { label: string; color: string }> = {
  new: { label: "Waiting", color: "var(--muted)" },
  reviewing: { label: "Viewed", color: "var(--ink)" },
  interview: { label: "Interview", color: "var(--accent)" },
  offer: { label: "Offer", color: "var(--accent)" },
  hired: { label: "Interning", color: "var(--accent)" },
  declined: { label: "Position filled", color: "var(--faint)" },
  withdrawn: { label: "Withdrawn", color: "var(--faint)" },
};

export default async function HomePage() {
  const viewer = await requireRole(["student"]);
  const { supabase, profile, school } = viewer;
  const { data: resume } = await supabase.from("resumes").select("student_id, approved_at").eq("student_id", profile.id).maybeSingle();
  if (!resume) redirect("/start");

  const [apps, notes, forms, logs] = await Promise.all([
    loadApplications(viewer),
    supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("student_forms").select("*").eq("student_id", profile.id),
    supabase.from("time_logs").select("*").eq("student_id", profile.id).order("work_date", { ascending: false }),
  ]);
  const now = new Date();

  const appViews: AppView[] = apps.map((a) => {
    const s = STATUS[a.status] ?? STATUS.new;
    let status = s.label;
    let detail = `Sent ${apDate(new Date(a.created_at))}.`;
    if (a.viewed_at) detail += ` Viewed ${apDate(new Date(a.viewed_at))}.`;
    if (a.status === "interview" && a.interview_at) {
      status = new Date(a.interview_at) > now ? `Interview ${whenLabel(a.interview_at).split(",")[0]}` : "Interviewed";
      detail += ` Interview ${whenLabel(a.interview_at)}${a.interview_where ? `, ${a.interview_where}` : ""}.`;
    }
    if (a.status === "new") detail += " Most companies reply within three days.";
    if (a.status === "offer") detail = `${a.job.company.name} sent you an offer. Accept it to start your placement forms.`;
    if (a.status === "declined") detail = "Filled by another candidate. Similar roles are open on the Jobs tab.";
    if (a.status === "hired") detail = `You're interning here. ${a.job.hours} hours required.`;
    return {
      id: a.id,
      role: a.job.title,
      company: a.job.company.name,
      logo: a.job.company.logo,
      logo_bg: a.job.company.logo_bg,
      status,
      statusKey: a.status,
      color: s.color,
      detail,
    };
  });

  const formList = (forms.data ?? []) as StudentForm[];
  const done = formList.filter((f) => f.status !== "missing").length;
  const missing = FORM_ORDER.filter((k) => formList.find((f) => f.form_key === k)?.status === "missing");

  const timeLogs = (logs.data ?? []) as TimeLog[];
  const approvedHours = timeLogs.filter((t) => t.status === "approved").reduce((n, t) => n + Number(t.hours), 0);
  const pendingHours = timeLogs.filter((t) => t.status === "pending").reduce((n, t) => n + Number(t.hours), 0);
  const required = school?.required_hours ?? 486;

  const upcoming = apps
    .filter((a) => a.status === "interview" && a.interview_at && new Date(a.interview_at) > now)
    .sort((a, b) => Date.parse(a.interview_at!) - Date.parse(b.interview_at!))[0];
  const offer = apps.find((a) => a.status === "offer");
  const hired = apps.find((a) => a.status === "hired");

  let hero: Hero;
  if (offer) {
    hero = { kind: "offer", kicker: "New offer", title: `Offer from ${offer.job.company.name}`, sub: `${offer.job.title} · ${offer.job.city}`, applicationId: offer.id };
  } else if (upcoming) {
    hero = {
      kind: "interview",
      kicker: until(upcoming.interview_at!, now),
      title: `Interview with ${upcoming.job.company.name}`,
      sub: `${whenLabel(upcoming.interview_at!)}${upcoming.interview_where ? `, ${upcoming.interview_where}` : ""}`,
      calendar: {
        title: `Interview with ${upcoming.job.company.name}`,
        start: upcoming.interview_at!,
        where: upcoming.interview_where ?? "",
      },
    };
  } else if (hired) {
    hero = {
      kind: "interning",
      kicker: `Interning at ${hired.job.company.name}`,
      title: `${Math.round(approvedHours)} of ${required} hours`,
      sub: pendingHours ? `${pendingHours} more hours wait for your supervisor.` : "Log your hours each day you work.",
      pct: Math.min(100, Math.round((approvedHours / required) * 100)),
    };
  } else if (!resume.approved_at) {
    hero = { kind: "resume", kicker: "Next step", title: "Approve your resume", sub: "Then apply to internships at verified companies." };
  } else {
    hero = { kind: "apply", kicker: apps.length ? "Keep going" : "Next step", title: apps.length ? "Apply to two more internships" : "Apply to your first internship", sub: "Most students hear back within a week." };
  }

  return (
    <HomeView
      studentId={profile.id}
      name={firstName(profile.full_name) || "there"}
      hero={hero}
      apps={appViews}
      notes={((notes.data ?? []) as Notification[]).map((n) => ({ id: n.id, title: n.title, when: ago(n.created_at, now), kind: n.kind, unread: !n.read_at }))}
      forms={{ done, total: 6, missing: missing.map((k) => FORM_LABELS[k].toLowerCase()), uploadable: missing.filter((k) => UPLOADABLE.includes(k)) }}
      interning={!!hired}
      recentLogs={timeLogs.slice(0, 4).map((t) => ({ id: t.id, date: apDate(new Date(`${t.work_date}T12:00:00+08:00`)), hours: Number(t.hours), status: t.status, note: t.note }))}
    />
  );
}
