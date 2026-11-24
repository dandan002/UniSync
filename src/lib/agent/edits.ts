import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ungrounded, ungroundedError } from "@/lib/agent/grounding";
import { shortName } from "@/lib/review";
import type { ResumeData, ResumeItem } from "@/lib/types";

// The only things Sync can do: edit the student's own resume content. Every
// tool input is validated, cleaned and capped here before it touches the
// resume, and the result is validated again before it's saved. Name, email,
// phone and job preferences are out of reach.

export const LIMITS = {
  title: 80,
  line: 220,
  bullet: 180,
  bullets: 4,
  when: 30,
  summary: 320,
  skill: 32,
  skills: 14,
  city: 60,
  availability: 60,
  projects: 6,
  experience: 10,
} as const;

// Control, zero-width and bidi characters, which have no place on a resume.
const INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g;

export function cleanText(s: string, max: number): string {
  const t = s
    .replace(INVISIBLE, " ")
    .replace(/\*\*|__|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`;
}

// Resume voice: no first person. Caught here so Sync rewrites instead of saving it.
// "I" only as a pronoun ("I built", "I'm"), not a numeral ("Calculus I and II").
// "US" the country is fine; "us" the pronoun isn't.
const FIRST_PERSON = [/\bI(?:'m|'ve|'d|'ll|\s+(?!and\b|or\b)[a-z])/, /\b(?:[Mm]y|[Mm]e|[Mm]yself|[Ww]e|[Oo]ur|[Oo]urs|us)\b/];
export function firstPerson(...texts: Array<string | undefined>): boolean {
  return texts.some((t) => !!t && FIRST_PERSON.some((re) => re.test(t)));
}
const FIRST_PERSON_ERROR = 'Resume text can\'t use "I", "my", "we" or "our". Start with the verb ("Served about 40 customers a day.") and send it again.';
const FIRST_PERSON_SUMMARY = 'The summary can\'t use "I", "my", "we" or "our". Write it like "IT student seeking a QA internship, with..." and send it again.';

function cleanBullet(s: string): string {
  return cleanText(s.replace(/^\s*(?:[-•*·▪●]|\d+[.)])\s*/, ""), LIMITS.bullet);
}

// Inputs may run a little long; anything far past the limit is rejected
// rather than clipped.
const text = (max: number) => z.string().max(max * 2);
const List = z.enum(["projects", "experience"]);
const Group = z.enum(["Leadership", "Work", "Volunteer", "Activities"]);
const Bullets = z.array(text(LIMITS.bullet)).max(LIMITS.bullets + 2);

export const EditEntry = z
  .object({
    list: List,
    index: z.number().int().min(0),
    title: text(LIMITS.title).optional(),
    line: text(LIMITS.line).optional(),
    when: text(LIMITS.when).optional(),
    bullets: Bullets.optional(),
    group: Group.optional(),
  })
  .strict();

export const AddEntry = z
  .object({
    list: List,
    title: text(LIMITS.title),
    line: text(LIMITS.line),
    when: text(LIMITS.when).optional(),
    bullets: Bullets.optional(),
    group: Group.optional(),
  })
  .strict();

export const RemoveEntry = z.object({ list: List, index: z.number().int().min(0) }).strict();

export const SetSkills = z.object({ skills: z.array(text(LIMITS.skill)).min(1).max(LIMITS.skills + 6) }).strict();

export const SetProfile = z
  .object({
    summary: text(LIMITS.summary).optional(),
    city: text(LIMITS.city).optional(),
    availability: text(LIMITS.availability).optional(),
  })
  .strict();

const listProp = { type: "string", enum: ["projects", "experience"], description: "Which list the entry is in, as shown in <resume>." };
const groupProp = {
  type: "string",
  enum: ["Leadership", "Work", "Volunteer", "Activities"],
  description: "Experience entries only: the resume heading it appears under.",
};
const bulletsProp = {
  type: "array",
  items: { type: "string" },
  maxItems: LIMITS.bullets,
  description: `Two to ${LIMITS.bullets} bullets, each one sentence under ${LIMITS.bullet} characters, starting with an action verb. Replaces all of the entry's bullets, so include any you want to keep.`,
};

// Sent with every request. Order and wording stay fixed so the prompt cache holds.
export const TOOLS: Anthropic.Tool[] = [
  {
    name: "edit_entry",
    description:
      "Change an existing project or experience entry. Point to it with list and index exactly as numbered in <resume> (experience[1] is list \"experience\", index 1). Send only the fields you're changing. Use only facts the student gave.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        list: listProp,
        index: { type: "integer", minimum: 0 },
        title: { type: "string", description: `"Role, Organization" for experience, or the name of what was built for a project. Under ${LIMITS.title} characters.` },
        line: { type: "string", description: `One sentence that says what this was, under ${LIMITS.line} characters.` },
        when: { type: "string", description: 'Dates as the student gave them, like "2025" or "2024-26" or "2023-present".' },
        bullets: bulletsProp,
        group: groupProp,
      },
      required: ["list", "index"],
      additionalProperties: false,
    },
  },
  {
    name: "add_entry",
    description: "Add a new project or experience entry the student told you about. Only for something not already on the resume.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        list: listProp,
        title: { type: "string", description: `"Role, Organization" for experience, or the name of what was built for a project. Under ${LIMITS.title} characters.` },
        line: { type: "string", description: `One sentence that says what this was, under ${LIMITS.line} characters.` },
        when: { type: "string", description: 'Dates as the student gave them, like "2025" or "2024-26".' },
        bullets: bulletsProp,
        group: groupProp,
      },
      required: ["list", "title", "line"],
      additionalProperties: false,
    },
  },
  {
    name: "remove_entry",
    description: "Remove an entry. Only when the student asks you to drop it, or it duplicates another entry.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: { list: listProp, index: { type: "integer", minimum: 0 } },
      required: ["list", "index"],
      additionalProperties: false,
    },
  },
  {
    name: "set_skills",
    description: `Replace the whole skills list. Keep only skills the student has used or confirmed, most relevant first, at most ${LIMITS.skills}. Each skill is one to three words.`,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: { skills: { type: "array", items: { type: "string" }, minItems: 1, maxItems: LIMITS.skills } },
      required: ["skills"],
      additionalProperties: false,
    },
  },
  {
    name: "set_profile",
    description: "Set the summary at the top of the resume, the student's city or province, or when they can start their internship. Send only the fields you're changing.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: `One or two sentences, no first person, under ${LIMITS.summary} characters: what internship they want and what they bring.` },
        city: { type: "string", description: "City or province, like \"Pasig\" or \"Laguna\"." },
        availability: { type: "string", description: 'When they can start and for how long, like "April to July".' },
      },
      additionalProperties: false,
    },
  },
];

