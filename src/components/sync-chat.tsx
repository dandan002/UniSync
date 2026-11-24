"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Mark } from "@/components/brand";
import { Dictate } from "@/components/dictate";
import { pressProps } from "@/components/motion";
import { ResumeDoc } from "@/components/resume-doc";
import { saveResume } from "@/lib/actions/student";
import { LIMITS, openingMessage, type ChatEvent, type ChatTurn } from "@/lib/agent/chat";
import { CHAT_PREFIX } from "@/lib/draft";
import { reviewResume, type Gap } from "@/lib/review";
import type { ResumeData } from "@/lib/types";

// Chat with Sync about the saved resume. Sync asks about the weak spots,
// edits the resume as the student answers, and every change can be undone.
// The transcript stays on this device.

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  edits?: string[];
  focus?: string;
  // The resume before this turn's edits, kept for undo.
  before?: ResumeData;
  undone?: boolean;
  error?: string;
  pending?: boolean;
};

const KEY = (studentId: string) => `${CHAT_PREFIX}${studentId}`;

// Array.prototype.findLast is missing on some older phones.
function findLast<T>(list: T[], test: (x: T) => boolean): T | undefined {
  for (let i = list.length - 1; i >= 0; i--) if (test(list[i])) return list[i];
  return undefined;
}

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function opener(resume: ResumeData, firstName: string): Msg {
  const o = openingMessage(resume, firstName);
  return { id: uid(), role: "assistant", text: o.text, focus: o.focus };
}

function loadChat(studentId: string): Msg[] | null {
  try {
    const raw = window.localStorage.getItem(KEY(studentId));
    const list = raw ? (JSON.parse(raw) as { msgs?: unknown }).msgs : null;
    if (!Array.isArray(list)) return null;
    const msgs = list.filter((m): m is Msg => !!m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.text === "string");
    return msgs.length ? msgs : null;
  } catch {
    return null;
  }
}

function saveChat(studentId: string, msgs: Msg[]) {
  try {
    const kept = msgs.filter((m) => !m.pending).slice(-60);
    const lastEdit = findLast(kept, (m) => !!m.edits?.length && !m.undone)?.id;
    const slim = kept.map((m) => (m.id === lastEdit ? m : { ...m, before: undefined }));
    window.localStorage.setItem(KEY(studentId), JSON.stringify({ msgs: slim }));
  } catch {
    // Private mode or storage full: the chat still works for this visit.
  }
}

