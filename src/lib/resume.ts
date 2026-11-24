import type { CoachState } from "@/lib/coach-shared";
import type { ResumeData, ResumeItem } from "@/lib/types";

// Starter skills by course, shown the moment a student names their course.
const COURSE_SKILLS: Array<[RegExp, string[]]> = [
  [/information tech|\bit\b|bsit/i, ["SQL", "Networking", "Web dev"]],
  [/computer science|bscs/i, ["Python", "Algorithms", "Git"]],
  [/information systems|bsis/i, ["SQL", "Systems analysis", "Excel"]],
  [/business|bsba|marketing|management/i, ["Excel", "Marketing", "Sales"]],
  [/accountancy|accounting|bsa\b/i, ["Bookkeeping", "Excel", "Tax basics"]],
  [/psychology/i, ["Research", "Interviewing", "Report writing"]],
  [/engineering/i, ["AutoCAD", "Excel", "Problem solving"]],
  [/nursing|health|medical/i, ["Patient care", "Records", "First aid"]],
  [/education|teaching/i, ["Lesson planning", "Public speaking", "Classroom management"]],
  [/statistics|math/i, ["Statistics", "Excel", "R"]],
  [/communication|journalism|multimedia/i, ["Writing", "Social media", "Canva"]],
  [/hospitality|tourism|hrm/i, ["Customer service", "Events", "Food safety"]],
];

export const COMMON_COURSES = [
  "BS Information Technology",
  "BS Business Admin",
  "BS Accountancy",
  "BS Psychology",
];

export function skillsForCourse(course: string): string[] {
  const c = course.trim();
  if (c.length < 3) return [];
  for (const [re, skills] of COURSE_SKILLS) if (re.test(c)) return skills;
  return ["Teamwork", "Communication"];
}

export const EXPERIENCES = [
  "Club officer",
  "Part-time job",
  "Family business",
  "Freelance",
  "Volunteer",
  "Varsity athlete",
  "None yet",
] as const;
export type Experience = (typeof EXPERIENCES)[number];

// What each answer adds before Sync hears the details. These lines are
// placeholders: Sync asks about each one in the chat and replaces it.
export const EXPERIENCE_DEFAULTS: Record<Exclude<Experience, "None yet">, { item: ResumeItem; skills: string[]; ask: string }> = {
  "Club officer": {
    item: { section: "Leadership", title: "Officer, student organization", line: "Helped run meetings and events for members.", kind: "Club officer" },
    skills: ["Leadership"],
    ask: "What did you do as a club officer?",
  },
  "Part-time job": {
    item: { section: "Work", title: "Part-time job", line: "Worked regular shifts while keeping up with classes.", kind: "Part-time job" },
    skills: ["Time management"],
    ask: "What did you do at your part-time job?",
  },
  "Family business": {
    item: { section: "Work", title: "Family store", line: "Handles restocking, cash counts and supplier orders.", kind: "Family business" },
    skills: ["Inventory"],
    ask: "What do you do in the family business?",
  },
  Freelance: {
    item: { section: "Work", title: "Freelance projects", line: "Delivered projects for paying clients.", kind: "Freelance" },
    skills: ["Client work"],
    ask: "What freelance work have you done?",
  },
  Volunteer: {
    item: { section: "Volunteer", title: "Volunteer", line: "Gave time to community programs.", kind: "Volunteer" },
    skills: ["Community work"],
    ask: "Where did you volunteer, and what did you do?",
  },
  "Varsity athlete": {
    item: { section: "Activities", title: "Varsity athlete", line: "Trained and competed while keeping up with classes.", kind: "Varsity athlete" },
    skills: ["Teamwork", "Discipline"],
    ask: "What sport do you play, and for which team?",
  },
};

export const PLACES = ["Pasig", "Makati", "Taguig", "Calamba", "Santa Rosa", "Remote"];
export const ALLOWANCES: Array<{ label: string; value: number }> = [
  { label: "Any", value: 0 },
  { label: "₱3,000+", value: 3000 },
  { label: "₱5,000+", value: 5000 },
];
export const LANGUAGES = ["English", "Filipino", "Taglish"] as const;

// Everything onboarding collects. Lives in localStorage until the student
// saves, so nobody needs an account to start. The basic answers seed the
// resume; once the student reaches the chat, Sync's edits live in `coach`.
export type Draft = {
  step: number;
  last: number;
  course: string;
  name: string;
  language: (typeof LANGUAGES)[number];
  capstone: string;
  capstoneItem: ResumeItem | null;
  capstoneSkills: string[];
  experiences: Experience[];
  places: string[];
  minAllowance: number;
  coach: CoachState | null;
  updatedAt: number;
};

