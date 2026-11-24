import type { Metadata } from "next";
import { PageHead } from "@/components/shells";
import { ago, apDate, apTime, daysSince } from "@/lib/format";
import type { AuditEntry, Company, Invite, Profile } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { PeopleTabs, type CompanyCheck, type Person } from "./tabs";

export const metadata: Metadata = { title: "People" };

function when(iso: string): string {
  const d = new Date(iso);
  const days = daysSince(iso);
  if (days === 0) return `Today, ${apTime(d)}`;
  if (days === 1) return "Yesterday";
  return apDate(d);
}

const CHECK: Record<string, { v: string; ok: boolean }> = {
  confirmed: { v: "Matches", ok: true },
  pending: { v: "Pending", ok: false },
  failed: { v: "Didn't match", ok: false },
};

export default async function PeoplePage() {
  const viewer = await requireRole(["coordinator", "admin"]);
  const { supabase, profile } = viewer;
  const isAdmin = profile.role === "admin";
  const [people, invites, audit, companies] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("invites").select("*").is("accepted_at", null).order("created_at", { ascending: false }),
    supabase.from("audit_log").select("*").eq("school_id", profile.school_id!).order("created_at", { ascending: false }).limit(40),
    isAdmin ? supabase.from("companies").select("*").order("verified_at", { ascending: true, nullsFirst: true }) : Promise.resolve({ data: [] as Company[] }),
  ]);

  const list: Person[] = ((people.data ?? []) as Profile[]).map((p) => ({
    id: p.id,
    name: p.full_name || p.email || "—",
    email: p.email ?? "",
    role: p.role,
    scope: p.scope ?? (p.role === "student" ? "Student" : "—"),
    status: p.status === "paused" ? "Paused" : "Active",
    last: p.id === profile.id ? "Now" : ago(p.last_active_at),
    self: p.id === profile.id,
    editable: isAdmin && p.school_id === profile.school_id && p.role !== "supervisor" && p.id !== profile.id,
  }));
  for (const i of (invites.data ?? []) as Invite[]) {
    list.push({ id: `invite-${i.id}`, name: i.email.split("@")[0]!.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), email: i.email, role: i.role, scope: i.scope ?? "—", status: "Invited", last: "—", self: false, editable: false });
  }

  const checks: CompanyCheck[] = ((companies.data ?? []) as Company[]).map((c) => ({
    id: c.id,
    name: c.name,
    verified: !!c.verified_at,
    checks: [
      { n: `${c.registration_type} record`, ...(CHECK[c.registration_check] ?? CHECK.pending) },
      { n: "Work email", v: c.email_check === "failed" ? "Personal email" : c.email_check === "confirmed" ? "Confirmed" : "Pending", ok: c.email_check === "confirmed" },
      { n: "Phone check", v: c.phone_check === "confirmed" ? "Done" : c.phone_check === "failed" ? "Failed" : "Pending", ok: c.phone_check === "confirmed" },
    ],
  }));

  return (
    <>
      <PageHead kicker={viewer.school?.name} title="People" />
      <PeopleTabs
        isAdmin={isAdmin}
        people={list}
        companies={checks}
        audit={((audit.data ?? []) as AuditEntry[]).map((a) => ({ id: a.id, t: when(a.created_at), who: a.actor_name, what: a.action }))}
        emailDomain={viewer.school?.email_domain ?? "school.edu.ph"}
      />
    </>
  );
}
