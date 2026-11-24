import type { Metadata } from "next";
import { CompanyMark, Verified } from "@/components/brand";
import { PageHead } from "@/components/shells";
import type { Company, MoaStatus } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { SendMoaButton } from "./send";

export const metadata: Metadata = { title: "Companies" };

const MOA: Record<MoaStatus, { label: string; color: string }> = {
  signed: { label: "MOA signed", color: "var(--accent)" },
  sent: { label: "MOA sent", color: "var(--ink)" },
  none: { label: "No MOA", color: "var(--lilac-ink)" },
};

export default async function CompaniesPage() {
  const viewer = await requireRole(["coordinator", "admin"]);
  const { supabase } = viewer;
  const [partners, overview] = await Promise.all([
    supabase.from("school_partners").select("moa_status, updated_at, company:companies(*)").eq("school_id", viewer.profile.school_id!),
    supabase.from("student_overview").select("host_company_id").eq("school_id", viewer.profile.school_id!),
  ]);
  const interns = new Map<string, number>();
  for (const s of overview.data ?? []) if (s.host_company_id) interns.set(s.host_company_id as string, (interns.get(s.host_company_id as string) ?? 0) + 1);
  const rows = ((partners.data ?? []) as unknown as Array<{ moa_status: MoaStatus; company: Company | null }>)
    .filter((p) => p.company)
    .sort((a, b) => a.company!.name.localeCompare(b.company!.name));
  const unsigned = rows.filter((r) => r.moa_status === "none").length;

  return (
    <>
      <PageHead kicker={viewer.school?.name} title="Partner companies" actions={<SendMoaButton disabled={unsigned === 0} />} />
      <section className="card overflow-x-auto">
        <table className="table" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th>Company</th>
              <th>City</th>
              <th>Verification</th>
              <th>MOA</th>
              <th>Interns</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ company: c, moa_status }) => (
              <tr key={c!.id} className="row">
                <td>
                  <span className="flex items-center gap-3" style={{ fontWeight: 500 }}>
                    <CompanyMark logo={c!.logo} bg={c!.logo_bg} size={36} glyph={18} />
                    {c!.name}
                  </span>
                </td>
                <td style={{ color: "var(--ink-2)" }}>{c!.city ?? "—"}</td>
                <td>
                  {c!.verified_at ? (
                    <span className="flex items-center gap-1" style={{ color: "var(--accent)", fontWeight: 500 }}>
                      <Verified /> Verified
                    </span>
                  ) : (
                    <span style={{ color: "var(--lilac-ink)", fontWeight: 500 }}>Needs review</span>
                  )}
                </td>
                <td style={{ color: MOA[moa_status].color, fontWeight: 500 }}>{MOA[moa_status].label}</td>
                <td style={{ color: "var(--ink-2)" }}>{interns.get(c!.id) ?? 0}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--muted)" }}>
                  No partner companies yet. Approve a company on the People page to add it.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}
