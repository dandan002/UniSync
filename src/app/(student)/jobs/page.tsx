import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadJobsFor, loadResume } from "@/lib/data";
import { requireRole } from "@/lib/viewer";
import { JobsBoard } from "./board";

export const metadata: Metadata = { title: "Internships" };

export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const viewer = await requireRole(["student"]);
  const { row, data } = await loadResume(viewer);
  if (!row) redirect("/start");
  const jobs = await loadJobsFor(viewer, data);
  const sp = await searchParams;
  const open = typeof sp.open === "string" ? sp.open : "";
  return (
    <JobsBoard
      initialOpen={open}
      approved={!!row.approved_at}
      jobs={jobs.map((j) => ({
        id: j.id,
        title: j.title,
        city: j.city,
        mode: j.mode,
        allowance: j.allowance,
        schedule: j.schedule,
        dates: j.dates,
        hours: j.hours,
        teaser: j.teaser,
        about: j.about,
        duties: j.duties,
        needs: j.needs,
        perks: j.perks,
        created_at: j.created_at,
        company: { name: j.company.name, logo: j.company.logo, logo_bg: j.company.logo_bg, about: j.company.about ?? "" },
        partner: j.partner,
        applied: j.applied,
        saved: j.saved,
        near: j.match.near,
        good: j.good,
        skills: j.match.skills,
      }))}
    />
  );
}
