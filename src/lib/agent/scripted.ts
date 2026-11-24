import "server-only";
import { applyEdit as apply, cleanText, LIMITS } from "@/lib/agent/edits";
import { reviewResume, shortName, type Gap } from "@/lib/review";
import { ruleRewrite } from "@/lib/sync";
import type { ResumeData } from "@/lib/types";

// Without ANTHROPIC_API_KEY, Sync walks the checklist with fixed questions
// and files each answer with the rule-based rewrite. Less clever, but the
// chat still works and the resume still improves.

const WHEN_WORDS = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|summer|semester|sem|week|month|now|anytime|asap|\d{4})/i;

function splitList(answer: string): string[] {
  return answer
    .split(/[,;\n/]|\band\b|\bat\b/i)
    .map((s) => cleanText(s.replace(/^(i (used|know|can use)|marunong ako ng|alam ko ang)\s+/i, ""), LIMITS.skill))
    .filter((s) => s.length >= 2 && s.split(" ").length <= 4);
}

function sentence(s: string): string {
  const t = cleanText(s, LIMITS.summary);
  if (!t) return t;
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(cap) ? cap : `${cap}.`;
}

const applyEdit = (resume: ResumeData, name: string, input: unknown) => apply(resume, name, input, { voice: false });

function fileAnswer(resume: ResumeData, gap: Gap, answer: string) {
  const item = gap.ref ? resume[gap.ref.list][gap.ref.index] : undefined;
  switch (gap.kind) {
    case "no-project": {
      const rr = ruleRewrite({ kind: "project", topic: "", answer });
      const added = applyEdit(resume, "add_entry", { list: "projects", title: rr.title, line: rr.line });
      if (!added.ok || !rr.skills.length) return added;
      const skills = applyEdit(added.resume, "set_skills", { skills: [...added.resume.skills, ...rr.skills] });
      return skills.ok ? { ...skills, label: added.label } : added;
    }
    case "placeholder": {
      if (!item || !gap.ref) return null;
      const rr = ruleRewrite({ kind: "experience", topic: item.kind ?? item.title, answer });
      return applyEdit(resume, "edit_entry", { ...gap.ref, line: rr.line });
    }
    case "detail":
    case "result": {
      if (!item || !gap.ref) return null;
      const rr = ruleRewrite({ kind: gap.ref.list === "projects" ? "project" : "experience", topic: item.title, answer });
      return applyEdit(resume, "edit_entry", { ...gap.ref, bullets: [...(item.bullets ?? []), rr.line] });
    }
    case "dates":
      if (!gap.ref) return null;
      return applyEdit(resume, "edit_entry", { ...gap.ref, when: cleanText(answer, LIMITS.when) });
    case "skills": {
      const said = splitList(answer);
      if (!said.length) return null;
      return applyEdit(resume, "set_skills", { skills: said.length >= 3 ? said : [...said, ...resume.skills] });
    }
    case "summary":
      return applyEdit(resume, "set_profile", { summary: sentence(answer) });
    case "details": {
      const when = WHEN_WORDS.test(answer);
      if (!resume.availability && (when || resume.city)) return applyEdit(resume, "set_profile", { availability: cleanText(answer, LIMITS.availability) });
      return applyEdit(resume, "set_profile", { city: cleanText(answer, LIMITS.city) });
    }
  }
}

export function scriptedTurn(
  resume: ResumeData,
  { focus, pick, message }: { focus?: string; pick?: string; message: string },
): { resume: ResumeData; edits: string[]; text: string; focus?: string } {
  const gaps = reviewResume(resume).gaps;
  // The student tapped a checklist item: ask about it instead of filing an answer.
  const picked = pick ? gaps.find((g) => g.id === pick) : undefined;
  if (picked) return { resume, edits: [], text: picked.ask, focus: picked.id };

  const gap = gaps.find((g) => g.id === focus) ?? null;
  const filed = gap ? fileAnswer(resume, gap, message) : null;
  const next = filed?.ok ? filed.resume : resume;
  const edits = filed?.ok ? [filed.label] : [];

  const left = reviewResume(next).gaps;
  const same = gap ? left.find((g) => g.id === gap.id) : undefined;
  // Ask once more when an answer added detail but the entry is still thin.
  const upcoming = same?.kind === "detail" && filed?.ok && same.ref ? { ...same, ask: `Anything else for ${shortName(next[same.ref.list][same.ref.index])}? One more task, tool or number would round it out.` } : left.find((g) => g.id !== gap?.id);

  const thanks = edits.length ? `Thanks! I updated your resume: ${edits[0].charAt(0).toLowerCase()}${edits[0].slice(1)}.` : "Got it.";
  if (!upcoming) {
    return { resume: next, edits, text: `${thanks} Your resume covers everything on my checklist now. Tap Finish when you're ready, or tell me about anything else you've done.` };
  }
  return { resume: next, edits, text: `${thanks}\n\n${upcoming.ask}`, focus: upcoming.id };
}
