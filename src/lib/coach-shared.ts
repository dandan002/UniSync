import { EXPERIENCE_DEFAULTS, EXPERIENCES, type Draft, type Experience } from "@/lib/resume";
import type { ResumeItem } from "@/lib/types";

// Sync's resume chat, the parts both the browser and the server use.

export const COACH_LIMITS = {
  // Characters in one student message.
  message: 600,
  // Student messages in one chat. Sync wraps up before this.
  turns: 20,
  // Off-topic or rule-breaking messages before the chat closes.
  strikes: 3,
  projects: 6,
  experience: 10,
  bullets: 3,
  skills: 12,
} as const;

// The parts of the resume Sync may change. Name, course and internship
// preferences come from the student's own answers and stay theirs.
export type CoachResume = {
  projects: ResumeItem[];
  experience: ResumeItem[];
  skills: string[];
  city?: string;
  availability?: string;
};

export type CoachChange = { kind: "added" | "updated" | "removed"; what: string; detail?: string };

export type CoachMessage = {
  role: "sync" | "student";
  text: string;
  // What Sync's question was about, e.g. "experience:1". Signed with the transcript.
  focus?: string;
  // What Sync changed this turn. Display only.
  changes?: CoachChange[];
};

export type CoachState = {
  resume: CoachResume;
  messages: CoachMessage[];
  strikes: number;
  // Server signature over messages and strikes, so the transcript can't be forged.
  sig: string;
  done: boolean;
  quickReplies: string[];
};

export type CoachMode = "onboarding" | "edit";

export type CoachReply = {
  appended: CoachMessage[];
  resume: CoachResume;
  quickReplies: string[];
  done: boolean;
  strikes: number;
  sig: string;
  source: "claude" | "rules";
};

export function emptyCoach(resume: CoachResume): CoachState {
  return { resume, messages: [], strikes: 0, sig: "", done: false, quickReplies: [] };
}

export function studentTurns(messages: CoachMessage[]): number {
  return messages.filter((m) => m.role === "student").length;
}

export function coachLocked(state: Pick<CoachState, "messages" | "strikes">): "turns" | "strikes" | null {
  if (state.strikes >= COACH_LIMITS.strikes) return "strikes";
  if (studentTurns(state.messages) >= COACH_LIMITS.turns) return "turns";
  return null;
}

type RealExperience = Exclude<Experience, "None yet">;

function isExperience(kind: string | undefined): kind is RealExperience {
  return !!kind && kind !== "None yet" && (EXPERIENCES as readonly string[]).includes(kind);
}

// An entry still carrying the generic line onboarding wrote before the
// student said what they actually did.
export function isPlaceholder(item: ResumeItem): boolean {
  return isExperience(item.kind) && item.line === EXPERIENCE_DEFAULTS[item.kind].item.line;
}

export type WeakSpot = { focus: string; note: string; ask: string };

// The resume's weakest parts, most important first. Sync's notes list them
// for Claude, and the rule-based fallback asks about them in order.
export function weakSpots(r: CoachResume): WeakSpot[] {
  const out: WeakSpot[] = [];
  r.experience.forEach((e, i) => {
    if (isPlaceholder(e) && isExperience(e.kind)) {
      out.push({ focus: `experience:${i}`, note: `experience ${i} is a placeholder (${e.kind})`, ask: EXPERIENCE_DEFAULTS[e.kind].ask });
    }
  });
  if (r.projects.length === 0) {
    out.push({ focus: "project:new", note: "no projects yet", ask: "What did you build for your capstone or a school project?" });
  }
  r.projects.forEach((p, i) => {
    if (!p.bullets?.length) {
      out.push({
        focus: `project:${i}`,
        note: `project ${i} has no details yet`,
        ask: `Tell me more about "${p.title}": what was your part, what tools did you use, and how many people used it?`,
      });
    }
  });
  r.experience.forEach((e, i) => {
    if (!isPlaceholder(e) && !e.bullets?.length) {
      out.push({
        focus: `experience:${i}`,
        note: `experience ${i} has no details yet`,
        ask: `What else did you do as "${e.title}"? Numbers help: how many people, how often, how much.`,
      });
    }
  });
  if (r.skills.length < 5) {
    out.push({ focus: "skills", note: "few specific skills", ask: "Which tools or apps can you use well? For example Excel, Canva, Figma or a programming language." });
  }
  if (!r.city?.trim()) out.push({ focus: "city", note: "city missing", ask: "Which city or province do you live in?" });
  if (!r.availability?.trim()) {
    out.push({ focus: "availability", note: "availability missing", ask: "When can you start your OJT, and how many hours do you need to finish?" });
  }
  return out;
}

function same(a: ResumeItem, b: ResumeItem): boolean {
  return a.title === b.title && a.line === b.line;
}

// The student went back and changed a basic answer after the chat started.
// Keep Sync's work and line the resume up with the new answers: add or drop
// placeholder entries for the experiences picked, and swap in a new capstone
// line unless Sync has already filled it in.
export function reconcileCoach(r: CoachResume, d: Pick<Draft, "experiences" | "capstoneItem">): CoachResume {
  const picked = new Set<string>(d.experiences.filter((e) => e !== "None yet"));
  const experience = r.experience.filter((e) => !(isPlaceholder(e) && e.kind && !picked.has(e.kind)));
  const have = new Set(experience.map((e) => e.kind).filter(Boolean));
  for (const e of d.experiences) {
    if (e === "None yet" || have.has(e)) continue;
    experience.push({ ...EXPERIENCE_DEFAULTS[e].item });
  }

  let projects = r.projects;
  const cap = d.capstoneItem;
  const at = projects.findIndex((p) => p.kind === "capstone");
  if (cap) {
    const fresh: ResumeItem = { ...cap, kind: "capstone", when: cap.when ?? String(new Date().getFullYear()) };
    if (at < 0) projects = [fresh, ...projects];
    else if (!projects[at]!.bullets?.length && !same(projects[at]!, fresh)) projects = projects.map((p, i) => (i === at ? fresh : p));
  }

  const changed =
    projects !== r.projects || experience.length !== r.experience.length || experience.some((e, i) => e !== r.experience[i]);
  return changed ? { ...r, projects, experience } : r;
}
