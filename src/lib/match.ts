import type { Job, ResumeData } from "@/lib/types";
import { spell } from "@/lib/format";

// Plain, explainable matching. It never looks at age, gender or photos.

export type MatchInput = {
  resume: ResumeData;
  course?: string | null;
  city?: string | null;
};

export type Match = {
  score: number;
  skills: string[];
  programFit: boolean;
  placeFit: boolean;
  payFit: boolean;
  near: boolean;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export function programFits(job: Pick<Job, "programs">, course: string): boolean {
  if (!job.programs.length) return true;
  const c = norm(course).replace(/^bs /, "");
  if (!c) return false;
  return job.programs.some((p) => {
    const q = norm(p);
    return c.includes(q) || q.includes(c);
  });
}

export function placeFits(job: Pick<Job, "city" | "mode">, places: string[], city?: string | null): boolean {
  const want = places.map(norm);
  if (job.mode === "Remote") return want.length === 0 || want.includes("remote");
  if (want.includes(norm(job.city))) return true;
  return !!city && norm(city) === norm(job.city);
}

export function matchJob(job: Job, input: MatchInput): Match {
  const mine = new Set(input.resume.skills.map(norm));
  const skills = job.skills.filter((s) => mine.has(norm(s)));
  const programFit = programFits(job, input.course ?? input.resume.course);
  const near = placeFits(job, input.resume.prefs.places, input.city ?? input.resume.city);
  const placeFit = near || input.resume.prefs.places.length === 0;
  const min = input.resume.prefs.minAllowance;
  const payFit = job.allowance >= min;

  let score = Math.min(skills.length, 3) * 2;
  if (programFit) score += 3;
  if (near) score += 3;
  else if (placeFit) score += 1;
  if (payFit) score += 1;
  else score -= 4;
  return { score, skills, programFit, placeFit, payFit, near };
}

export function isMatch(m: Match): boolean {
  return m.payFit && (m.programFit || m.skills.length > 0) && m.placeFit;
}

// Employer side: why Sync suggests this student, in one or two sentences.
export function whyRecommend(job: Job, resume: ResumeData, city?: string | null): string {
  const m = matchJob(job, { resume, city });
  const bits: string[] = [];
  const project = resume.projects[0];
  if (project) bits.push(`Built ${project.title.replace(/,?\s*capstone$/i, "").toLowerCase()}: ${lowerFirst(project.line)}`);
  const lead = resume.experience.find((e) => e.section === "Leadership") ?? resume.experience[0];
  if (lead) bits.push(`${lead.title}: ${lowerFirst(lead.line)}`);
  const fit: string[] = [];
  if (m.skills.length) fit.push(`${spell(m.skills.length, true)} of your listed skills (${m.skills.slice(0, 3).join(", ")})`);
  if (m.near) fit.push(job.mode === "Remote" ? "open to remote work" : `wants to intern in ${job.city}`);
  if (resume.availability) fit.push(`available ${resume.availability}`);
  const fitLine = fit.length ? `${capFirst(fit.join(", "))}.` : "";
  return [bits.slice(0, 2).map((b) => endDot(b)).join(" "), fitLine].filter(Boolean).join(" ") || "Their resume matches the role's program and skills.";
}

function lowerFirst(s: string) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
function capFirst(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function endDot(s: string) {
  return /[.!?]$/.test(s) ? s : `${s}.`;
}
