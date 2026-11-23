"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Arrow, CompanyMark, Mark } from "@/components/brand";
import { CodeAuth, toE164 } from "@/components/code-auth";
import { pressProps } from "@/components/motion";
import { saveOnboarding, type TopJob } from "@/lib/actions/student";
import { clearDraft, hasDraft, loadDraft, saveDraft } from "@/lib/draft";
import { allowanceLabel, firstName, spell } from "@/lib/format";
import {
  ALLOWANCES,
  EMPTY_DRAFT,
  EXPERIENCE_DEFAULTS,
  EXPERIENCES,
  LANGUAGES,
  PLACES,
  draftToResume,
  followupTopic,
  skillsForCourse,
  type Draft,
  type Experience,
} from "@/lib/resume";
import type { ResumeItem } from "@/lib/types";

const TOTAL = 8;

// Returning with a named draft: offer to continue. Coming from the landing
// page with only a course: start at the name question.
function firstStep(draft: Draft): number {
  if (hasDraft(draft) && draft.name) return 0;
  const resumeAt = Math.min(Math.max(draft.last, 1), TOTAL);
  return draft.course ? Math.max(resumeAt, 2) : 1;
}

type SyncState = "idle" | "writing" | "done";

export function Flow() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  // This component only renders in the browser (see page.tsx), so the draft
  // can be read straight from localStorage.
  const [d, setD] = useState<Draft>(() => loadDraft());
  const [step, setStep] = useState(() => firstStep(loadDraft()));
  const [dir, setDir] = useState(1);
  const [saved, setSaved] = useState(false);
  const [capSync, setCapSync] = useState<SyncState>("idle");
  const [fupSync, setFupSync] = useState<SyncState>("idle");
  const [channel, setChannel] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ matches: number; top: TopJob | null } | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((patch: Partial<Draft>) => {
    setD((prev) => {
      const next = { ...prev, ...patch };
      saveDraft(next);
      return next;
    });
  }, []);

  const topic = followupTopic(d);

  function go(to: number, direction: number) {
    setDir(direction);
    setStep(to);
    setError("");
    if (to >= 1 && to <= TOTAL) update({ step: to, last: to });
    if (to > 0) {
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 1600);
    }
  }

  async function runSync(kind: "project" | "experience") {
    const answer = kind === "project" ? d.capstone : d.followup;
    if (answer.trim().length < 3) return;
    const set = kind === "project" ? setCapSync : setFupSync;
    set("writing");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          topic: kind === "experience" ? (topic ?? "") : "",
          question: kind === "project" ? "What did you build for your capstone?" : topic ? EXPERIENCE_DEFAULTS[topic].ask : "",
          answer,
          course: d.course,
        }),
      });
      if (!res.ok) throw new Error("sync failed");
      const out = (await res.json()) as { title: string; line: string; skills: string[] };
      const item: ResumeItem = { title: out.title, line: out.line };
      if (kind === "project") update({ capstoneItem: item, capstoneSkills: out.skills });
      else update({ followupItem: item, followupSkills: out.skills });
    } catch {
      // Keep the student's own words if Sync can't help.
      const item: ResumeItem = { title: kind === "project" ? "Capstone project" : (topic ?? "Experience"), line: answer.trim() };
      if (kind === "project") update({ capstoneItem: item });
      else update({ followupItem: item });
    }
    set("done");
  }

  function next() {
    if (step === 4 && d.capstone.trim()) void runSync("project");
    if (step === 6 && d.followup.trim()) void runSync("experience");
    if (step === 5 && !topic) {
      go(7, 1);
      return;
    }
    go(Math.min(step + 1, TOTAL), 1);
  }

  function back() {
    if (step === 7 && !topic) {
      go(5, -1);
      return;
    }
    go(Math.max(step - 1, 1), -1);
  }

  const canNext =
    (step === 1 && d.course.trim().length > 2) ||
    (step === 2 && d.name.trim().length > 1) ||
    step === 3 ||
    step === 4 ||
    (step === 5 && d.experiences.length > 0) ||
    step === 6 ||
    (step === 7 && d.places.length > 0);

  async function finish() {
    setSaving(true);
    setError("");
    const res = await saveOnboarding(
      {
        course: d.course,
        name: d.name,
        language: d.language,
        capstone: d.capstone,
        capstoneItem: d.capstoneItem,
        capstoneSkills: d.capstoneSkills,
        experiences: d.experiences,
        followup: d.followup,
        followupItem: d.followupItem,
        followupSkills: d.followupSkills,
        places: d.places,
        minAllowance: d.minAllowance,
      },
      channel === "phone" && phone ? toE164(phone) : undefined,
    );
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    clearDraft();
    setResult(res.data);
    setDir(1);
    setStep(9);
  }

  const resume = draftToResume(d);
  const answered = step === 0 ? d.last - 1 : step - 1;
  const inFlow = step >= 1 && step <= TOTAL;

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="flex flex-col gap-4 px-6 pt-5">
        <div className="flex items-center gap-4">
          {inFlow && step > 1 ? (
            <button className="icon-btn" aria-label="Back" onClick={back}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : (
            <Link href="/" aria-label="Unisync home" className="flex items-center gap-2 text-ink no-underline" style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em" }}>
              <Mark size={26} />
              unisync
            </Link>
          )}
          <div className="flex-1" />
          <AnimatePresence>
            {saved && inFlow ? (
              <motion.span role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600 }}>
                Saved
              </motion.span>
            ) : null}
          </AnimatePresence>
          {inFlow ? (
            <button className="link-btn" onClick={() => go(0, -1)}>
              Save and exit
            </button>
          ) : null}
        </div>
        {inFlow ? (
          <div className="flex items-center gap-3">
            <div role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step} className="h-1.5 flex-1 overflow-hidden rounded" style={{ background: "var(--skeleton)" }}>
              <motion.span className="block h-full rounded" style={{ background: "var(--mark)" }} animate={{ width: `${Math.round((step / TOTAL) * 100)}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" }}>
              {step} of {TOTAL}
            </span>
          </div>
        ) : null}
      </header>

      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-wrap items-start gap-16 px-6 pb-12" style={{ paddingTop: "7vh", boxSizing: "border-box" }}>
        <main className="flex min-w-0 max-w-[560px] flex-col gap-6" style={{ flex: "1 1 440px" }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 36, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: dir * -24, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="flex flex-col gap-5"
            >
              {step === 0 ? (
                <>
                  <h1 className="display m-0" style={{ fontSize: "clamp(40px,5.4vw,58px)" }}>
                    Welcome back{d.name ? `, ${firstName(d.name)}` : ""}.
                  </h1>
                  <p className="m-0" style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.5 }}>
                    Saved on this phone. {spell(Math.max(TOTAL - d.last + 1, 0), true)} {TOTAL - d.last + 1 === 1 ? "question" : "questions"} left.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <motion.button className="btn btn-p" {...pressProps} onClick={() => go(Math.max(d.last, 1), 1)}>
                      Continue
                    </motion.button>
                    <button
                      className="btn"
                      onClick={() => {
                        clearDraft();
                        setD(EMPTY_DRAFT);
                        go(1, 1);
                      }}
                    >
                      Start over
                    </button>
                  </div>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <Q id="q1">What&apos;s your course?</Q>
                  <input aria-labelledby="q1" className="big" value={d.course} autoFocus placeholder="BS Information Technology" onChange={(e) => update({ course: e.target.value })} onKeyDown={(e) => e.key === "Enter" && canNext && next()} />
                  <div className="flex flex-wrap gap-2">
                    {["BS Information Technology", "BS Computer Science", "BS Business Admin", "BS Accountancy", "BS Psychology"].map((c) => (
                      <button key={c} className="chip" onClick={() => update({ course: c })}>
                        {c.replace("BS ", "")}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <Q id="q2">What&apos;s your full name?</Q>
                  <input aria-labelledby="q2" className="big" value={d.name} autoFocus autoComplete="name" placeholder="Bea Santos" onChange={(e) => update({ name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && canNext && next()} />
                  <span style={{ fontSize: 15, color: "var(--muted)" }}>This goes on your resume.</span>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <Q id="q3">Which language do you prefer?</Q>
                  <div role="radiogroup" aria-labelledby="q3" className="flex flex-col gap-2">
                    {LANGUAGES.map((l) => (
                      <button key={l} className="opt" role="radio" aria-checked={d.language === l} onClick={() => update({ language: l })}>
                        {l}
                        <span className="dot" />
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: 15, color: "var(--muted)" }}>Your resume will be in English.</span>
                </>
              ) : null}

              {step === 4 ? (
                <>
                  <Q id="q4">{d.language === "Filipino" ? "Ano ang ginawa mo sa capstone mo?" : "What did you build for your capstone?"}</Q>
                  <textarea
                    aria-labelledby="q4"
                    className="area"
                    autoFocus
                    value={d.capstone}
                    placeholder="Inventory system para sa school canteen. Ako yung gumawa ng database, 4 kami sa team."
                    onChange={(e) => update({ capstone: e.target.value, capstoneItem: null })}
                  />
                  <Dictate lang={d.language === "English" ? "en-PH" : "fil-PH"} onText={(t) => update({ capstone: `${d.capstone} ${t}`.trim(), capstoneItem: null })} />
                </>
              ) : null}

              {step === 5 ? (
                <>
                  <Q id="q5">What else have you done?</Q>
                  <span style={{ fontSize: 16, color: "var(--muted)" }}>Select all that apply.</span>
                  <div role="group" aria-labelledby="q5" className="flex flex-wrap gap-2">
                    {EXPERIENCES.map((e) => {
                      const on = d.experiences.includes(e);
                      return (
                        <motion.button
                          key={e}
                          className="chip chip-lg"
                          aria-pressed={on}
                          {...pressProps}
                          onClick={() => {
                            let list: Experience[];
                            if (e === "None yet") list = on ? [] : ["None yet"];
                            else list = on ? d.experiences.filter((x) => x !== e) : [...d.experiences.filter((x) => x !== "None yet"), e];
                            const topicChanged = followupTopic({ experiences: list }) !== topic;
                            update({ experiences: list, ...(topicChanged ? { followup: "", followupItem: null, followupSkills: [] } : {}) });
                          }}
                        >
                          {e}
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {step === 6 && topic ? (
                <>
                  <Q id="q6">{EXPERIENCE_DEFAULTS[topic].ask}</Q>
                  <textarea
                    aria-labelledby="q6"
                    className="area"
                    autoFocus
                    value={d.followup}
                    placeholder={topic === "Club officer" ? "Treasurer ako ng IT Society. Nag-collect ng fees from mga 120 members, tapos monthly report sa Google Sheets." : "Tell Sync in your own words."}
                    onChange={(e) => update({ followup: e.target.value, followupItem: null })}
                  />
                  <Dictate lang={d.language === "English" ? "en-PH" : "fil-PH"} onText={(t) => update({ followup: `${d.followup} ${t}`.trim(), followupItem: null })} />
                </>
              ) : null}

              {step === 7 ? (
                <>
                  <Q id="q7">Where can you intern?</Q>
                  <div role="group" aria-labelledby="q7" className="flex flex-wrap gap-2">
                    {PLACES.map((p) => {
                      const on = d.places.includes(p);
                      return (
                        <motion.button key={p} className="chip chip-lg" aria-pressed={on} {...pressProps} onClick={() => update({ places: on ? d.places.filter((x) => x !== p) : [...d.places, p] })}>
                          {p}
                        </motion.button>
                      );
                    })}
                  </div>
                  <span id="pay" style={{ fontSize: 16, fontWeight: 600, paddingTop: 4 }}>
                    Minimum allowance
                  </span>
                  <div role="radiogroup" aria-labelledby="pay" className="flex flex-wrap gap-2">
                    {ALLOWANCES.map((a) => (
                      <button key={a.label} className="chip chip-lg" role="radio" aria-checked={d.minAllowance === a.value} onClick={() => update({ minAllowance: a.value })}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {step === 8 ? (
                <>
                  <Q id="q8">Save your resume.</Q>
                  {isSignedIn ? (
                    <>
                      <p className="m-0" style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.5 }}>
                        You&apos;re signed in{user?.primaryEmailAddress ? ` as ${user.primaryEmailAddress.emailAddress}` : ""}. We&apos;ll save it to your account.
                      </p>
                      <motion.button className="btn btn-p" {...pressProps} disabled={saving} onClick={() => void finish()}>
                        {saving ? "Saving…" : "Save my resume"}
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <p className="m-0" style={{ fontSize: 18, color: "var(--muted)", lineHeight: 1.5 }}>
                        Add your number so you can come back and companies can reach you.
                      </p>
                      <PhoneCapture channel={channel} onPhone={setPhone}>
                        <CodeAuth key={channel} channel={channel} fullName={d.name} onDone={() => finish()} submitLabel={channel === "phone" ? "Text me a code" : "Email me a code"} />
                      </PhoneCapture>
                      <div className="flex items-center gap-3" style={{ fontSize: 14, color: "var(--faint)" }}>
                        <span className="hairline flex-1" />
                        or
                        <span className="hairline flex-1" />
                      </div>
                      <button className="btn" onClick={() => setChannel(channel === "phone" ? "email" : "phone")}>
                        {channel === "phone" ? (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="3" y="5" width="18" height="14" rx="2" />
                              <path d="M3 7l9 6 9-6" />
                            </svg>
                            Use my school email
                          </>
                        ) : (
                          "Use my mobile number"
                        )}
                      </button>
                      <span className="text-center" style={{ fontSize: 14, color: "var(--muted)" }}>
                        We don&apos;t share your number.
                      </span>
                    </>
                  )}
                  {error ? (
                    <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
                      {error}
                    </p>
                  ) : null}
                </>
              ) : null}

              {step === 9 ? (
                <>
                  <motion.div initial={{ scale: 0.3, rotate: -90, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 14 }}>
                    <Mark size={88} color="#7C88DC" />
                  </motion.div>
                  <h1 className="display m-0" style={{ fontSize: "clamp(40px,5.4vw,58px)" }}>
                    You&apos;re ready, {firstName(resume.name) || "friend"}.
                  </h1>
                  <p className="m-0" style={{ fontSize: 18, color: "var(--muted)" }}>
                    {result && result.matches > 0
                      ? `${spell(result.matches, true)} ${result.matches === 1 ? "internship matches" : "internships match"} your resume. Here's the closest match.`
                      : "We'll show you new internships as companies post them."}
                  </p>
                  {result?.top ? (
                    <Link href={`/jobs?open=${result.top.id}`} className="card flex w-full items-center gap-4 p-4 text-ink no-underline" style={{ boxSizing: "border-box" }}>
                      <CompanyMark logo={result.top.logo} bg={result.top.logo_bg} size={52} />
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span style={{ fontWeight: 600, fontSize: 16 }}>{result.top.title}</span>
                        <span style={{ fontSize: 15, color: "var(--muted)" }}>
                          {result.top.company} · {result.top.mode === "Remote" ? "Remote" : result.top.city} · {allowanceLabel(result.top.allowance)}
                        </span>
                      </span>
                      <span aria-hidden="true" style={{ fontSize: 20 }}>
                        →
                      </span>
                    </Link>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <motion.button className="btn btn-p" {...pressProps} onClick={() => router.push("/jobs")}>
                      View all internships
                    </motion.button>
                    <Link href="/resume" className="btn">
                      Review my resume
                    </Link>
                  </div>
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {step >= 1 && step <= 7 ? (
            <div className="flex items-center justify-end gap-4 pt-1">
              {step === 4 || step === 6 ? (
                <button className="link-btn" onClick={() => go(step + 1, 1)}>
                  Skip
                </button>
              ) : null}
              <motion.button
                className="flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full border-0 text-ink"
                style={{ background: canNext ? "var(--primary)" : "var(--line)", color: canNext ? "var(--ink)" : "var(--faint)" }}
                aria-label="Next"
                disabled={!canNext}
                {...pressProps}
                onClick={next}
              >
                <Arrow />
              </motion.button>
            </div>
          ) : null}
        </main>

        <LivePaper d={d} answered={answered} capSync={capSync} fupSync={fupSync} />
      </div>
    </div>
  );
}

function Q({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h1 id={id} className="display m-0" style={{ fontSize: "clamp(32px,4vw,44px)", lineHeight: 1.05 }}>
      {children}
    </h1>
  );
}

function PhoneCapture({ channel, onPhone, children }: { channel: "phone" | "email"; onPhone: (p: string) => void; children: React.ReactNode }) {
  // Watch the phone input inside CodeAuth so the number lands on the resume.
  return (
    <div
      onInput={(e) => {
        const t = e.target as HTMLInputElement;
        if (channel === "phone" && t.type === "tel") onPhone(t.value);
      }}
    >
      {children}
    </div>
  );
}

type Recognition = { lang: string; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null };

function Dictate({ lang, onText }: { lang: string; onText: (t: string) => void }) {
  const [supported] = useState(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  });
  const [on, setOn] = useState(false);
  const rec = useRef<Recognition | null>(null);
  if (!supported) return null;
  return (
    <button
      type="button"
      className="btn self-start"
      aria-pressed={on}
      onClick={() => {
        if (on) {
          rec.current?.stop();
          return;
        }
        const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
        const R = (w.SpeechRecognition || w.webkitSpeechRecognition)!;
        const r = new R();
        r.lang = lang;
        r.interimResults = false;
        r.onresult = (e) => {
          const t = Array.from(e.results)
            .map((x) => x[0]?.transcript ?? "")
            .join(" ");
          if (t.trim()) onText(t.trim());
        };
        r.onend = () => setOn(false);
        rec.current = r;
        setOn(true);
        r.start();
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0014 0M12 18v3" />
      </svg>
      {on ? "Listening… tap to stop" : "Record a voice note"}
    </button>
  );
}

function LivePaper({ d, answered, capSync, fupSync }: { d: Draft; answered: number; capSync: SyncState; fupSync: SyncState }) {
  const r = draftToResume(d);
  const skills = r.skills.length ? r.skills : skillsForCourse(d.course);
  const lead = r.experience;
  return (
    <aside aria-label="Your resume, live" className="relative hidden min-w-0 max-w-[480px] min-[1000px]:block" style={{ flex: "1 1 400px" }}>
      <div aria-hidden="true" className="absolute rounded-xl" style={{ inset: "24px -16px -16px 24px", background: "var(--surface)" }} />
      <div className="card relative flex min-h-[520px] flex-col gap-4 p-10" style={{ boxSizing: "border-box" }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Your resume</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Updates as you answer</span>
        </div>
        {r.name ? (
          <span key={r.name.length > 0 ? "n" : "x"} className="display pop" style={{ fontSize: 30 }}>
            {r.name}
          </span>
        ) : (
          <span className="display" style={{ fontSize: 30, color: "var(--ghost)" }}>
            Your name
          </span>
        )}
        <span style={{ fontSize: 16, fontWeight: 500, color: r.course ? "var(--ink)" : "var(--ghost)" }}>{r.course || "Your course"}</span>
        <span style={{ height: 2, background: "var(--ink)" }} />

        <div className="flex flex-col gap-2">
          <span className="eyebrow">Projects</span>
          {capSync === "writing" && !d.capstoneItem ? <Writing /> : null}
          {d.capstoneItem ? (
            <div className="pop flex flex-col gap-0.5">
              <span style={{ fontWeight: 600 }}>{d.capstoneItem.title}</span>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>{d.capstoneItem.line}</span>
            </div>
          ) : capSync !== "writing" ? (
            <>
              <span className="sk" style={{ width: "70%" }} />
              <span className="sk" style={{ width: "90%" }} />
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <span className="eyebrow">Experience</span>
          {fupSync === "writing" && !d.followupItem ? <Writing /> : null}
          {lead.length && answered >= 5 ? (
            lead.map((e, i) => (
              <div key={`${e.title}-${i}`} className="pop flex flex-col gap-0.5">
                <span style={{ fontWeight: 600 }}>{e.title}</span>
                <span style={{ fontSize: 14, color: "var(--muted)" }}>{e.line}</span>
              </div>
            ))
          ) : (
            <>
              <span className="sk" style={{ width: "60%" }} />
              <span className="sk" style={{ width: "84%" }} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="eyebrow">Skills</span>
          <div className="flex flex-wrap gap-1">
            {skills.map((k) => (
              <span key={k} className="tag pop">
                {k}
              </span>
            ))}
            {skills.length === 0 ? <span className="sk" style={{ width: "50%" }} /> : null}
          </div>
        </div>

        {d.places.length ? (
          <div className="pop mt-auto rounded-[10px] px-4 py-3" style={{ background: "var(--surface)", fontSize: 14, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>Preferences:</span> {d.places.join(", ")} · {d.minAllowance ? `₱${d.minAllowance.toLocaleString("en-US")}+ allowance minimum` : "any allowance"}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function Writing() {
  return (
    <span className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600 }}>
      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }} className="inline-flex">
        <Mark size={16} color="var(--mark)" />
      </motion.span>
      Sync is writing…
    </span>
  );
}
