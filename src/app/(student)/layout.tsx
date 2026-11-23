import { SetupNotice, StudentShell } from "@/components/shells";
import { requireRole, SetupError } from "@/lib/viewer";

export default async function StudentLayout({ children }: LayoutProps<"/">) {
  let viewer;
  try {
    viewer = await requireRole(["student"]);
  } catch (e) {
    if (e instanceof SetupError) return <SetupNotice />;
    throw e;
  }
  return <StudentShell name={viewer.profile.full_name || "Student"}>{children}</StudentShell>;
}
