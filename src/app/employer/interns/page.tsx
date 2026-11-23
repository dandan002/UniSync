import type { Metadata } from "next";
import { Avatar } from "@/components/brand";
import { PageHead } from "@/components/shells";
import { apDate, hoursLabel } from "@/lib/format";
import type { MoaStatus, TimeLog } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { ApproveAll, SignMoa } from "./controls";

export const metadata: Metadata = { title: "Current interns" };

type HiredRow = { id: string; student: { id: string; full_name: string; school: { short_name: string; required_hours: number } | null } | null; job: { title: string } | null };

export default async function InternsPage() {
  const viewer = await requireRole(["supervisor"]);
  const { supabase, company } = viewer;
  const [hired, logs, moas] = await Promise.all([
    supabase
      .from("applications")
      .select("id, student:profiles!applications_student_id_fkey(id, full_name, school:schools(short_name, required_hours)), job:jobs!inner(title, company_id)")
      .eq("status", "hired")
      .eq("job.company_id", company!.id),
    supabase.from("time_logs").select("*").eq("company_id", company!.id).order("work_date", { ascending: false }),
    supabase.from("school_partners").select("school_id, moa_status, school:schools(name)").eq("company_id", company!.id),
  ]);
  const all = (logs.data ?? []) as TimeLog[];
  const pending = all.filter((l) => l.status === "pending");
  const interns = ((hired.data ?? []) as unknown as HiredRow[]).filter((h) => h.student);
  const moaRows = ((moas.data ?? []) as unknown as Array<{ school_id: string; moa_status: MoaStatus; school: { name: string } | null }>).filter((m) => m.school);

  return (
    <>
      <PageHead kicker={company!.name} title="Current interns" actions={<ApproveAll count={pending.length} />} />

      {moaRows.some((m) => m.moa_status === "sent") ? (
        <section className="flex flex-col gap-3">
          <h2 className="m-0" style={{ fontSize: 20, fontWeight: 600 }}>
            MOAs to sign
          </h2>
          {moaRows
            .filter((m) => m.moa_status === "sent")
            .map((m) => (
              <div key={m.school_id} className="flex flex-wrap items-center gap-3 rounded-xl px-5 py-4" style={{ background: "var(--lilac-soft)" }}>
                <span className="flex-1" style={{ fontSize: 16, fontWeight: 500 }}>
                  {m.school!.name} sent you a memorandum of agreement.
                </span>
                <SignMoa schoolId={m.school_id} />
              </div>
            ))}
        </section>
      ) : null}

      <section className="card overflow-x-auto">
        <table className="table" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>Intern</th>
              <th>Role</th>
              <th>School</th>
              <th>Approved hours</th>
              <th>Waiting</th>
            </tr>
          </thead>
          <tbody>
            {interns.map((h) => {
              const mine = all.filter((l) => l.student_id === h.student!.id);
              const done = mine.filter((l) => l.status === "approved").reduce((n, l) => n + Number(l.hours), 0);
              const wait = mine.filter((l) => l.status === "pending").reduce((n, l) => n + Number(l.hours), 0);
              return (
                <tr key={h.id} className="row">
                  <td>
                    <span className="flex items-center gap-3" style={{ fontWeight: 500 }}>
                      <Avatar name={h.student!.full_name} size={34} />
                      {h.student!.full_name}
                    </span>
                  </td>
                  <td style={{ color: "var(--ink-2)" }}>{h.job?.title}</td>
                  <td style={{ color: "var(--ink-2)" }}>{h.student!.school?.short_name ?? "—"}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>
                    {hoursLabel(done)} of {h.student!.school?.required_hours ?? 486}
                  </td>
                  <td style={{ color: wait ? "var(--lilac-ink)" : "var(--muted)", fontWeight: wait ? 600 : 400 }}>{wait ? `${hoursLabel(wait)} hours` : "—"}</td>
                </tr>
              );
            })}
            {interns.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--muted)" }}>
                  No interns yet. Students show up here after they accept your offer.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {pending.length ? (
        <section className="card flex flex-col p-5">
          <h2 className="m-0 pb-3" style={{ fontSize: 20, fontWeight: 600 }}>
            Hours waiting for approval
          </h2>
          {pending.map((l) => {
            const who = interns.find((h) => h.student!.id === l.student_id)?.student?.full_name ?? "Intern";
            return (
              <div key={l.id} className="flex flex-wrap justify-between gap-3 py-3" style={{ borderTop: "1px solid var(--line-3)", fontSize: 15 }}>
                <span>
                  <span style={{ fontWeight: 500 }}>{who}</span> · {apDate(new Date(`${l.work_date}T12:00:00+08:00`))}
                  {l.note ? <span style={{ color: "var(--muted)" }}> · {l.note}</span> : null}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{hoursLabel(Number(l.hours))} hours</span>
              </div>
            );
          })}
        </section>
      ) : null}
    </>
  );
}
