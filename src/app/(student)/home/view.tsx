"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CompanyMark, Mark } from "@/components/brand";
import { FormUpload } from "@/components/form-upload";
import { pressProps, Reveal } from "@/components/motion";
import { acceptOffer, logHours, markUpdatesRead } from "@/lib/actions/student";
import { spell } from "@/lib/format";
import type { FormKey } from "@/lib/types";

export type AppView = { id: string; role: string; company: string; logo: string; logo_bg: string; status: string; statusKey: string; color: string; detail: string };
export type Hero =
  | { kind: "interview"; kicker: string; title: string; sub: string; calendar: { title: string; start: string; where: string } }
  | { kind: "offer"; kicker: string; title: string; sub: string; applicationId: string }
  | { kind: "interning"; kicker: string; title: string; sub: string; pct: number }
  | { kind: "resume" | "apply"; kicker: string; title: string; sub: string };

function icsHref(c: { title: string; start: string; where: string }): string {
  const s = new Date(c.start);
  const e = new Date(s.getTime() + 60 * 60 * 1000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Unisync//EN",
    "BEGIN:VEVENT",
    `UID:${f(s)}-unisync`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(s)}`,
    `DTEND:${f(e)}`,
    `SUMMARY:${c.title}`,
    `LOCATION:${c.where}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

export function HomeView({
  studentId,
  name,
  hero,
  apps,
  notes,
  forms,
  interning,
  recentLogs,
}: {
  studentId: string;
  name: string;
  hero: Hero;
  apps: AppView[];
  notes: Array<{ id: string; title: string; when: string; kind: string; unread: boolean }>;
  forms: { done: number; total: number; missing: string[]; uploadable: FormKey[] };
  interning: boolean;
  recentLogs: Array<{ id: string; date: string; hours: number; status: string; note: string }>;
}) {
  const router = useRouter();
  const [openApp, setOpenApp] = useState(apps[0]?.id ?? "");
  const [stack, setStack] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 pb-20 pt-10">
      <Reveal i={0}>
        <h1 className="display m-0" style={{ fontSize: "clamp(32px,4vw,44px)" }}>
          Hi, {name}.
        </h1>
      </Reveal>

      <Reveal i={1}>
        <section aria-label="Next up" className="relative flex flex-wrap items-end gap-x-10 gap-y-6 overflow-hidden rounded-xl p-10" style={{ background: "var(--primary)", color: "var(--ink)" }}>
          <motion.span aria-hidden="true" className="absolute" style={{ right: -90, top: -110, opacity: 0.35 }} animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
            <Mark size={360} color="#B8C1FA" dot="#B8C1FA" />
          </motion.span>
          <div className="relative flex flex-col gap-2" style={{ flex: "1 1 380px" }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--accent)" }}>{hero.kicker}</span>
            <span className="display" style={{ fontSize: "clamp(30px,3.6vw,44px)", lineHeight: 1.05 }}>
              {hero.title}
            </span>
            <span style={{ fontSize: 16, color: "var(--accent)" }}>{hero.sub}</span>
            {hero.kind === "interning" ? (
              <div className="mt-2 h-1.5 max-w-[420px] overflow-hidden rounded" style={{ background: "rgba(255,255,255,.6)" }}>
                <motion.span className="block h-full rounded" style={{ background: "var(--accent)" }} initial={{ width: 0 }} animate={{ width: `${hero.pct}%` }} transition={{ duration: 1.1, delay: 0.4 }} />
              </div>
            ) : null}
          </div>
          <div className="relative flex flex-wrap gap-2">
            {hero.kind === "interview" ? (
              <>
                <Link href="/resume" className="btn" style={{ borderColor: "#fff" }}>
                  Review my resume
                </Link>
                <a href={icsHref(hero.calendar)} download="interview.ics" className="btn" style={{ background: "transparent", borderColor: "rgba(30,33,64,.22)" }}>
                  Add to calendar
                </a>
              </>
            ) : null}
            {hero.kind === "offer" ? (
              <motion.button
                className="btn"
                style={{ borderColor: "#fff" }}
                {...pressProps}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await acceptOffer(hero.applicationId);
                    if (!res.ok) setError(res.error);
                    else router.refresh();
                  })
                }
              >
                {pending ? "Accepting…" : "Accept the offer"}
              </motion.button>
            ) : null}
            {hero.kind === "resume" ? (
              <Link href="/resume" className="btn" style={{ borderColor: "#fff" }}>
                Review my resume
              </Link>
            ) : null}
            {hero.kind === "apply" ? (
              <Link href="/jobs" className="btn" style={{ borderColor: "#fff" }}>
                Browse internships
              </Link>
            ) : null}
          </div>
        </section>
      </Reveal>
      {error ? (
        <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start gap-6">
        <Reveal i={2} className="card min-w-0 overflow-hidden" style={{ flex: "999 1 560px" }}>
          <section aria-labelledby="apps-h">
            <div className="flex items-baseline justify-between px-5 pb-4 pt-5">
              <h2 id="apps-h" className="m-0" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.005em" }}>
                Applications
              </h2>
              <Link href="/jobs" style={{ fontSize: 15, fontWeight: 500 }}>
                Browse internships
              </Link>
            </div>
            {apps.length === 0 ? (
              <p className="m-0 px-5 pb-6" style={{ color: "var(--muted)", fontSize: 15 }}>
                You haven&apos;t applied yet. Your matches are on the Jobs tab.
              </p>
            ) : null}
            {apps.map((a, i) => (
              <div key={a.id}>
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                  className="flex w-full cursor-pointer items-center gap-4 border-0 px-5 py-4 text-left text-ink"
                  style={{ background: "var(--paper)", borderTop: "1px solid var(--line)", font: "inherit" }}
                  aria-expanded={openApp === a.id}
                  onClick={() => setOpenApp(openApp === a.id ? "" : a.id)}
                >
                  <CompanyMark logo={a.logo} bg={a.logo_bg} size={46} glyph={24} />
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span style={{ fontWeight: 500, fontSize: 16 }}>{a.role}</span>
                    <span style={{ fontSize: 14, color: "var(--muted)" }}>{a.company}</span>
                  </span>
                  <span className="text-right" style={{ fontSize: 15, fontWeight: 500, color: a.color }}>
                    {a.status}
                  </span>
                </motion.button>
                <AnimatePresence initial={false}>
                  {openApp === a.id ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="m-0 overflow-hidden"
                      style={{ padding: "0 20px 16px 82px", fontSize: 15, color: "var(--muted)", lineHeight: 1.5 }}
                    >
                      {a.detail}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            ))}
          </section>
        </Reveal>

        <aside className="flex min-w-0 flex-col gap-6" style={{ flex: "1 1 340px" }}>
          <Reveal i={3}>
            <section aria-labelledby="notif-h" className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <h2 id="notif-h" className="m-0" style={{ fontSize: 20, fontWeight: 600 }}>
                  Updates
                </h2>
                {notes.length > 1 ? (
                  <button
                    className="link-btn"
                    style={{ color: "var(--accent)", fontWeight: 500, height: 36 }}
                    aria-expanded={stack}
                    onClick={() => {
                      setStack(!stack);
                      if (!stack) void markUpdatesRead();
                    }}
                  >
                    {stack ? "Show less" : "Show all"}
                  </button>
                ) : null}
              </div>
              {notes.length === 0 ? (
                <p className="m-0" style={{ fontSize: 15, color: "var(--muted)" }}>
                  Nothing new yet.
                </p>
              ) : (
                <motion.div className="relative" animate={{ height: stack ? 82 * notes.length : 100 }} transition={{ type: "spring", stiffness: 200, damping: 24 }}>
                  {notes.map((n, i) => (
                    <motion.div
                      key={n.id}
                      className="card card-shadow absolute left-0 right-0 flex items-center gap-3 p-4"
                      style={{ zIndex: 10 - i, boxSizing: "border-box" }}
                      animate={stack ? { y: i * 82, scale: 1, opacity: 1 } : { y: i * 12, scale: 1 - i * 0.05, opacity: i === 0 ? 1 : Math.max(0.75 - i * 0.2, 0) }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    >
                      <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: n.kind === "job" ? "var(--lilac)" : "var(--accent)" }} />
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span style={{ fontSize: 15, fontWeight: 500 }}>{n.title}</span>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>{n.when}</span>
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </section>
          </Reveal>

          <Reveal i={4}>
            <section aria-labelledby="forms-h" className="panel flex flex-col gap-3 p-6">
              <div className="flex items-baseline justify-between">
                <h2 id="forms-h" className="m-0" style={{ fontSize: 20, fontWeight: 600 }}>
                  School forms
                </h2>
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--muted)" }}>
                  {spell(forms.done, true)} of {spell(forms.total)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded" style={{ background: "var(--line-2)" }}>
                <motion.span className="block h-full rounded" style={{ background: "var(--mark)" }} initial={{ width: 0 }} animate={{ width: `${Math.round((forms.done / forms.total) * 100)}%` }} transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }} />
              </div>
              <span style={{ fontSize: 15, color: "var(--muted)" }}>
                {forms.missing.length ? `Still needed: ${joinAnd(forms.missing)}.` : "All six forms are in. Nice work."}
              </span>
              <FormUpload studentId={studentId} missing={forms.uploadable} label="Complete forms" className="btn btn-sm self-start" />
            </section>
          </Reveal>

          {interning ? (
            <Reveal i={5}>
              <LogHours recent={recentLogs} />
            </Reveal>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function joinAnd(list: string[]): string {
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

function LogHours({ recent }: { recent: Array<{ id: string; date: string; hours: number; status: string; note: string }> }) {
  const router = useRouter();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
  const [date, setDate] = useState(today);
  const [hours, setHours] = useState("8");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <section aria-labelledby="hours-h" className="card flex flex-col gap-3 p-6">
      <h2 id="hours-h" className="m-0" style={{ fontSize: 20, fontWeight: 600 }}>
        Log today&apos;s hours
      </h2>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await logHours(date, Number(hours), note);
            setMsg(res.ok ? "Logged. Your supervisor will approve it." : res.error);
            if (res.ok) {
              setNote("");
              router.refresh();
            }
          });
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <label className="label">
            Date
            <input className="field" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="label">
            Hours
            <input className="field" type="number" min={0.5} max={12} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} />
          </label>
        </div>
        <label className="label">
          What you worked on
          <input className="field" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Weekly route dashboard" />
        </label>
        <button className="btn btn-p btn-sm self-start" disabled={pending}>
          {pending ? "Logging…" : "Log hours"}
        </button>
        {msg ? (
          <span role="status" style={{ fontSize: 14, color: "var(--muted)" }}>
            {msg}
          </span>
        ) : null}
      </form>
      {recent.length ? (
        <ul className="m-0 flex list-none flex-col gap-1 p-0" style={{ fontSize: 14, color: "var(--muted)" }}>
          {recent.map((r) => (
            <li key={r.id} className="flex justify-between gap-3">
              <span>
                {r.date} · {r.hours} hours
              </span>
              <span style={{ color: r.status === "approved" ? "var(--accent)" : "var(--muted)" }}>{r.status === "approved" ? "Approved" : "Waiting"}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