export type EditResult = { ok: true; resume: ResumeData; label: string; result: string } | { ok: false; error: string };

function uniq(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    const k = s.toLowerCase();
    if (!s || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function describe(list: string, index: number, it: ResumeItem): string {
  return `${list}[${index}] now: ${JSON.stringify({ title: it.title, when: it.when ?? "", line: it.line, bullets: it.bullets ?? [], ...(it.section ? { group: it.section } : {}) })}`;
}

function bulletsOf(list: string[] | undefined): string[] | undefined {
  if (!list) return undefined;
  return list.map(cleanBullet).filter(Boolean).slice(0, LIMITS.bullets);
}

// Applies one tool call to the resume. Never throws; errors go back to Sync
// as the tool result so it can correct itself. The keyless fallback files the
// student's own words, so it skips the resume-voice and number checks.
// `known` holds every number the student has said; text with any other
// number is sent back (dates in `when` are exempt).
export function applyEdit(
  resume: ResumeData,
  name: string,
  input: unknown,
  { voice = true, known }: { voice?: boolean; known?: Set<number> } = {},
): EditResult {
  const madeUp = (...texts: Array<string | undefined>) => (known ? ungrounded(texts, known) : []);
  switch (name) {
    case "edit_entry": {
      const p = EditEntry.safeParse(input);
      if (!p.success) return { ok: false, error: `Invalid input: ${p.error.issues[0]?.message ?? "check the fields"}.` };
      const { list, index } = p.data;
      const item = resume[list][index];
      if (!item) return { ok: false, error: `There is no ${list}[${index}]. Check the numbering in <resume>.` };
      if (voice && firstPerson(p.data.line, ...(p.data.bullets ?? []))) return { ok: false, error: FIRST_PERSON_ERROR };
      const bad = madeUp(p.data.title, p.data.line, ...(p.data.bullets ?? []));
      if (bad.length) return { ok: false, error: ungroundedError(bad) };
      const next: ResumeItem = { ...item };
      if (p.data.title !== undefined) next.title = cleanText(p.data.title, LIMITS.title) || item.title;
      if (p.data.line !== undefined) next.line = cleanText(p.data.line, LIMITS.line);
      if (p.data.when !== undefined) next.when = cleanText(p.data.when, LIMITS.when) || undefined;
      if (p.data.bullets !== undefined) next.bullets = bulletsOf(p.data.bullets);
      if (p.data.group && list === "experience") next.section = p.data.group;
      if (!next.bullets?.length) delete next.bullets;
      if (!next.when) delete next.when;
      const items = resume[list].map((it, i) => (i === index ? next : it));
      return { ok: true, resume: { ...resume, [list]: items }, label: `Updated ${shortName(next)}`, result: describe(list, index, next) };
    }
    case "add_entry": {
      const p = AddEntry.safeParse(input);
      if (!p.success) return { ok: false, error: `Invalid input: ${p.error.issues[0]?.message ?? "check the fields"}.` };
      const { list } = p.data;
      if (voice && firstPerson(p.data.line, ...(p.data.bullets ?? []))) return { ok: false, error: FIRST_PERSON_ERROR };
      const bad = madeUp(p.data.title, p.data.line, ...(p.data.bullets ?? []));
      if (bad.length) return { ok: false, error: ungroundedError(bad) };
      if (resume[list].length >= LIMITS[list]) return { ok: false, error: `The resume already has ${LIMITS[list]} ${list} entries. Improve or replace one instead.` };
      const title = cleanText(p.data.title, LIMITS.title);
      if (title.length < 2) return { ok: false, error: "The entry needs a title." };
      const item: ResumeItem = { title, line: cleanText(p.data.line, LIMITS.line) };
      const when = p.data.when ? cleanText(p.data.when, LIMITS.when) : "";
      if (when) item.when = when;
      const bullets = bulletsOf(p.data.bullets);
      if (bullets?.length) item.bullets = bullets;
      if (list === "experience") item.section = p.data.group ?? "Work";
      const items = [...resume[list], item];
      return { ok: true, resume: { ...resume, [list]: items }, label: `Added ${shortName(item)}`, result: describe(list, items.length - 1, item) };
    }
    case "remove_entry": {
      const p = RemoveEntry.safeParse(input);
      if (!p.success) return { ok: false, error: "Invalid input: send list and index." };
      const { list, index } = p.data;
      const item = resume[list][index];
      if (!item) return { ok: false, error: `There is no ${list}[${index}].` };
      const items = resume[list].filter((_, i) => i !== index);
      return {
        ok: true,
        resume: { ...resume, [list]: items },
        label: `Removed ${shortName(item)}`,
        result: `Removed ${list}[${index}]. Entries after it moved up one: ${list} is now ${JSON.stringify(items.map((it, i) => `${list}[${i}] ${it.title}`))}.`,
      };
    }
    case "set_skills": {
      const p = SetSkills.safeParse(input);
      if (!p.success) return { ok: false, error: "Invalid input: send skills as a list of short strings." };
      const skills = uniq(p.data.skills.map((s) => cleanText(s, LIMITS.skill))).slice(0, LIMITS.skills);
      if (!skills.length) return { ok: false, error: "Send at least one skill." };
      return { ok: true, resume: { ...resume, skills }, label: "Updated skills", result: `Skills now: ${skills.join(", ")}` };
    }
    case "set_profile": {
      const p = SetProfile.safeParse(input);
      if (!p.success) return { ok: false, error: "Invalid input: send summary, city or availability." };
      if (voice && firstPerson(p.data.summary)) return { ok: false, error: FIRST_PERSON_SUMMARY };
      const bad = madeUp(p.data.summary, p.data.availability);
      if (bad.length) return { ok: false, error: ungroundedError(bad) };
      const next = { ...resume };
      const changed: string[] = [];
      if (p.data.summary !== undefined) {
        next.summary = cleanText(p.data.summary, LIMITS.summary) || undefined;
        changed.push("summary");
      }
      if (p.data.city !== undefined) {
        next.city = cleanText(p.data.city, LIMITS.city) || undefined;
        changed.push("city");
      }
      if (p.data.availability !== undefined) {
        next.availability = cleanText(p.data.availability, LIMITS.availability) || undefined;
        changed.push("start date");
      }
      if (!changed.length) return { ok: false, error: "Send at least one of summary, city or availability." };
      return {
        ok: true,
        resume: next,
        label: `Updated ${changed.join(" and ")}`,
        result: `Now: ${JSON.stringify({ summary: next.summary ?? "", city: next.city ?? "", availability: next.availability ?? "" })}`,
      };
    }
    default:
      return { ok: false, error: `Unknown tool ${name}.` };
  }
}
