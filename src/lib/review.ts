import { isPlaceholder, type Experience } from "@/lib/resume";
import type { ResumeData, ResumeItem } from "@/lib/types";

// Finds the weak spots in a resume, most important first, and scores it.
// Sync works through these gaps; the student sees them as a checklist.

export type ListKey = "projects" | "experience";
export type GapKind = "no-project" | "placeholder" | "detail" | "result" | "skills" | "summary" | "details" | "dates";

export type Gap = {
  id: string;
  kind: GapKind;
  ref?: { list: ListKey; index: number };
  // Short checklist text for the student.
  label: string;
  // What's missing, for Sync.
  note: string;
  // A question to ask about it.
  ask: string;
};

export type Review = { gaps: Gap[]; score: number };

const ORDER: GapKind[] = ["no-project", "placeholder", "detail", "result", "skills", "summary", "details", "dates"];

// What a strong answer covers, by onboarding experience.
const HINTS: Record<Exclude<Experience, "None yet">, string> = {
  "Club officer": "Which org, what position, and what did you run or manage? Numbers help: members, events, budget.",
  "Part-time job": "Where did you work, as what, and what did you handle each shift? Numbers help: customers, hours, sales.",
  "Family business": "What kind of business is it, and what do you handle there? Numbers help: customers a day, orders, sales.",
  Freelance: "What kind of work, for which clients, and what did you deliver? Numbers help: clients, projects, ratings.",
  Volunteer: "Which group, what did you do, and for whom? Numbers help: people served, events, hours.",
  "Varsity athlete": "Which sport and team, and any titles or leadership roles? Numbers help: years, tournaments, wins.",
};

const NUMBER = /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|dozen|hundreds?|thousands?)\b/i;

export function hasNumber(item: ResumeItem): boolean {
  return [item.line, ...(item.bullets ?? [])].some((t) => NUMBER.test(t));
}

export function shortName(item: ResumeItem): string {
  const t = item.title.trim() || "this entry";
  return t.length > 42 ? `${t.slice(0, 40).trimEnd()}…` : t;
}

export function reviewResume(data: ResumeData): Review {
  const gaps: Gap[] = [];
  let total = 0;
  let got = 0;
  const check = (weight: number, ok: boolean) => {
    total += weight;
    if (ok) got += weight;
    return ok;
  };

  if (!check(20, data.projects.length > 0)) {
    gaps.push({
      id: "no-project",
      kind: "no-project",
      label: "Add a project",
      note: "No projects yet. Ask for a capstone, class project or personal project.",
      ask: "What's one project you've built: your capstone, a class project or something on your own? What did it do, and what was your part?",
    });
  }

  for (const list of ["projects", "experience"] as const) {
    data[list].forEach((item, index) => {
      const ref = { list, index };
      const name = shortName(item);
      const generic = !check(15, !isPlaceholder(item));
      const thin = !check(10, (item.bullets ?? []).length >= 2);
      const vague = !check(6, hasNumber(item));
      const undated = !check(3, !!item.when?.trim());

      if (generic) {
        const hint = item.kind && item.kind in HINTS ? HINTS[item.kind as keyof typeof HINTS] : "What did you actually do there, and roughly how much or how often?";
        gaps.push({
          id: `placeholder:${list}:${index}`,
          kind: "placeholder",
          ref,
          label: `${name} is still generic`,
          note: "Still the stock text from onboarding. Nothing here is the student's own detail yet.",
          ask: `Tell me about your ${name.toLowerCase()} entry. ${hint}`,
        });
      } else if (thin) {
        gaps.push({
          id: `detail:${list}:${index}`,
          kind: "detail",
          ref,
          label: `Add specifics to ${name}`,
          note: `Only ${(item.bullets ?? []).length || "no"} bullet${(item.bullets ?? []).length === 1 ? "" : "s"}. Needs two to four bullets with tools, scope and results.`,
          ask:
            list === "projects"
              ? `Let's add specifics to ${name}. What tools or tech did you use, what exactly was your part, and who used it?`
              : `Let's add specifics to ${name}. What were your main tasks, and can you put a number on any of them (people, pesos, hours, items)?`,
        });
      } else if (vague) {
        gaps.push({
          id: `result:${list}:${index}`,
          kind: "result",
          ref,
          label: `Add a number to ${name}`,
          note: "No numbers anywhere. Ask for scale or results: users, members, customers, pesos, hours.",
          ask: `Can you put a number on ${name}? For example how many users, members, customers, pesos or hours. A rough estimate is fine.`,
        });
      }
      if (undated) {
        gaps.push({
          id: `dates:${list}:${index}`,
          kind: "dates",
          ref,
          label: `Add dates to ${name}`,
          note: "No dates.",
          ask: `When did you do ${name}? A year or range like 2025 or 2024-26 is enough.`,
        });
      }
    });
  }

  if (!check(10, data.skills.length >= 5)) {
    gaps.push({
      id: "skills",
      kind: "skills",
      label: "Confirm your skills",
      note: `Only ${data.skills.length} skill${data.skills.length === 1 ? "" : "s"}, and the course starter skills may be guesses. Confirm what they've used.`,
      ask: "Which tools and skills have you actually used: software, programming languages, equipment or methods? I'll keep only the real ones.",
    });
  }

  if (!check(10, !!data.summary?.trim())) {
    gaps.push({
      id: "summary",
      kind: "summary",
      label: "Write a summary",
      note: "No summary line at the top.",
      ask: "In a sentence or two: what kind of internship do you want, and what are you good at?",
    });
  }

  const noCity = !data.city?.trim();
  const noDates = !data.availability?.trim();
  if (!check(6, !noCity && !noDates)) {
    gaps.push({
      id: "details",
      kind: "details",
      label: noCity && noDates ? "Add your city and start date" : noCity ? "Add your city" : "Add when you can start",
      note: [noCity ? "No city." : "", noDates ? "No availability (when they can start and for how long)." : ""].filter(Boolean).join(" "),
      ask:
        noCity && noDates
          ? "When can you start your OJT, and for how long? And which city or province do you live in?"
          : noCity
            ? "Which city or province do you live in?"
            : "When can you start your OJT, and for how long? Something like April to July works.",
    });
  }

  gaps.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  return { gaps, score: total ? Math.round((got / total) * 100) : 0 };
}