export const EMPTY_DRAFT: Draft = {
  step: 1,
  last: 1,
  course: "",
  name: "",
  language: "Taglish",
  capstone: "",
  capstoneItem: null,
  capstoneSkills: [],
  experiences: [],
  places: [],
  minAllowance: 0,
  coach: null,
  updatedAt: 0,
};

function uniq(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of list) {
    const k = s.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(s.trim());
  }
  return out;
}

export function draftToResume(d: Draft, extra?: { school?: string; email?: string; phone?: string; city?: string }): ResumeData {
  const experience: ResumeItem[] = [];
  const skills = [...skillsForCourse(d.course), ...d.capstoneSkills];
  for (const e of d.experiences) {
    if (e === "None yet") continue;
    const def = EXPERIENCE_DEFAULTS[e];
    experience.push({ ...def.item });
    skills.push(...def.skills);
  }
  return {
    name: d.name.trim(),
    course: d.course.trim(),
    school: extra?.school,
    email: extra?.email,
    phone: extra?.phone,
    city: extra?.city,
    language: d.language,
    projects: d.capstoneItem ? [{ ...d.capstoneItem, kind: "capstone", when: d.capstoneItem.when ?? String(new Date().getFullYear()) }] : [],
    experience,
    skills: uniq(skills).slice(0, 10),
    prefs: { places: d.places, minAllowance: d.minAllowance },
  };
}

// The resume as it stands: the basic answers, with Sync's refinements on top
// once the chat has started.
export function currentResume(d: Draft, extra?: { school?: string; email?: string; phone?: string; city?: string }): ResumeData {
  const base = draftToResume(d, extra);
  if (!d.coach) return base;
  const c = d.coach.resume;
  return {
    ...base,
    city: c.city || base.city,
    availability: c.availability || base.availability,
    projects: c.projects,
    experience: c.experience,
    skills: c.skills,
  };
}

// "2 of 6 filled" for the basic answers.
export function filledCount(d: Partial<Draft>): number {
  let n = 0;
  if ((d.course ?? "").trim().length > 2) n++;
  if ((d.name ?? "").trim().length > 1) n++;
  if (d.language) n++;
  if (d.capstoneItem) n++;
  if ((d.experiences ?? []).length) n++;
  if ((d.places ?? []).length) n++;
  return n;
}

export function emptyResume(name = "", course = ""): ResumeData {
  return { name, course, projects: [], experience: [], skills: [], prefs: { places: [], minAllowance: 0 } };
}

// Defensive parse of stored JSON.
export function normalizeResume(raw: unknown, fallbackName = ""): ResumeData {
  const r = (raw ?? {}) as Partial<ResumeData>;
  const items = (v: unknown): ResumeItem[] =>
    Array.isArray(v)
      ? v
          .filter((x) => x && typeof x === "object")
          .map((x) => x as ResumeItem)
          .filter((x) => typeof x.title === "string")
          .map((x) => {
            const bullets = Array.isArray(x.bullets) ? x.bullets.filter((b): b is string => typeof b === "string" && b.trim().length > 0).slice(0, 4) : [];
            const { bullets: _drop, ...rest } = x;
            void _drop;
            return { ...rest, line: typeof x.line === "string" ? x.line : "", ...(bullets.length ? { bullets } : {}) };
          })
      : [];
  return {
    name: typeof r.name === "string" && r.name ? r.name : fallbackName,
    course: typeof r.course === "string" ? r.course : "",
    school: typeof r.school === "string" ? r.school : undefined,
    email: typeof r.email === "string" ? r.email : undefined,
    phone: typeof r.phone === "string" ? r.phone : undefined,
    city: typeof r.city === "string" ? r.city : undefined,
    language: r.language,
    availability: typeof r.availability === "string" ? r.availability : undefined,
    projects: items(r.projects),
    experience: items(r.experience),
    skills: Array.isArray(r.skills) ? r.skills.filter((s): s is string => typeof s === "string") : [],
    prefs: {
      places: Array.isArray(r.prefs?.places) ? r.prefs!.places.filter((s): s is string => typeof s === "string") : [],
      minAllowance: typeof r.prefs?.minAllowance === "number" ? r.prefs!.minAllowance : 0,
    },
  };
}

export function sectionsOf(data: ResumeData): Array<{ heading: string; items: ResumeItem[] }> {
  const groups: Array<{ heading: string; items: ResumeItem[] }> = [];
  if (data.projects.length) groups.push({ heading: "Projects", items: data.projects });
  for (const section of ["Leadership", "Work", "Volunteer", "Activities"] as const) {
    const items = data.experience.filter((e) => (e.section ?? "Work") === section);
    if (items.length) groups.push({ heading: section, items });
  }
  return groups;
}
