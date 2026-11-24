"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Mark } from "@/components/brand";
import { Dictate } from "@/components/dictate";
import { pressProps } from "@/components/motion";
import { COACH_LIMITS, coachLocked, emptyCoach, type CoachChange, type CoachMessage, type CoachMode, type CoachReply, type CoachResume, type CoachState } from "@/lib/coach-shared";
import type { LANGUAGES } from "@/lib/resume";

type Props = {
  mode: CoachMode;
  language: (typeof LANGUAGES)[number];
  name: string;
  course: string;
  // Saved chat, or null to start one from `seed`.
  state: CoachState | null;
  seed: CoachResume;
  onState: (s: CoachState) => void;
  onFinish: () => void;
  finishLabel: string;
};

// The chat with Sync. Each turn goes to /api/sync/coach, which returns Sync's
// reply, the updated resume and a new transcript signature.
export function SyncChat({ mode, language, name, course, state, seed, onState, onFinish, finishLabel }: Props) {
  const s = state ?? emptyCoach(seed);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const inflight = useRef(false);
  const end = useRef<HTMLDivElement | null>(null);
  const box = useRef<HTMLTextAreaElement | null>(null);
  const locked = coachLocked(s);
  const lastSync = [...s.messages].reverse().find((m) => m.role === "sync");

  async function send(text: string, from: CoachState = s): Promise<void> {
    if (inflight.current) return;
    inflight.current = true;
    setBusy(true);
    setError("");
    setPending(text);
    setInput("");
    let restart: CoachState | null = null;
    try {
      const res = await fetch("/api/sync/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          language,
          name,
          course,
          resume: from.resume,
          messages: from.messages.map(({ role, text, focus }) => ({ role, text, focus })),
          strikes: from.strikes,
          sig: from.sig,
          message: text,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as Partial<CoachReply> & { error?: string; reset?: boolean };
      if (!res.ok) {
        if (body.reset) {
          restart = emptyCoach(from.resume);
          onState(restart);
        }
        setError(body.error ?? "Sync couldn't reply. Try again.");
        setInput((cur) => cur || text);
        return;
      }
      const out = body as CoachReply;
      onState({
        resume: out.resume,
        messages: [...from.messages, ...out.appended],
        strikes: out.strikes,
        sig: out.sig,
        done: out.done,
        quickReplies: out.quickReplies,
      });
    } catch {
      setError("You might be offline. Check your connection and try again.");
      setInput((cur) => cur || text);
    } finally {
      inflight.current = false;
      setBusy(false);
      setPending("");
    }
    if (restart) await send("", restart);
  }

  // Sync opens the chat with its first question.
  useEffect(() => {
    if (started.current || s.messages.length > 0) return;
    started.current = true;
    if (!state) onState(s);
    void send("", s);
    // Runs once, when the chat first shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [s.messages.length, busy]);

  // Grow the message box with its text, and shrink it back after sending.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, 160)}px`;
  }, [input]);

  function submit() {
    const text = input.trim();
    if (!text || busy || locked) return;
    void send(text);
  }

  return (
    <section aria-label="Chat with Sync" className="flex flex-col gap-4">
      <ol className="m-0 flex list-none flex-col gap-4 p-0" aria-live="polite" aria-relevant="additions">
        {s.messages.map((m, i) => (
          <li key={i}>{m.role === "sync" ? <SyncBubble m={m} /> : <StudentBubble text={m.text} />}</li>
        ))}
        {pending ? (
          <li>
            <StudentBubble text={pending} />
          </li>
        ) : null}
      </ol>

      <AnimatePresence>
        {busy ? (
          <motion.span
            key="typing"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
            style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600 }}
          >
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }} className="inline-flex">
              <Mark size={16} color="var(--mark)" />
            </motion.span>
            {s.messages.length === 0 ? "Sync is reading your resume…" : "Sync is writing…"}
          </motion.span>
        ) : null}
      </AnimatePresence>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
          {error}
          {s.messages.length === 0 && !busy ? (
            <button type="button" className="btn btn-sm" onClick={() => void send("")}>
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {!busy && !locked && s.quickReplies.length && lastSync === s.messages[s.messages.length - 1] ? (
        <div className="flex flex-wrap gap-2" aria-label="Quick replies">
          {s.quickReplies.map((q) => (
            <motion.button key={q} type="button" className="chip" {...pressProps} onClick={() => void send(q)}>
              {q}
            </motion.button>
          ))}
        </div>
      ) : null}

      <div ref={end} />

      {locked ? (
        <p className="m-0 rounded-[10px] px-4 py-3" style={{ background: "var(--surface)", fontSize: 15, lineHeight: 1.5 }}>
          {locked === "turns" ? "That's all the questions for this chat." : "This chat has ended."} Your resume keeps every change Sync made.
        </p>
      ) : (
        <form
          className="sticky bottom-0 z-10 -mx-1 flex items-end gap-2 px-1 pb-3 pt-2"
          style={{ background: "var(--paper)" }}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <textarea
            ref={box}
            className="field"
            aria-label="Message Sync"
            rows={1}
            maxLength={COACH_LIMITS.message}
            value={input}
            placeholder={language === "English" ? "Answer in your own words…" : "Sagot mo, kahit Taglish…"}
            style={{ minHeight: 48, maxHeight: 160, resize: "none", padding: "12px 16px", fontSize: 16, lineHeight: 1.45 }}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Dictate compact lang={language === "English" ? "en-PH" : "fil-PH"} onText={(t) => setInput((cur) => `${cur} ${t}`.trim())} />
          <motion.button
            type="submit"
            aria-label="Send"
            className="flex h-12 w-12 flex-none cursor-pointer items-center justify-center rounded-full border-0"
            style={{ background: input.trim() && !busy ? "var(--primary)" : "var(--line)", color: input.trim() && !busy ? "var(--ink)" : "var(--faint)" }}
            disabled={!input.trim() || busy}
            {...pressProps}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </motion.button>
        </form>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex-1" style={{ fontSize: 13, color: "var(--muted)", minWidth: 200 }}>
          Sync only writes what you tell it. Check every line before you apply.
        </span>
        <motion.button type="button" className={s.done || locked ? "btn btn-p" : "btn"} disabled={busy} {...pressProps} onClick={onFinish}>
          {finishLabel}
        </motion.button>
      </div>
    </section>
  );
}

function SyncBubble({ m }: { m: CoachMessage }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} className="flex items-start gap-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full" style={{ background: "#1E2140" }} aria-hidden="true">
        <Mark size={18} color="#D4DAFF" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="sr-only">Sync:</span>
        <p className="m-0" style={{ fontSize: 17, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {m.text}
        </p>
        {m.changes?.length ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Changes to your resume">
            {m.changes.map((c, i) => (
              <ChangeCard key={i} c={c} />
            ))}
          </ul>
        ) : null}
      </div>
    </motion.div>
  );
}

const KIND_LABEL: Record<CoachChange["kind"], string> = { added: "Added", updated: "Updated", removed: "Removed" };

function ChangeCard({ c }: { c: CoachChange }) {
  const lines = c.detail ? c.detail.split("\n") : [];
  return (
    <li className="pop rounded-[10px] px-4 py-3" style={{ background: c.kind === "removed" ? "var(--surface)" : "var(--soft-2)", border: "1px solid var(--line)" }}>
      <span className="eyebrow" style={{ color: c.kind === "removed" ? "var(--muted)" : "var(--accent)" }}>
        {KIND_LABEL[c.kind]}
      </span>
      <span className="block" style={{ fontWeight: 600, fontSize: 15, textDecoration: c.kind === "removed" ? "line-through" : undefined }}>
        {c.what}
      </span>
      {lines.length ? (
        <span className="mt-1 flex flex-col gap-0.5" style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.45 }}>
          {lines.map((l, i) => (
            <span key={i}>{i > 0 ? `• ${l}` : l}</span>
          ))}
        </span>
      ) : null}
    </li>
  );
}

function StudentBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="m-0 max-w-[85%] rounded-xl px-4 py-3" style={{ background: "var(--soft)", fontSize: 16, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
        <span className="sr-only">You: </span>
        {text}
      </p>
    </div>
  );
}
