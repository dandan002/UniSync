"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar, Close } from "@/components/brand";
import { pressProps } from "@/components/motion";
import { endorseStudents, invitePeople, remindSupervisors, sendMoas, sendReminders } from "@/lib/actions/school";
import { hoursLabel, spell } from "@/lib/format";

export type Issue = { id: "idle" | "moa" | "dtr"; text: string; action: string; ids: string[]; tone: "lilac" | "soft"; done: boolean };
type Row = { id: string; name: string; stage: "Signing up" | "Applying" | "Interning"; forms: number; hours: number; host: string; active: string; idle: boolean };

const TABS = ["All", "Signing up", "Applying", "Interning"] as const;

export function Roster({ rows, issues, requiredHours }: { rows: Row[]; issues: Issue[]; requiredHours: number }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [sel, setSel] = useState<string[]>([]);
  const [fixed, setFixed] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [pending, start] = useTransition();
  const list = rows.filter((r) => tab === "All" || r.stage === tab);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  }

  function fix(issue: Issue) {
    start(async () => {
      const res = issue.id === "idle" ? await sendReminders(issue.ids) : issue.id === "moa" ? await sendMoas(issue.ids) : await remindSupervisors();
      if (!res.ok) return flash(res.error);
      setFixed((f) => [...f, issue.id]);
      flash(issue.id === "idle" ? "Reminders sent." : issue.id === "moa" ? "MOAs sent." : "Supervisors reminded.");
      router.refresh();
    });
  }

  return (
    <>
      <section aria-labelledby="needs-h" className="flex flex-col gap-3">
        <h2 id="needs-h" className="m-0" style={{ fontSize: 20, fontWeight: 600 }}>
          Needs attention
        </h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))" }}>
          {issues.map((i) => {
            const done = i.done || fixed.includes(i.id);
            return (
              <motion.div
                key={i.id}
                layout
                className="flex flex-col gap-4 rounded-xl p-5"
                animate={{ opacity: done ? 0.6 : 1, backgroundColor: done ? "var(--line-3)" : i.tone === "lilac" ? "var(--lilac-soft)" : "var(--soft)" }}
              >
                <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.35 }}>{i.text}</span>
                {done ? (
                  <span className="flex h-10 items-center" style={{ fontSize: 15, fontWeight: 500, color: "var(--accent)" }}>
                    Done
                  </span>
                ) : (
                  <motion.button className="btn btn-sm self-start" {...pressProps} disabled={pending} onClick={() => fix(i)}>
                    {i.action}
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="cohort-h" className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4" style={{ borderBottom: "1px solid var(--line)" }}>
          <h2 id="cohort-h" className="m-0 pl-0.5" style={{ fontSize: 20, fontWeight: 600 }}>
            Students
          </h2>
          <div role="tablist" aria-label="Filter" className="relative flex rounded-[10px] p-1" style={{ background: "var(--line-3)" }}>
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className="relative z-[1] h-[38px] cursor-pointer border-0 bg-transparent px-3.5"
                style={{ font: "inherit", fontSize: 14, fontWeight: 500, color: tab === t ? "var(--ink)" : "var(--muted)" }}
                onClick={() => setTab(t)}
              >
                {tab === t ? <motion.span layoutId="tabpill" className="absolute inset-0 -z-[1] rounded-lg" style={{ background: "var(--paper)", boxShadow: "0 1px 2px rgba(30,33,64,.05)" }} transition={{ type: "spring", stiffness: 380, damping: 30 }} /> : null}
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <span className="sr-only">Select</span>
                </th>
                <th>Name</th>
                <th>Status</th>
                <th>Forms</th>
                <th>Hours</th>
                <th>Company</th>
                <th>Last active</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => {
                const on = sel.includes(r.id);
                return (
                  <motion.tr key={r.id} className="row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.03 }} style={{ background: on ? "var(--soft-2)" : "transparent" }}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.name}`}
                        checked={on}
                        onChange={() => setSel((s) => (on ? s.filter((x) => x !== r.id) : [...s, r.id]))}
                        style={{ width: 18, height: 18, accentColor: "#7C88DC" }}
                      />
                    </td>
                    <td>
                      <span className="flex items-center gap-3" style={{ fontWeight: 500 }}>
                        <Avatar name={r.name} size={34} bg="var(--line-3)" fg="var(--ink)" />
                        {r.name}
                      </span>
                    </td>
                    <td style={{ color: r.stage === "Signing up" ? "var(--muted)" : "var(--accent)", fontWeight: 500 }}>{r.stage}</td>
                    <td style={{ color: "var(--ink-2)" }}>{r.forms} of 6</td>
                    <td style={{ color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>{r.hours ? `${hoursLabel(r.hours)} of ${requiredHours}` : "—"}</td>
                    <td style={{ color: "var(--ink-2)" }}>{r.host}</td>
                    <td style={{ color: r.idle ? "var(--lilac-ink)" : "var(--muted)", fontWeight: r.idle ? 700 : 500 }}>{r.active}</td>
                  </motion.tr>
                );
              })}
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: "var(--muted)" }}>
                    No students here yet. Add your class list to invite them.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {sel.length ? (
          <motion.div
            key="bar"
            role="toolbar"
            aria-label="Bulk actions"
            className="fixed bottom-6 left-1/2 z-30 flex items-center gap-2 rounded-lg py-2 pl-5 pr-2"
            style={{ background: "#1E2140", color: "#fff", boxShadow: "var(--shadow)" }}
            initial={{ opacity: 0, x: "-50%", y: 30 }}
            animate={{ opacity: 1, x: "-50%", y: 0 }}
            exit={{ opacity: 0, x: "-50%", y: 30 }}
            transition={{ type: "spring", stiffness: 340, damping: 22 }}
          >
            <span className="pr-2" style={{ fontSize: 15, fontWeight: 500 }}>
              {spell(sel.length, true)} selected
            </span>
            <button
              className="btn btn-sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await sendReminders(sel);
                  flash(res.ok ? `Reminder sent to ${spell(res.data.count)} ${res.data.count === 1 ? "student" : "students"}.` : res.error);
                  if (res.ok) setSel([]);
                })
              }
            >
              Send reminder
            </button>
            <button
              className="btn btn-sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await endorseStudents(sel);
                  flash(res.ok ? `Endorsed ${spell(res.data.count)} ${res.data.count === 1 ? "student" : "students"}.` : res.error);
                  if (res.ok) {
                    setSel([]);
                    router.refresh();
                  }
                })
              }
            >
              Endorse
            </button>
            <button className="btn btn-sm" onClick={() => setSel([])} style={{ background: "transparent", color: "#fff", borderColor: "#3F4262" }}>
              Clear
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div key="t" role="status" className="toast" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

