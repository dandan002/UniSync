import { AccountMenu } from "@/components/nav";
import { ConsoleShell, SchoolTop, SetupNotice } from "@/components/shells";
import { requireRole, SetupError } from "@/lib/viewer";

export default async function SchoolLayout({ children }: LayoutProps<"/school">) {
  let viewer;
  try {
    viewer = await requireRole(["coordinator", "admin"]);
  } catch (e) {
    if (e instanceof SetupError) return <SetupNotice />;
    throw e;
  }
  return (
    <ConsoleShell
      top={<SchoolTop />}
      links={[
        { href: "/school", label: "Students", exact: true },
        { href: "/school/companies", label: "Companies" },
        { href: "/school/forms", label: "Forms" },
        { href: "/api/reports/ched", label: "CHED reports", download: true },
        { href: "/school/people", label: "People" },
      ]}
      footer={<AccountMenu name={viewer.profile.full_name || "Staff"} detail={viewer.school?.short_name ?? ""} align="up" />}
    >
      {children}
    </ConsoleShell>
  );
}
