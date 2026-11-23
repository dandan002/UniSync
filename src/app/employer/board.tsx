"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Avatar, Close } from "@/components/brand";
import { pressProps } from "@/components/motion";
import { approveHours, markViewed, messageApplicant, moveApplicant, scheduleInterview } from "@/lib/actions/employer";
import { spell, whenLabel } from "@/lib/format";

export type Candidate = {
  id: string;
  studentId: string;
  name: string;
  school: string;
  verifiedBySchool: boolean;
  city: string;
  avail: string;
  hours: string;
  moa: string;
  line: string;
  why: string;
  exp: string[];
  skills: string[];
  score: number;
  status: "new" | "reviewing" | "interview" | "offer" | "declined";
  interviewAt: string | null;
  interviewWhere: string | null;
  viewed: boolean;
};

const COLS: Array<{ key: Candidate["status"]; name: string }> = [
  { key: "new", name: "New" },
  { key: "reviewing", name: "Reviewing" },
  { key: "interview", name: "Interview" },
  { key: "offer", name: "Offer" },
];
const AV: Array<[string, string]> = [
  ["var(--soft)", "var(--accent)"],
  ["var(--lilac-soft)", "var(--lilac-ink)"],
  ["var(--line-3)", "var(--accent)"],
];

export function Board({ candidates: initial, loggers }: { candidates: Candidate[]; loggers: number }) {
  const router = useRouter();
  const [cands, setCands] = useState(initial);
  const [open, setOpen] = useState("");
  const [toast, setToast] = useState("");
  const [pending, start] = useTransition();
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setCands(initial);
  }

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3400);
  }

  function move(c: Candidate, to: Candidate["status"]) {
    const prev = c.status;
    setCands((all) => all.map((x) => (x.id === c.id ? { ...x, status: to } : x)));
    start(async () => {
      const res = await moveApplicant(c.id, to);
      if (!res.ok) {
        setCands((all) => all.map((x) => (x.id === c.id ? { ...x, status: prev } : x)));
        flash(res.error);
      } else {
        if (to === "offer") flash(`Offer sent to ${c.name}.`);
        router.refresh();
      }
    });
  }

  const d = cands.find((c) => c.id === open);
  const avatar = (c: Candidate) => AV[Math.abs(hash(c.studentId)) % AV.length]!;

  return (
    <>
      {loggers > 0 ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl px-5 py-4" style={{ background: "var(--lilac-soft)" }}>
          <span className="flex-1" style={{ fontSize: 16, fontWeight: 500 }}>
            {spell(loggers, true)} {loggers === 1 ? "intern" : "interns"} logged hours this week.
          </span>
          <button
            className="btn btn-sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await approveHours();
                flash(res.ok ? `Approved ${spell(res.data.count)} time ${res.data.count === 1 ? "log" : "logs"}.` : res.error);
                router.refresh();
              })
            }
          >
            Approve hours
          </button>
        </div>
      ) : null}

      <div className="grid items-start gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(240px,100%),1fr))" }}>
        {COLS.map((col, ci) => {
          const inCol = cands.filter((c) => c.status === col.key).sort((a, b) => b.score - a.score);
          return (
            <section key={col.key} aria-label={col.name} className="flex min-h-[440px] flex-col gap-2 rounded-xl p-3" style={{ background: "var(--surface)" }}>
              <div className="flex items-baseline justify-between px-2 pb-1 pt-2">
                <span style={{ fontSize: 16, fontWeight: 600 }}>{col.name}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--muted)" }}>{inCol.length}</span>
              </div>
              <AnimatePresence mode="popLayout">
                {inCol.map((c, idx) => {
                  const [bg, fg] = avatar(c);
                  return (
                    <motion.div key={c.id} layout layoutId={c.id} className="flex flex-col" initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
                      <motion.button
                        className="card flex w-full cursor-pointer flex-col gap-2 p-4 text-left text-ink"
                        style={{ font: "inherit", boxSizing: "border-box", background: "var(--paper)" }}
                        whileHover={{ boxShadow: "0 1px 2px rgba(30,33,64,.04), 0 8px 24px -12px rgba(30,33,64,.12)" }}
                        onClick={() => {
                          setOpen(c.id);
                          if (!c.viewed) void markViewed(c.id);
                        }}
                        aria-label={`Open ${c.name}`}
                      >
                        <span className="flex items-center gap-3">
                          <Avatar name={c.name} size={40} bg={bg} fg={fg} />
                          <span className="flex flex-col gap-0.5">
                            <span style={{ fontSize: 15, fontWeight: 500 }}>{c.name}</span>
                            <span style={{ fontSize: 13, color: "var(--muted)" }}>{c.school}</span>
                          </span>
                        </span>
                        {c.line ? <span style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.45 }}>{c.line}</span> : null}
                        {ci === 0 && idx === 0 && inCol.length > 1 ? (
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)" }}>Sync&apos;s top pick</span>
                        ) : null}
                      </motion.button>
                      {ci < 3 ? (
                        <button className="link-btn self-end" style={{ height: 36, fontSize: 14, fontWeight: 500, color: "var(--accent)" }} onClick={() => (COLS[ci + 1]!.key === "interview" ? setOpen(c.id) : move(c, COLS[ci + 1]!.key))}>
                          Move to {COLS[ci + 1]!.name} →
                        </button>
                      ) : null}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {inCol.length === 0 ? (
                <span className="px-2" style={{ fontSize: 14, color: "var(--faint)" }}>
                  No one here yet.
                </span>
              ) : null}
            </section>
          );
        })}
      </div>

      <AnimatePresence>
        {d ? (
          <Drawer
            key={d.id}
            c={d}
            avatar={avatar(d)}
            onClose={() => setOpen("")}
            onMove={(to) => move(d, to)}
            onDone={(m) => {
              flash(m);
              router.refresh();
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div key="t" role="status" className="toast" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <span className="sr-only">
        <Link href="/employer/jobs">Jobs</Link>
      </span>
    </>
  );
}

function Drawer({ c, avatar, onClose, onMove, onDone }: { c: Candidate; avatar: [string, string]; onClose: () => void; onMove: (s: Candidate["status"]) => void; onDone: (m: string) => void }) {
  const [mode, setMode] = useState<"view" | "interview" | "message">("view");
  const [at, setAt] = useState(defaultSlot());
  const [where, setWhere] = useState(c.interviewWhere ?? "Google Meet");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <>
      <motion.button className="scrim" aria-label="Close profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside className="drawer" style={{ width: "min(500px, calc(100% - 24px))" }} role="dialog" aria-modal="true" aria-labelledby="dr-h" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex flex-1 flex-col gap-6 overflow-auto p-8">
          <div className="flex items-start justify-between">
            <Avatar name={c.name} size={64} bg={avatar[0]} fg={avatar[1]} />
            <button className="icon-btn" aria-label="Close" onClick={onClose}>
              <Close />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <h2 id="dr-h" className="display m-0" style={{ fontSize: 32 }}>
              {c.name}
            </h2>
            <span style={{ fontSize: 16, color: "var(--muted)" }}>
              {c.school}
              {c.verifiedBySchool ? " · verified by school" : ""}
            </span>
          </div>
          <div className="panel grid grid-cols-2 gap-x-6 gap-y-4 p-5">
            <Fact label="Available" value={c.avail} />
            <Fact label="Location" value={c.city} />
            <Fact label="Required hours" value={c.hours} />
            <Fact label="School partner" value={c.moa} />
          </div>
          {c.status === "interview" && c.interviewAt ? (
            <div className="rounded-xl px-5 py-4" style={{ background: "var(--soft)", fontSize: 15 }}>
              Interview {whenLabel(c.interviewAt)}
              {c.interviewWhere ? `, ${c.interviewWhere}` : ""}
            </div>
          ) : null}
          <section className="flex flex-col gap-2">
            <h3 className="m-0" style={{ fontSize: 18, fontWeight: 600 }}>
              Why Sync recommends them
            </h3>
            <p className="m-0" style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)" }}>
              {c.why}
            </p>
          </section>
          {c.exp.length ? (
            <section className="flex flex-col gap-2">
              <h3 className="m-0" style={{ fontSize: 18, fontWeight: 600 }}>
                Experience
              </h3>
              <ul className="m-0 flex flex-col gap-2 pl-5" style={{ fontSize: 16, lineHeight: 1.5, color: "var(--ink-2)" }}>
                {c.exp.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {c.skills.length ? (
            <div className="flex flex-wrap gap-1">
              {c.skills.map((s) => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          {mode === "interview" ? (
            <form
              className="card flex flex-col gap-3 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                setErr("");
                start(async () => {
                  const res = await scheduleInterview(c.id, new Date(at).toISOString(), where);
                  if (!res.ok) return setErr(res.error);
                  onDone(`Interview invite sent to ${c.name}.`);
                  onClose();
                });
              }}
            >
              <label className="label">
                When
                <input className="field" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} required />
              </label>
              <label className="label">
                Where
                <input className="field" value={where} onChange={(e) => setWhere(e.target.value)} required />
              </label>
              <button className="btn btn-p" disabled={pending}>
                {pending ? "Sending…" : "Send invite"}
              </button>
            </form>
          ) : null}

          {mode === "message" ? (
            <form
              className="card flex flex-col gap-3 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                setErr("");
                start(async () => {
                  const res = await messageApplicant(c.id, body);
                  if (!res.ok) return setErr(res.error);
                  if (res.data.status === "blocked") {
                    setErr("We blocked this message. Unisync doesn't allow asking students for money, deposits or fees.");
                    return;
                  }
                  onDone(`Message sent to ${c.name}.`);
                  setBody("");
                  setMode("view");
                });
              }}
            >
              <label className="label">
                Message
                <textarea className="field" value={body} maxLength={1000} onChange={(e) => setBody(e.target.value)} placeholder="Hi! Can you share your capstone repo before the interview?" />
              </label>
              <button className="btn btn-p" disabled={pending || !body.trim()}>
                {pending ? "Sending…" : "Send message"}
              </button>
            </form>
          ) : null}

          {err ? (
            <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
              {err}
            </p>
          ) : null}
          <span style={{ fontSize: 14, color: "var(--muted)" }}>Recommendations exclude age, gender and photos. You make the final decision.</span>
        </div>
        <div className="flex flex-wrap gap-2 px-8 py-4" style={{ borderTop: "1px solid var(--line)" }}>
          {c.status === "new" || c.status === "reviewing" ? (
            <motion.button className="btn btn-p flex-1" style={{ height: 48 }} {...pressProps} onClick={() => setMode("interview")}>
              Invite to interview
            </motion.button>
          ) : null}
          {c.status === "interview" ? (
            <motion.button
              className="btn btn-p flex-1"
              style={{ height: 48 }}
              {...pressProps}
              onClick={() => {
                onMove("offer");
                onClose();
              }}
            >
              Send offer
            </motion.button>
          ) : null}
          {c.status === "offer" ? (
            <span className="flex flex-1 items-center" style={{ fontSize: 15, color: "var(--muted)" }}>
              Offer sent. Waiting for {c.name.split(" ")[0]}.
            </span>
          ) : null}
          <button className="btn" style={{ height: 48 }} onClick={() => setMode(mode === "message" ? "view" : "message")}>
            Message
          </button>
          {c.status !== "offer" ? (
            <button
              className="btn btn-ghost"
              style={{ height: 48 }}
              onClick={() => {
                onMove("declined");
                onClose();
              }}
            >
              Decline
            </button>
          ) : null}
        </div>
      </motion.aside>
    </>
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

// Two days from now at 2 p.m. Manila, as a local datetime-local value.
function defaultSlot(): string {
  const d = new Date(Date.now() + 2 * 86400000);
  d.setHours(14, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
