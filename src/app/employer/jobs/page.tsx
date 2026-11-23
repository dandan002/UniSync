import type { Metadata } from "next";
import { PageHead } from "@/components/shells";
import type { Job } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { JobsManager } from "./manager";

export const metadata: Metadata = { title: "Jobs" };

export default async function EmployerJobs({ searchParams }: PageProps<"/employer/jobs">) {
  const viewer = await requireRole(["supervisor"]);
  const sp = await searchParams;
  const [{ data: jobs }, { data: counts }] = await Promise.all([
    viewer.supabase.from("jobs").select("*").eq("company_id", viewer.company!.id).order("created_at", { ascending: false }),
    viewer.supabase.from("applications").select("job_id, jobs!inner(company_id)").eq("jobs.company_id", viewer.company!.id),
  ]);
  const byJob = new Map<string, number>();
  for (const a of counts ?? []) byJob.set(a.job_id as string, (byJob.get(a.job_id as string) ?? 0) + 1);
  const list = ((jobs ?? []) as Job[]).map((j) => ({ ...j, applicants: byJob.get(j.id) ?? 0 }));
  return (
    <>
      <PageHead kicker={viewer.company!.verified_at ? `${viewer.company!.name} · verified` : `${viewer.company!.name} · in review`} title="Jobs" />
      <JobsManager jobs={list} startNew={sp.new === "1"} editId={typeof sp.edit === "string" ? sp.edit : ""} defaultCity={viewer.company!.city ?? ""} />
    </>
  );
}
