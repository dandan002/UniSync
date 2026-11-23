"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Close, CompanyMark, Verified } from "@/components/brand";
import { pressProps } from "@/components/motion";
import { applyToJob, toggleSavedJob } from "@/lib/actions/student";
import { ago, allowanceLabel, spell } from "@/lib/format";

export type JobView = {
  id: string;
  title: string;
  city: string;
  mode: "On-site" | "Hybrid" | "Remote";
  allowance: number;
  schedule: string;
  dates: string;
  hours: number;
  teaser: string;
  about: string;
  duties: string[];
  needs: string[];
  perks: string[];
  created_at: string;
  company: { name: string; logo: string; logo_bg: string; about: string };
  partner: boolean;
  applied: boolean;
  saved: boolean;
  near: boolean;
  good: boolean;
  skills: string[];
};

const FILTERS = ["All", "Paid", "Near me", "Remote", "School partner"] as const;
type Filter = (typeof FILTERS)[number];

const TESTS: Record<Filter, (j: JobView) => boolean> = {
  All: () => true,
  Paid: (j) => j.allowance > 0,
  "Near me": (j) => j.near,
  Remote: (j) => j.mode === "Remote",
  "School partner": (j) => j.partner,
};

export function JobsBoard({ jobs: initial, initialOpen, approved }: { jobs: JobView[]; initialOpen: string; approved: boolean }) {
  const [jobs, setJobs] = useState(initial);
  const [filter, setFilter] = useState<Filter>("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(initialOpen);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    // New server data after a refresh.
    setSeen(initial);
    setJobs(initial);
  }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen("");
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return jobs.filter(TESTS[filter]).filter((j) => !term || j.title.toLowerCase().includes(term) || j.company.name.toLowerCase().includes(term));
  }, [jobs, filter, q]);
  const matches = jobs.filter((j) => j.good).length;
  const d = jobs.find((j) => j.id === open);

  function apply(job: JobView) {
    setError("");
    start(async () => {
      const res = await applyToJob(job.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setJobs((all) => all.map((j) => (j.id === job.id ? { ...j, applied: true } : j)));
      setToast(`Application sent to ${res.data.company}.`);
    });
  }

  function save(job: JobView) {
    const next = !job.saved;
    setJobs((all) => all.map((j) => (j.id === job.id ? { ...j, saved: next } : j)));
    start(async () => {
      const res = await toggleSavedJob(job.id, next);
      if (!res.ok) setJobs((all) => all.map((j) => (j.id === job.id ? { ...j, saved: !next } : j)));
    });
  }

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 pb-20 pt-10">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="display m-0" style={{ fontSize: "clamp(34px,4vw,48px)", lineHeight: 1 }}>
            Internships for you
          </h1>
          <span style={{ fontSize: 16, color: "var(--muted)" }}>
            {matches === 1 ? "One internship matches" : `${spell(matches, true)} internships match`} your resume.
          </span>
        </div>
        <label className="relative" style={{ flex: "0 1 360px" }}>
          <span className="sr-only">Search jobs</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ position: "absolute", left: 16, top: 15 }}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input type="search" className="field" placeholder="Search role or company" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 48 }} />
        </label>
      </motion.div>

      {!approved ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl px-5 py-4" style={{ background: "var(--lilac-soft)" }}>
          <span className="flex-1" style={{ fontSize: 15, fontWeight: 500 }}>
            Approve your resume so companies see your final version.
          </span>
          <Link href="/resume" className="btn btn-sm">
            Review resume
          </Link>
        </div>
      ) : null}

      <div role="group" aria-label="Filters" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <motion.button
            key={f}
            className="chip"
            aria-pressed={filter === f}
            style={filter === f ? { background: "var(--soft)", border: "1px solid #B8C1FA", height: 42 } : { height: 42 }}
            {...pressProps}
            onClick={() => setFilter(f)}
          >
            {f}
          </motion.button>
        ))}
      </div>

      <div role="list" aria-label="Jobs" className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(340px,100%),1fr))" }}>
        <AnimatePresence mode="popLayout">
          {list.map((j, i) => (
            <motion.div
              key={j.id}
              role="listitem"
              layout
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 220, damping: 24, delay: i * 0.04 }}
            >
              <motion.button
                className="card flex min-h-[236px] w-full cursor-pointer flex-col gap-4 p-5 text-left text-ink"
                style={{ font: "inherit", boxSizing: "border-box" }}
                whileHover={{ y: -6, boxShadow: "0 1px 2px rgba(30,33,64,.04), 0 8px 24px -12px rgba(30,33,64,.12)" }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                onClick={() => setOpen(j.id)}
                aria-label={`${j.title} at ${j.company.name}`}
              >
                <span className="flex w-full items-center gap-3">
                  <CompanyMark logo={j.company.logo} bg={j.company.logo_bg} />
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-1" style={{ fontSize: 15, fontWeight: 500 }}>
                      {j.company.name}
                      <Verified />
                    </span>
                    <span style={{ fontSize: 14, color: "var(--muted)" }}>{j.mode === "Remote" ? "Remote" : `${j.city} · ${j.mode}`}</span>
                  </span>
                </span>
                <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.15 }}>{j.title}</span>
                <span style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.5 }}>{j.teaser}</span>
                <span className="mt-auto flex w-full items-center justify-between" style={{ fontSize: 14 }}>
                  <span style={{ fontWeight: 500 }}>{allowanceLabel(j.allowance)}</span>
                  <span style={{ fontWeight: 500, color: j.applied || j.partner ? "var(--accent)" : "var(--muted)" }}>
                    {j.applied ? "Applied" : j.partner ? "School partner" : `Posted ${ago(j.created_at).toLowerCase()}`}
                  </span>
                </span>
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
        {list.length === 0 ? (
          <p className="m-0" style={{ color: "var(--muted)" }}>
            No internships match that filter yet.
          </p>
        ) : null}
      </div>

      <AnimatePresence>
        {d ? (
          <>
            <motion.button key="scrim" className="scrim" aria-label="Close job" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen("")} />
            <motion.article
              key="drawer"
              className="drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="job-h"
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-1 flex-col gap-6 overflow-auto p-8">
                <div className="flex items-start justify-between gap-3">
                  <CompanyMark logo={d.company.logo} bg={d.company.logo_bg} size={60} glyph={30} />
                  <button className="icon-btn" aria-label="Close" onClick={() => setOpen("")}>
                    <Close />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-1" style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)" }}>
                    {d.company.name} <Verified />
                  </span>
                  <h2 id="job-h" className="display m-0" style={{ fontSize: 34, lineHeight: 1.05 }}>
                    {d.title}
                  </h2>
                </div>
                <div className="panel grid grid-cols-2 gap-x-6 gap-y-4 p-5">
                  <Fact label="Allowance" value={allowanceLabel(d.allowance)} />
                  <Fact label="Where" value={d.mode === "Remote" ? "Remote" : `${d.city} · ${d.mode}`} />
                  <Fact label="Schedule" value={d.schedule} />
                  <Fact label="Dates" value={`${d.dates}, ${d.hours} hours`} />
                </div>
                {d.skills.length ? (
                  <div className="flex flex-wrap items-center gap-1" style={{ fontSize: 14, color: "var(--muted)" }}>
                    <span style={{ marginRight: 4 }}>Matches your skills:</span>
                    {d.skills.map((s) => (
                      <span key={s} className="tag">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}
                <Section title="About the role">
                  <p className="m-0" style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)" }}>
                    {d.about}
                  </p>
                </Section>
                <List title="What you'll do" items={d.duties} />
                <List title="What you'll need" items={d.needs} />
                <List title="Perks" items={d.perks} />
                <section className="flex flex-col gap-2 pt-1" style={{ borderTop: "1px solid var(--line)" }}>
                  <h3 className="m-0 mt-4" style={{ fontSize: 18, fontWeight: 600 }}>
                    About {d.company.name}
                  </h3>
                  <p className="m-0" style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)" }}>
                    {d.company.about}
                  </p>
                </section>
              </div>
              <div className="flex flex-col gap-2 px-8 py-4" style={{ borderTop: "1px solid var(--line)" }}>
                {error ? (
                  <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
                    {error}
                  </p>
                ) : null}
                <div className="flex items-center gap-3">
                  {d.applied ? (
                    <Link href="/home" className="btn flex-1" style={{ color: "var(--accent)", borderColor: "var(--ghost)" }}>
                      Applied. View status
                    </Link>
                  ) : (
                    <motion.button className="btn btn-p flex-1" {...pressProps} disabled={pending} onClick={() => apply(d)}>
                      {pending ? "Sending…" : "Apply"}
                    </motion.button>
                  )}
                  <button className="btn" aria-pressed={d.saved} onClick={() => save(d)}>
                    {d.saved ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </motion.article>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div key="toast" role="status" className="toast" initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="m-0" style={{ fontSize: 18, fontWeight: 600 }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Section title={title}>
      <ul className="m-0 flex flex-col gap-2 pl-5" style={{ fontSize: 16, lineHeight: 1.5, color: "var(--ink-2)" }}>
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </Section>
  );
}