// Header buttons: add students (class list) and download the CHED report.
export function SchoolActions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <>
      <motion.button className="btn btn-sm" {...pressProps} onClick={() => setOpen(true)}>
        Add students
      </motion.button>
      <motion.a className="btn btn-sm btn-p" href="/api/reports/ched" {...pressProps}>
        CHED report
      </motion.a>
      <AnimatePresence>
        {open ? (
          <>
            <motion.button key="s" className="scrim" aria-label="Close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div key="d" role="dialog" aria-modal="true" aria-labelledby="add-h" className="dialog" style={{ transform: "none" }} initial={{ opacity: 0, scale: 0.94, x: "-50%", y: "-46%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} exit={{ opacity: 0, x: "-50%", y: "-48%" }}>
              <div className="flex items-start justify-between">
                <h2 id="add-h" className="display m-0" style={{ fontSize: 24 }}>
                  Add students
                </h2>
                <button className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>
                  <Close />
                </button>
              </div>
              <p className="m-0" style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.5 }}>
                Paste your class list emails. Each student gets an invite and joins your school when they sign in.
              </p>
              <label className="label">
                Emails
                <textarea className="field" value={emails} onChange={(e) => setEmails(e.target.value)} placeholder={"bsantos@school.edu.ph\nppdizon@school.edu.ph"} />
              </label>
              {msg ? (
                <p role="status" className="m-0" style={{ fontSize: 14, color: "var(--muted)" }}>
                  {msg}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <button className="btn" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-p"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await invitePeople(emails, "student");
                      setMsg(res.ok ? `Invited ${spell(res.data.count)} ${res.data.count === 1 ? "student" : "students"}.` : res.error);
                      if (res.ok) {
                        setEmails("");
                        router.refresh();
                      }
                    })
                  }
                >
                  {pending ? "Inviting…" : "Send invites"}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
