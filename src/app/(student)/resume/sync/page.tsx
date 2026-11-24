import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadResume } from "@/lib/data";
import { firstName } from "@/lib/format";
import { requireRole } from "@/lib/viewer";
import { SyncClient } from "./client";

export const metadata: Metadata = { title: "Improve your resume" };

export default async function ResumeSyncPage() {
  const viewer = await requireRole(["student"]);
  const { row, data } = await loadResume(viewer);
  if (!row) redirect("/start");
  return (
    <div className="pt-6">
      <SyncClient studentId={viewer.profile.id} initial={data} firstName={firstName(data.name || viewer.profile.full_name)} />
    </div>
  );
}
