import { redirect } from "next/navigation";
import { CompanyMark } from "@/components/brand";
import { AccountMenu } from "@/components/nav";
import { ConsoleShell, SetupNotice } from "@/components/shells";
import { requireRole, SetupError } from "@/lib/viewer";

export default async function EmployerLayout({ children }: LayoutProps<"/employer">) {
  let viewer;
  try {
    viewer = await requireRole(["supervisor"]);
  } catch (e) {
    if (e instanceof SetupError) return <SetupNotice />;
    throw e;
  }
  const c = viewer.company;
  if (!c) redirect("/register");
  return (
    <ConsoleShell
      top={
        <div className="flex items-center gap-3">
          <CompanyMark logo={c.logo} bg={c.logo_bg} size={44} glyph={24} />
          <span className="flex flex-col">
            <span style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: c.verified_at ? "var(--accent)" : "var(--lilac-ink)" }}>{c.verified_at ? "Verified" : "In review"}</span>
          </span>
        </div>
      }
      links={[
        { href: "/employer/jobs", label: "Jobs" },
        { href: "/employer", label: "Applicants", exact: true },
        { href: "/employer/interns", label: "Current interns" },
      ]}
      footer={<AccountMenu name={viewer.profile.full_name || "Supervisor"} detail={c.name} align="up" />}
    >
      {children}
    </ConsoleShell>
  );
}
