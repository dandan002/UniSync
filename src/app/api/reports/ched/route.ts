import { NextResponse } from "next/server";
import type { StudentOverview } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

// CHED internship report as CSV: one row per student in the caller's school.
function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  // Neutralize spreadsheet formulas and quote everything.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  const viewer = await getViewer();
  if (!viewer || !["coordinator", "admin"].includes(viewer.profile.role) || !viewer.profile.school_id) {
    return NextResponse.json({ error: "Only school staff can export reports." }, { status: 403 });
  }
  const { data, error } = await viewer.supabase.from("student_overview").select("*").eq("school_id", viewer.profile.school_id).order("full_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const required = viewer.school?.required_hours ?? 486;
  const header = ["Student", "Email", "Program", "Status", "Host company", "Approved hours", "Required hours", "Forms complete (of 6)", "Applications"];
  const rows = ((data ?? []) as StudentOverview[]).map((s) => [s.full_name, s.email, s.course, s.stage, s.host_company ?? "", Number(s.hours), required, s.forms_done, s.app_count]);
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

  await viewer.supabase.rpc("log_ched_export");
  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ched-ojt-report-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
