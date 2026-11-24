"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { pressProps } from "@/components/motion";
import { saveJob, setJobStatus } from "@/lib/actions/employer";
import { allowanceLabel, spell } from "@/lib/format";
import type { Job } from "@/lib/types";

type Row = Job & { applicants: number };

const EMPTY: Record<string, string> = {
  id: "",
  title: "",
  city: "",
  mode: "On-site",
  allowance: "5000",
  schedule: "Weekdays, 8 a.m. to 5 p.m.",
  dates: "April to July 2027",
  hours: "486",
  openings: "1",
  teaser: "",
  about: "",
  duties: "",
  needs: "",
  perks: "",
  programs: "Information Technology, Computer Science",
  skills: "",
};

function toForm(j: Row): Record<string, string> {
  return {
    id: j.id,
    title: j.title,
    city: j.city,
    mode: j.mode,
    allowance: String(j.allowance),
    schedule: j.schedule,
    dates: j.dates,
    hours: String(j.hours),
    openings: String(j.openings),
    teaser: j.teaser,
    about: j.about,
    duties: j.duties.join("\n"),
    needs: j.needs.join("\n"),
    perks: j.perks.join("\n"),
    programs: j.programs.join(", "),
    skills: j.skills.join(", "),
  };
}

export function JobsManager({ jobs, startNew, editId, defaultCity }: { jobs: Row[]; startNew: boolean; editId: string; defaultCity: string }) {
  const router = useRouter();
  const editing = jobs.find((j) => j.id === editId);
  const [form, setForm] = useState<Record<string, string> | null>(editing ? toForm(editing) : startNew ? { ...EMPTY, city: defaultCity } : null);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const set = (k: string, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <>
      <div className="flex justify-end">
        {!form ? (
          <motion.button className="btn btn-sm btn-p" {...pressProps} onClick={() => setForm({ ...EMPTY, city: defaultCity })}>
            Post a job
          </motion.button>
        ) : null}
      </div>

      <AnimatePresence>
        {form ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card flex flex-col gap-4 p-6"
            onSubmit={(e) => {
              e.preventDefault();
              setErr("");
              start(async () => {
                const res = await saveJob(form);
                if (!res.ok) return setErr(res.error);
                setForm(null);
                router.push(`/employer?job=${res.data.id}`);
              });
            }}
          >
            <h2 className="m-0" style={{ fontSize: 20, fontWeight: 600 }}>
              {form.id ? "Edit job" : "Post a job"}
            </h2>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
              <Field label="Title" value={form.title!} onChange={(v) => set("title", v)} placeholder="Data intern" required />
              <Field label="City" value={form.city!} onChange={(v) => set("city", v)} placeholder="Pasig" required />
              <label className="label">
                Setup
                <select className="field" value={form.mode} onChange={(e) => set("mode", e.target.value)}>
                  <option>On-site</option>
                  <option>Hybrid</option>
                  <option>Remote</option>
                </select>
              </label>
              <Field label="Monthly allowance (₱, 0 if unpaid)" type="number" value={form.allowance!} onChange={(v) => set("allowance", v)} />
              <Field label="Schedule" value={form.schedule!} onChange={(v) => set("schedule", v)} />
              <Field label="Dates" value={form.dates!} onChange={(v) => set("dates", v)} />
              <Field label="Hours" type="number" value={form.hours!} onChange={(v) => set("hours", v)} />
              <Field label="Openings" type="number" value={form.openings!} onChange={(v) => set("openings", v)} />
            </div>
            <Field label="One-line summary" value={form.teaser!} onChange={(v) => set("teaser", v)} placeholder="Build delivery dashboards for the operations team." />
            <Area label="About the role" value={form.about!} onChange={(v) => set("about", v)} />
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
              <Area label="What they'll do (one per line)" value={form.duties!} onChange={(v) => set("duties", v)} />
              <Area label="What they'll need (one per line)" value={form.needs!} onChange={(v) => set("needs", v)} />
              <Area label="Perks (one per line)" value={form.perks!} onChange={(v) => set("perks", v)} />
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
              <Field label="Programs, separated by commas" value={form.programs!} onChange={(v) => set("programs", v)} />
              <Field label="Skills Sync should match, separated by commas" value={form.skills!} onChange={(v) => set("skills", v)} placeholder="SQL, Excel, Python" />
            </div>
            <p className="m-0" style={{ fontSize: 14, color: "var(--muted)" }}>
              Show the allowance, hours and location up front. Never ask students for fees or deposits; we block those messages.
            </p>
            {err ? (
              <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
                {err}
              </p>
            ) : null}
            <div className="flex gap-2">
              <motion.button className="btn btn-p" {...pressProps} disabled={pending}>
                {pending ? "Saving…" : form.id ? "Save changes" : "Post job"}
              </motion.button>
              <button type="button" className="btn" onClick={() => setForm(null)}>
                Cancel
              </button>
            </div>
          </motion.form>
        ) : null}
      </AnimatePresence>

      <section className="card overflow-x-auto">
        <table className="table" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th>Role</th>
              <th>Where</th>
              <th>Allowance</th>
              <th>Applicants</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="row">
                <td style={{ fontWeight: 500 }}>
                  <Link href={`/employer?job=${j.id}`} className="text-ink no-underline">
                    {j.title}
                  </Link>
                </td>
                <td style={{ color: "var(--ink-2)" }}>{j.mode === "Remote" ? "Remote" : `${j.city} · ${j.mode}`}</td>
                <td style={{ color: "var(--ink-2)" }}>{allowanceLabel(j.allowance)}</td>
                <td style={{ color: "var(--ink-2)" }}>{spell(j.applicants, true)}</td>
                <td style={{ color: j.status === "open" ? "var(--accent)" : "var(--muted)", fontWeight: 500 }}>{j.status === "open" ? "Open" : "Closed"}</td>
                <td className="flex items-center gap-2" style={{ height: 64 }}>
                  <button className="link-btn" style={{ height: 36, fontWeight: 500 }} onClick={() => setForm(toForm(j))}>
                    Edit
                  </button>
                  <button
                    className="link-btn"
                    style={{ height: 36, fontWeight: 500 }}
                    disabled={pending}
                    onClick={() => start(async () => void (await setJobStatus(j.id, j.status === "open" ? "closed" : "open"), router.refresh()))}
                  >
                    {j.status === "open" ? "Close" : "Reopen"}
                  </button>
                </td>
              </tr>
            ))}
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ color: "var(--muted)" }}>
                  No jobs yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="label">
      {label}
      <input className="field" type={type} value={value} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="label">
      {label}
      <textarea className="field" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