// Plain text from Sync: drop markdown emphasis, keep paragraphs.
function paragraphs(text: string): string[] {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function SyncChat({
  studentId,
  initial,
  firstName,
  fresh = false,
  onDone,
  doneLabel = "Finish",
  top = 168,
}: {
  studentId: string;
  initial: ResumeData;
  firstName: string;
  // Start a new conversation instead of continuing the saved one.
  fresh?: boolean;
  onDone: (resume: ResumeData) => void;
  doneLabel?: string;
  // Space above the chat, so it fits the viewport.
  top?: number;
}) {
  const [resume, setResume] = useState<ResumeData>(initial);
  const [msgs, setMsgs] = useState<Msg[]>(() => (!fresh && loadChat(studentId)) || [opener(initial, firstName)]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [notice, setNotice] = useState("");
  const [sheet, setSheet] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const review = reviewResume(resume);
  const lastEdited = findLast(msgs, (m) => m.role === "assistant" && !!m.edits?.length && !m.pending);

  useEffect(() => {
    if (!busy) saveChat(studentId, msgs);
  }, [msgs, busy, studentId]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  async function send(text: string, pick?: Gap, drop: string[] = []) {
    const message = text.trim().slice(0, LIMITS.message);
    if (!message || busy) return;
    const prior = msgs.filter((m) => !m.pending && !drop.includes(m.id));
    const history: ChatTurn[] = prior
      .filter((m) => !(m.role === "assistant" && m.error && !m.text))
      .map((m) => ({ role: m.role, text: m.text, ...(m.edits?.length && !m.undone ? { edits: m.edits } : {}) }));
    const focus = findLast(prior, (m) => m.role === "assistant" && !m.error)?.focus;
    const user: Msg = { id: uid(), role: "user", text: message };
    const reply: Msg = { id: uid(), role: "assistant", text: "", edits: [], before: resume, pending: true };
    setMsgs([...prior, user, reply]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setNotice("");
    setBusy(true);
    setSheet(false);

    const patch = (fn: (m: Msg) => Msg) => setMsgs((list) => list.map((m) => (m.id === reply.id ? fn(m) : m)));
    const handle = (e: ChatEvent) => {
      switch (e.t) {
        case "text":
          patch((m) => ({ ...m, text: m.text + e.v }));
          break;
        case "reset":
          patch((m) => ({ ...m, text: "" }));
          break;
        case "edit":
          setResume(e.resume);
          patch((m) => ({ ...m, edits: [...(m.edits ?? []), e.label] }));
          break;
        case "done":
          setResume(e.resume);
          patch((m) => ({ ...m, focus: e.focus }));
          break;
        case "error":
          patch((m) => ({ ...m, error: e.message }));
          break;
      }
    };

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/sync/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ history, message, focus, pick: pick?.id }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        patch((m) => ({ ...m, error: j?.error ?? "Sync couldn't answer just now. Try again in a moment." }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          try {
            handle(JSON.parse(line) as ChatEvent);
          } catch {
            // skip a malformed line
          }
        }
      }
    } catch {
      if (!ctrl.signal.aborted) patch((m) => ({ ...m, error: "Lost the connection. Check your internet and try again." }));
    } finally {
      patch((m) => ({ ...m, pending: false, ...(!m.text && !m.error && !m.edits?.length ? { error: "Sync didn't answer. Try again." } : {}) }));
      setBusy(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function retry(failed: Msg) {
    const i = msgs.findIndex((m) => m.id === failed.id);
    const user = msgs[i - 1];
    if (!user || user.role !== "user") return;
    void send(user.text, undefined, [user.id, failed.id]);
  }

  async function undo(m: Msg) {
    if (!m.before || undoing) return;
    setUndoing(true);
    const res = await saveResume(m.before);
    setUndoing(false);
    if (!res.ok) {
      setNotice(res.error);
      return;
    }
    setResume(m.before);
    setMsgs((list) => list.map((x) => (x.id === m.id ? { ...x, undone: true } : x)));
  }

  function startOver() {
    abortRef.current?.abort();
    setMsgs([opener(resume, firstName)]);
    setNotice("");
  }

  const paper = <Paper resume={resume} review={review} busy={busy} onPick={(g) => void send(`Let's work on this: ${g.label}.`, g)} />;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-start gap-12 px-6 pb-8" style={{ boxSizing: "border-box" }}>
      <section aria-label="Chat with Sync" className="flex min-w-0 max-w-[600px] flex-col" style={{ flex: "1 1 440px", height: `calc(100dvh - ${top}px)`, minHeight: 480 }}>
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--line)" }}>
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full" style={{ background: "var(--soft)" }}>
            <Mark size={22} color="var(--mark)" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="m-0" style={{ fontSize: 18, fontWeight: 600 }}>
              Sync
            </h1>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>Your resume coach</span>
          </div>
          <button type="button" className="btn btn-sm min-[1000px]:hidden" onClick={() => setSheet(true)} aria-haspopup="dialog">
            Resume · {review.score}%
          </button>
          <motion.button type="button" className="btn btn-p btn-sm" {...pressProps} disabled={busy} onClick={() => onDone(resume)}>
            {doneLabel}
          </motion.button>
        </div>

        <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation" className="flex flex-1 flex-col gap-5 overflow-y-auto py-6" style={{ overscrollBehavior: "contain" }}>
          {msgs.map((m) =>
            m.role === "user" ? (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                <p className="m-0 max-w-[85%] px-4 py-3" style={{ background: "var(--soft)", borderRadius: "14px 14px 4px 14px", fontSize: 16, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  {m.text}
                </p>
              </motion.div>
            ) : (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3" aria-busy={m.pending || undefined}>
                <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full" style={{ background: "var(--surface)" }}>
                  <Mark size={15} color="var(--mark)" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {m.pending && !m.text ? <Thinking editing={!!m.edits?.length} /> : null}
                  {paragraphs(m.text).map((p, i, all) => (
                    <p key={i} className="m-0" style={{ fontSize: 16, lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {p}
                      {m.pending && i === all.length - 1 ? <span className="caret" aria-hidden="true" /> : null}
                    </p>
                  ))}
                  {m.edits?.length ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {m.edits.map((e, i) => (
                        <span key={i} className="tag pop" style={m.undone ? { textDecoration: "line-through", color: "var(--muted)" } : undefined}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 6 }}>
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                          {e}
                        </span>
                      ))}
                      {m.undone ? (
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>Undone</span>
                      ) : m.id === lastEdited?.id && m.before && !busy ? (
                        <button type="button" className="link-btn" style={{ height: 28, fontSize: 13 }} disabled={undoing} onClick={() => void undo(m)}>
                          {undoing ? "Undoing…" : "Undo"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {m.error ? (
                    <p role="alert" className="m-0 flex flex-wrap items-center gap-2" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
                      {m.error}
                      {!busy ? (
                        <button type="button" className="link-btn" style={{ height: 28, fontSize: 14, color: "var(--accent)" }} onClick={() => retry(m)}>
                          Try again
                        </button>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            ),
          )}
        </div>

        <form
          className="flex flex-col gap-2 pt-3"
          style={{ borderTop: "1px solid var(--line)" }}
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              aria-label="Message Sync"
              className="field"
              rows={1}
              value={input}
              maxLength={LIMITS.message}
              placeholder="Answer in English, Filipino or Taglish"
              style={{ minHeight: 48, maxHeight: 160, height: "auto", resize: "none", padding: "12px 16px", fontSize: 16 }}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send(input);
                }
              }}
            />
            <Dictate compact lang={resume.language === "English" ? "en-PH" : "fil-PH"} onText={(t) => setInput((v) => `${v} ${t}`.trim())} />
            <motion.button type="submit" className="icon-btn" aria-label="Send" disabled={busy || !input.trim()} {...pressProps} style={{ width: 48, height: 48, background: input.trim() && !busy ? "var(--primary)" : "var(--line)", border: 0, color: "var(--ink)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </motion.button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2" style={{ fontSize: 13, color: "var(--muted)" }}>
            <span>
              Sync only writes what you tell it. You can undo any change. Sync uses Claude by Anthropic, so don&apos;t share passwords or ID numbers.{" "}
              <Link href="/privacy#sync" target="_blank">
                How Sync uses your data
              </Link>
            </span>
            <button type="button" className="link-btn" style={{ height: 28, fontSize: 13 }} disabled={busy} onClick={startOver}>
              Start over
            </button>
          </div>
          {notice ? (
            <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
              {notice}
            </p>
          ) : null}
        </form>
      </section>

      <aside aria-label="Your resume, live" className="sticky top-6 hidden min-w-0 max-w-[560px] min-[1000px]:block" style={{ flex: "1 1 420px", maxHeight: `calc(100dvh - ${top - 40}px)`, overflowY: "auto" }}>
        {paper}
      </aside>

      <AnimatePresence>
        {sheet ? (
          <>
            <motion.button key="scrim" type="button" aria-label="Close resume" className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.div key="sheet" role="dialog" aria-modal="true" aria-label="Your resume" className="drawer" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 30 }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
                <span style={{ fontWeight: 600 }}>Your resume</span>
                <button type="button" className="icon-btn" aria-label="Close" onClick={() => setSheet(false)}>
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">{paper}</div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Paper({ resume, review, busy, onPick }: { resume: ResumeData; review: ReturnType<typeof reviewResume>; busy: boolean; onPick: (g: Gap) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span style={{ fontSize: 15, fontWeight: 600 }}>Resume strength</span>
          <motion.span key={review.score} initial={{ scale: 1.25, color: "var(--accent)" }} animate={{ scale: 1, color: "var(--ink)" }} style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
            {review.score}%
          </motion.span>
        </div>
        <div role="progressbar" aria-label="Resume strength" aria-valuemin={0} aria-valuemax={100} aria-valuenow={review.score} className="h-1.5 overflow-hidden rounded" style={{ background: "var(--skeleton)" }}>
          <motion.span className="block h-full rounded" style={{ background: "var(--mark)" }} animate={{ width: `${review.score}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        {review.gaps.length ? (
          <div className="flex flex-col gap-1 pt-1">
            <span className="eyebrow">To strengthen</span>
            <ul className="m-0 flex list-none flex-col p-0">
              {review.gaps.slice(0, 6).map((g) => (
                <li key={g.id}>
                  <button type="button" className="link-btn flex w-full items-center justify-between gap-3 text-left" style={{ height: "auto", minHeight: 40, padding: "6px 0", fontWeight: 500, color: "var(--ink-2)" }} disabled={busy} onClick={() => onPick(g)}>
                    <span>{g.label}</span>
                    <span aria-hidden="true" style={{ color: "var(--muted)" }}>
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {review.gaps.length > 6 ? <span style={{ fontSize: 13, color: "var(--muted)" }}>And {review.gaps.length - 6} more</span> : null}
          </div>
        ) : (
          <span style={{ fontSize: 14, color: "var(--muted)" }}>Everything on the checklist is covered.</span>
        )}
      </div>
      <ResumeDoc data={resume} template="classic" />
    </div>
  );
}

function Thinking({ editing }: { editing: boolean }) {
  return (
    <span className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600 }}>
      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }} className="inline-flex">
        <Mark size={16} color="var(--mark)" />
      </motion.span>
      {editing ? "Sync is updating your resume…" : "Sync is thinking…"}
    </span>
  );
}
