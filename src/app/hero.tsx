"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mark } from "@/components/brand";
import { Reveal, pressProps } from "@/components/motion";
import { COMMON_COURSES, skillsForCourse } from "@/lib/resume";
import { loadDraft, saveDraft } from "@/lib/draft";

export function Hero() {
  const router = useRouter();
  const [course, setCourse] = useState("");
  const [typing, setTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  function typeOut(text: string) {
    if (timer.current) clearInterval(timer.current);
    let i = 0;
    setTyping(true);
    setCourse("");
    timer.current = setInterval(() => {
      i++;
      setCourse(text.slice(0, i));
      if (i >= text.length) {
        if (timer.current) clearInterval(timer.current);
        setTyping(false);
      }
    }, 28);
  }

  const c = course.trim();
  const ready = c.length > 2 && !typing;
  const skills = ready ? skillsForCourse(c) : [];

  function start() {
    if (!ready) return;
    const d = loadDraft();
    saveDraft({ ...d, course: c, step: Math.max(d.step, 2), last: Math.max(d.last, 2) });
    router.push("/start");
  }

  return (
    <section aria-labelledby="hero-h">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 pb-24 pt-12" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(460px,100%),1fr))" }}>
        <div className="flex flex-col gap-6">
          <Reveal i={0} blur y={28}>
            <h1 id="hero-h" className="display m-0" style={{ fontSize: "clamp(44px,6vw,80px)" }}>
              Build your first resume
              <br />
              <span style={{ color: "var(--accent)" }}>in one chat.</span>
            </h1>
          </Reveal>
          <Reveal i={1} blur y={28}>
            <p className="m-0 max-w-[470px]" style={{ fontSize: 18, lineHeight: 1.5, color: "var(--muted)" }}>
              Then apply to internships at verified companies.
            </p>
          </Reveal>
          <Reveal i={2} blur y={28}>
            <form
              className="card card-shadow flex max-w-[520px] flex-col gap-4 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                start();
              }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full" style={{ background: "#1E2140" }}>
                  <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">
                    <circle cx="16" cy="16" r="8" fill="#A99BF0" />
                  </svg>
                </span>
                <label htmlFor="course" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.005em" }}>
                  What&apos;s your course?
                </label>
              </div>
              <input
                id="course"
                type="text"
                value={course}
                autoComplete="off"
                onChange={(e) => {
                  if (timer.current) clearInterval(timer.current);
                  setTyping(false);
                  setCourse(e.target.value);
                }}
                placeholder="e.g. BS Information Technology"
                className="field field-lg"
                style={{ borderWidth: 2, borderColor: c ? "var(--accent)" : "var(--line-2)", outline: "none" }}
              />
              <div role="group" aria-label="Common courses" className="flex flex-wrap gap-2">
                {COMMON_COURSES.map((n) => (
                  <button key={n} type="button" className="chip" onClick={() => typeOut(n)}>
                    {n.replace("BS ", "")}
                  </button>
                ))}
              </div>
              {ready ? (
                <motion.button type="submit" className="btn btn-p pop" {...pressProps}>
                  Build my resume <span aria-hidden="true">→</span>
                </motion.button>
              ) : (
                <button type="button" className="btn btn-off" disabled>
                  Build my resume <span aria-hidden="true">→</span>
                </button>
              )}
              <span className="text-center" style={{ fontSize: 14, color: "var(--muted)" }}>
                Free for students. No account needed to start.
              </span>
            </form>
          </Reveal>
        </div>

        <Reveal i={3} blur y={28} className="relative w-full max-w-[470px] justify-self-center">
          <div aria-label="Your resume, live preview">
            <div aria-hidden="true" className="absolute rounded-xl" style={{ inset: "24px -16px -16px 24px", background: "var(--surface)" }} />
            <div className="card relative flex min-h-[460px] flex-col gap-4 p-10" style={{ boxSizing: "border-box" }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Your resume</span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{ready ? "Two of eight filled" : "Zero of eight filled"}</span>
              </div>
              <span className="display" style={{ fontSize: 30, color: "var(--ghost)" }}>
                Your name
              </span>
              <span style={{ fontSize: 16, fontWeight: 500, minHeight: 24, color: c ? "var(--ink)" : "var(--ghost)" }}>
                {c || "Your course"}
                {typing ? <span className="caret" /> : null}
              </span>
              <span style={{ height: 2, background: "var(--ink)" }} />
              <Skel label="Projects" widths={[70, 92]} />
              <Skel label="Experience" widths={[60, 85, 40]} />
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
            </div>
          </div>
        </Reveal>
      </div>
      <span className="sr-only">
        <Mark />
      </span>
    </section>
  );
}

function Skel({ label, widths }: { label: string; widths: number[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="eyebrow">{label}</span>
      {widths.map((w) => (
        <span key={w} className="sk" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
