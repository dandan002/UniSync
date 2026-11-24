import type { Metadata } from "next";
import { PageHead } from "@/components/shells";
import { FORM_LABELS, FORM_ORDER, type FormKey, type FormStatus, type StudentForm } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { FormCell } from "./cell";

export const metadata: Metadata = { title: "Forms" };

export default async function FormsPage() {
  const viewer = await requireRole(["coordinator", "admin"]);
  const { supabase } = viewer;
  const { data: students } = await supabase.from("profiles").select("id, full_name, email").eq("school_id", viewer.profile.school_id!).eq("role", "student").order("full_name");
  const ids = (students ?? []).map((s) => s.id as string);
  const { data: forms } = ids.length ? await supabase.from("student_forms").select("*").in("student_id", ids) : { data: [] };
  const byStudent = new Map<string, Map<FormKey, StudentForm>>();
  for (const f of (forms ?? []) as StudentForm[]) {
    if (!byStudent.has(f.student_id)) byStudent.set(f.student_id, new Map());
    byStudent.get(f.student_id)!.set(f.form_key, f);
  }
  const waiting = ((forms ?? []) as StudentForm[]).filter((f) => f.status === "submitted").length;

  return (
    <>
      <PageHead kicker={`${waiting} ${waiting === 1 ? "form waits" : "forms wait"} for review`} title="CHED forms" />
      <section className="card overflow-x-auto">
        <table className="table" style={{ minWidth: 980 }}>
          <thead>
            <tr>
              <th>Student</th>
              {FORM_ORDER.map((k) => (
                <th key={k}>{FORM_LABELS[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(students ?? []).map((s) => (
              <tr key={s.id as string} className="row">
                <td style={{ fontWeight: 500 }}>{(s.full_name as string) || (s.email as string)}</td>
                {FORM_ORDER.map((k) => {
                  const f = byStudent.get(s.id as string)?.get(k);
                  return (
                    <td key={k}>
                      <FormCell studentId={s.id as string} formKey={k} status={(f?.status ?? "missing") as FormStatus} path={f?.file_path ?? null} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
