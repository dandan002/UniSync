import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadResume } from "@/lib/data";
import { FORM_LABELS, FORM_ORDER, UPLOADABLE, type StudentForm } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { ResumeEditor } from "./editor";

export const metadata: Metadata = { title: "Your resume" };

export default async function ResumePage() {
  const viewer = await requireRole(["student"]);
  const { row, data } = await loadResume(viewer);
  if (!row) redirect("/start");
  const { data: forms } = await viewer.supabase.from("student_forms").select("*").eq("student_id", viewer.profile.id);
  const list = (forms ?? []) as StudentForm[];
  const done = list.filter((f) => f.status !== "missing").length;
  const missing = FORM_ORDER.filter((k) => list.find((f) => f.form_key === k)?.status === "missing");
  return (
    <ResumeEditor
      studentId={viewer.profile.id}
      data={data}
      template={row.template}
      approved={!!row.approved_at}
      forms={{ done, total: 6, next: missing[0] ? FORM_LABELS[missing[0]] : null, uploadable: missing.filter((k) => UPLOADABLE.includes(k)) }}
    />
  );
}
