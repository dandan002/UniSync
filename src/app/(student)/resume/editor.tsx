"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Mark } from "@/components/brand";
import { ConfirmDialog } from "@/components/confirm";
import { FormUpload } from "@/components/form-upload";
import { pressProps } from "@/components/motion";
import { ResumeDoc } from "@/components/resume-doc";
import { deleteResume } from "@/lib/actions/account";
import { approveResume, saveResume, setTemplate } from "@/lib/actions/student";
import { forgetChat } from "@/lib/draft";
import { spell } from "@/lib/format";
import { reviewResume } from "@/lib/review";
import type { FormKey, ResumeData, ResumeItem, Template } from "@/lib/types";

const TEMPLATES: Array<{ id: Template; name: string }> = [
  { id: "classic", name: "Classic" },
  { id: "modern", name: "Modern" },
  { id: "compact", name: "Compact" },
];

export function ResumeEditor({
  studentId,
  data: initial,
  template: initialTemplate,
  approved: initialApproved,
  forms,
}: {
  studentId: string;
  data: ResumeData;
  template: Template;
  approved: boolean;
  forms: { done: number; total: number; next: string | null; uploadable: FormKey[] };
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [tpl, setTpl] = useState<Template>(initialTemplate);
  const [approved, setApproved] = useState(initialApproved);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [, start] = useTransition();
  const idx = TEMPLATES.findIndex((t) => t.id === tpl);
  const done = Math.min(forms.done + (approved && !initialApproved ? 1 : 0), forms.total);
  const review = reviewResume(data);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-5 gap-y-3 px-6 py-3">
          <span style={{ fontSize: 15, fontWeight: 500 }}>School forms</span>
          <div role="progressbar" aria-label="School forms" aria-valuemin={0} aria-valuemax={forms.total} aria-valuenow={done} className="h-1.5 overflow-hidden rounded" style={{ flex: "1 1 200px", maxWidth: 360, background: "var(--line)" }}>
            <motion.span className="block h-full rounded" style={{ background: "var(--mark)", transformOrigin: "left" }} initial={{ width: 0 }} animate={{ width: `${Math.round((done / forms.total) * 100)}%` }} transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <span style={{ fontSize: 15, color: "var(--muted)" }}>
            {spell(done, true)} of {spell(forms.total)}
          </span>
          <span className="flex-1" />
          {forms.next ? <span style={{ fontSize: 15, color: "var(--muted)" }}>Next: {forms.next.toLowerCase()}</span> : <span style={{ fontSize: 15, color: "var(--accent)", fontWeight: 500 }}>All forms in</span>}
          <FormUpload studentId={studentId} missing={forms.uploadable} />
        </div>
      </motion.div>

      <main className="mx-auto flex max-w-[880px] flex-col gap-6 px-6 pb-20 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="display m-0" style={{ fontSize: "clamp(32px,4vw,44px)", lineHeight: 1 }}>
              Your resume
            </h1>
            <span style={{ fontSize: 16, color: "var(--muted)" }}>
              Built from your answers. Strength {review.score}%
              {review.gaps.length ? ` · Sync can help with ${spell(review.gaps.length)} ${review.gaps.length === 1 ? "thing" : "things"}` : ""}.
            </span>
          </div>
          <div role="tablist" aria-label="Template" className="relative flex w-[300px] rounded-[10px] p-1" style={{ background: "var(--line-3)" }}>
            <motion.span
              aria-hidden="true"
              className="absolute top-1 left-1 h-[38px] rounded-lg"
              style={{ width: "calc((100% - 8px) / 3)", background: "var(--paper)", boxShadow: "0 1px 2px rgba(30,33,64,.05)" }}
              animate={{ x: `${idx * 100}%` }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            />
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tpl === t.id}
                className="relative z-[1] h-[38px] flex-1 cursor-pointer border-0 bg-transparent"
                style={{ font: "inherit", fontSize: 14, fontWeight: 500, color: tpl === t.id ? "var(--ink)" : "var(--muted)" }}
                onClick={() => {
                  setTpl(t.id);
                  start(async () => void (await setTemplate(t.id)));
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {editing ? (
          <Editor
            data={data}
            onCancel={() => setEditing(false)}
            onSave={async (next) => {
              const res = await saveResume(next, tpl);
              if (!res.ok) return res.error;
              setData(next);
              setEditing(false);
              router.refresh();
              return "";
            }}
          />
        ) : (
          <motion.div key={tpl} initial={{ opacity: 0.6, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <ResumeDoc data={data} template={tpl} className="print-area" />
          </motion.div>
        )}

        {!editing ? (
          <div className="flex flex-wrap items-center gap-2">
            {approved ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Link href="/jobs" className="btn btn-p" style={{ height: 48 }}>
                  Approved. Browse internships
                </Link>
              </motion.div>
            ) : (
              <HoldToApprove
                onDone={async () => {
                  const res = await approveResume();
                  if (!res.ok) {
                    setError(res.error);
                    return;
                  }
                  setApproved(true);
                  router.refresh();
                }}
              />
            )}
            <button className="btn" style={{ height: 48 }} onClick={() => setEditing(true)}>
              Edit
            </button>
            <Link href="/resume/sync" className="btn" style={{ height: 48 }}>
              <Mark size={16} color="var(--mark)" />
              Improve with Sync
            </Link>
            <button className="btn btn-ghost" style={{ height: 48 }} onClick={() => window.print()}>
              Download PDF
            </button>
            <span className="flex-1" />
            <button className="link-btn" style={{ color: "var(--lilac-ink)" }} onClick={() => setRemoving(true)}>
              Delete resume
            </button>
          </div>
        ) : null}
        {removing ? (
          <ConfirmDialog
            title="Delete your resume?"
            confirmLabel="Delete resume"
            onClose={() => setRemoving(false)}
            onConfirm={async () => {
              const res = await deleteResume();
              if (!res.ok) return res.error;
              forgetChat(studentId);
              router.push("/start");
            }}
          >
            <p className="m-0">This removes your resume, its approval and your chat with Sync. Your account, applications and school forms stay.</p>
            <p className="m-0">You&apos;ll start again from the first question. Companies you&apos;ve applied to see an empty resume until you build a new one.</p>
          </ConfirmDialog>
        ) : null}
        {error ? (
          <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
            {error}
          </p>
        ) : null}
      </main>
    </>
  );
}

// Press and hold for one second. Keyboard: hold Space or Enter, or press twice.
function HoldToApprove({ onDone }: { onDone: () => void | Promise<void> }) {
  const progress = useMotionValue(0);
  const scaleX = useTransform(progress, (v) => v);
  const anim = useRef<ReturnType<typeof animate> | null>(null);
  const [busy, setBusy] = useState(false);
  const fired = useRef(false);

  function begin() {
    if (busy) return;
    fired.current = false;
    anim.current?.stop();
    anim.current = animate(progress, 1, {
      duration: 1 * (1 - progress.get()),
      ease: "linear",
      onComplete: async () => {
        if (fired.current) return;
        fired.current = true;
        setBusy(true);
        await onDone();
        setBusy(false);
      },
    });
  }
  function cancel() {
    if (fired.current) return;
    anim.current?.stop();
    anim.current = animate(progress, 0, { duration: 0.25 });
  }

  return (
    <motion.button
      className="btn btn-p"
      style={{ minWidth: 240, height: 48, userSelect: "none", touchAction: "none" }}
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") cancel();
      }}
      {...pressProps}
      aria-label="Hold to approve your resume"
    >
      <motion.span aria-hidden="true" className="absolute inset-0" style={{ background: "var(--primary-hover)", transformOrigin: "left", scaleX }} />
      <span className="relative">{busy ? "Approving…" : "Hold to approve"}</span>
    </motion.button>
  );
}

function Editor({ data, onSave, onCancel }: { data: ResumeData; onSave: (d: ResumeData) => Promise<string>; onCancel: () => void }) {
  const [d, setD] = useState<ResumeData>(data);
  const [skills, setSkills] = useState(data.skills.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<ResumeData>) => setD((x) => ({ ...x, ...patch }));

  function items(key: "projects" | "experience") {
    const list = d[key];
    const update = (i: number, patch: Partial<ResumeItem>) => set({ [key]: list.map((it, j) => (j === i ? { ...it, ...patch } : it)) } as Partial<ResumeData>);
    return (
      <fieldset className="card flex flex-col gap-4 p-5" style={{ border: "1px solid var(--line)" }}>
        <legend className="eyebrow px-1">{key === "projects" ? "Projects" : "Experience"}</legend>
        {list.map((it, i) => (
          <div key={i} className="flex flex-col gap-2" style={{ borderBottom: i < list.length - 1 ? "1px solid var(--line-3)" : 0, paddingBottom: 12 }}>
            <div className="grid gap-2" style={{ gridTemplateColumns: key === "experience" ? "140px 1fr 120px" : "1fr 120px" }}>
              {key === "experience" ? (
                <select className="field" aria-label="Section" value={it.section ?? "Work"} onChange={(e) => update(i, { section: e.target.value as ResumeItem["section"] })}>
                  {["Leadership", "Work", "Volunteer", "Activities"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              ) : null}
              <input className="field" aria-label="Title" value={it.title} onChange={(e) => update(i, { title: e.target.value })} />
              <input className="field" aria-label="When" placeholder="2026" value={it.when ?? ""} onChange={(e) => update(i, { when: e.target.value })} />
            </div>
            <textarea className="field" aria-label="Description" value={it.line} onChange={(e) => update(i, { line: e.target.value })} style={{ minHeight: 70 }} />
            <textarea
              className="field"
              aria-label="Bullets, one per line"
              placeholder="Bullets, one per line"
              value={(it.bullets ?? []).join("\n")}
              onChange={(e) => update(i, { bullets: e.target.value.split("\n").slice(0, 6) })}
              style={{ minHeight: 70 }}
            />
            <button type="button" className="link-btn self-start" style={{ height: 32 }} onClick={() => set({ [key]: list.filter((_, j) => j !== i) } as Partial<ResumeData>)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-sm self-start" onClick={() => set({ [key]: [...list, { title: "", line: "", section: key === "experience" ? "Work" : undefined }] } as Partial<ResumeData>)}>
          Add {key === "projects" ? "a project" : "an entry"}
        </button>
      </fieldset>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const tidy = (list: ResumeItem[]) =>
          list
            .filter((p) => p.title.trim())
            .map((p) => {
              const bullets = (p.bullets ?? []).map((b) => b.trim()).filter(Boolean);
              return { ...p, bullets: bullets.length ? bullets : undefined };
            });
        const next: ResumeData = {
          ...d,
          summary: d.summary?.trim() || undefined,
          projects: tidy(d.projects),
          experience: tidy(d.experience),
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
        };
        const err = await onSave(next);
        setBusy(false);
        setError(err);
      }}
    >
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        <label className="label">
          Name
          <input className="field" value={d.name} onChange={(e) => set({ name: e.target.value })} required />
        </label>
        <label className="label">
          Course
          <input className="field" value={d.course} onChange={(e) => set({ course: e.target.value })} />
        </label>
        <label className="label">
          Email
          <input className="field" type="email" value={d.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
        </label>
        <label className="label">
          City or province
          <input className="field" value={d.city ?? ""} onChange={(e) => set({ city: e.target.value })} />
        </label>
        <label className="label">
          Available
          <input className="field" placeholder="April to July" value={d.availability ?? ""} onChange={(e) => set({ availability: e.target.value })} />
        </label>
      </div>
      <label className="label">
        Summary
        <textarea className="field" value={d.summary ?? ""} maxLength={400} placeholder="One or two sentences: the internship you want and what you bring." onChange={(e) => set({ summary: e.target.value })} style={{ minHeight: 70 }} />
      </label>
      {items("projects")}
      {items("experience")}
      <label className="label">
        Skills, separated by commas
        <input className="field" value={skills} onChange={(e) => setSkills(e.target.value)} />
      </label>
      {error ? (
        <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <motion.button type="submit" className="btn btn-p" disabled={busy} {...pressProps}>
          {busy ? "Saving…" : "Save changes"}
        </motion.button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
