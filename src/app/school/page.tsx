import type { Metadata } from "next";
import { PageHead } from "@/components/shells";
import { ago, daysSince, plural, spell } from "@/lib/format";
import type { StudentOverview } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { Roster, SchoolActions, type Issue } from "./roster";

export const metadata: Metadata = { title: "Students" };

export default async function SchoolHome() {
  const viewer = await requireRole(["coordinator", "admin"]);
  const { supabase, school } = viewer;
  const [students, partners] = await Promise.all([
    supabase.from("student_overview").select("*").eq("school_id", viewer.profile.school_id!).order("full_name"),
    supabase.from("school_partners").select("company_id, moa_status, company:companies(name, verified_at)").eq("school_id", viewer.profile.school_id!),
  ]);
  const list = (students.data ?? []) as StudentOverview[];
  const total = list.length;
  const signedUp = list.filter((s) => s.resume_approved_at || s.app_count > 0 || s.forms_done > 0).length;
  const applied = list.filter((s) => s.app_count > 0).length;
  const interning = list.filter((s) => s.stage === "Interning").length;
  const formsPct = total ? Math.round((list.reduce((n, s) => n + s.forms_done, 0) / (total * 6)) * 100) : 0;

  const idle = list.filter((s) => daysSince(s.last_active_at) >= 14);
  const needMoa = (partners.data ?? []).filter((p) => p.moa_status !== "signed" && (p.company as unknown as { verified_at: string | null } | null)?.verified_at);
  const pendingLogs = list.reduce((n, s) => n + s.pending_logs, 0);

  const issues: Issue[] = [
    { id: "idle", text: idle.length ? `${plural(idle.length, "student").replace(/^./, (c) => c.toUpperCase())} inactive for two weeks` : "No inactive students", action: "Send reminder", ids: idle.map((s) => s.id), tone: "lilac", done: idle.length === 0 },
    {
      id: "moa",
      text: needMoa.length ? `${spell(needMoa.length, true)} ${needMoa.length === 1 ? "company needs" : "companies need"} a signed MOA` : "Every partner has a signed MOA",
      action: "Send MOAs",
      ids: needMoa.map((p) => p.company_id as string),
      tone: "lilac",
      done: needMoa.length === 0,
    },
    {
      id: "dtr",
      text: pendingLogs ? `${spell(pendingLogs, true)} time ${pendingLogs === 1 ? "log awaits" : "logs await"} supervisor approval` : "No time logs waiting",
      action: "Remind supervisors",
      ids: [],
      tone: "soft",
      done: pendingLogs === 0,
    },
  ];

  return (
    <>
      <PageHead kicker={school?.term_label ?? "OJT"} title={viewer.profile.scope ? `${viewer.profile.scope}, fourth year` : "Your students"} actions={<SchoolActions />} />

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(200px,100%),1fr))" }}>
        <Kpi label="Signed up" value={String(signedUp)} sub={`of ${total} students`} />
        <Kpi label="Applied" value={String(applied)} sub="at least once" />
        <Kpi label="Interning" value={String(interning)} sub="placed" accent />
        <Kpi label="Forms complete" value={`${formsPct}%`} sub="class average" accent />
      </div>

      <Roster
        issues={issues}
        requiredHours={school?.required_hours ?? 486}
        rows={list.map((s) => ({
          id: s.id,
          name: s.full_name || s.email || "Student",
          stage: s.stage,
          forms: s.forms_done,
          hours: Number(s.hours),
          host: s.host_company ?? "—",
          active: ago(s.last_active_at),
          idle: daysSince(s.last_active_at) >= 14,
        }))}
      />
    </>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="card flex flex-col gap-1 p-5">
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--muted)" }}>{label}</span>
      <span className="display" style={{ fontSize: 40, fontVariantNumeric: "tabular-nums", color: accent ? "var(--accent)" : "var(--ink)" }}>
        {value}
      </span>
      <span style={{ fontSize: 14, color: "var(--muted)" }}>{sub}</span>
    </div>
  );
}
