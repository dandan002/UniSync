import { describe, expect, it } from "vitest";
import { draftToResume, EMPTY_DRAFT, emptyResume } from "@/lib/resume";
import { reviewResume } from "@/lib/review";
import type { ResumeData } from "@/lib/types";

const onboarded = () =>
  draftToResume({
    ...EMPTY_DRAFT,
    course: "BS Information Technology",
    name: "Nina Garcia",
    capstoneItem: { title: "QR attendance app", line: "Designed the UI in Figma for a QR attendance app." },
    capstoneSkills: ["Figma"],
    experiences: ["Family business"],
    places: ["Taguig"],
  });

const strong: ResumeData = {
  ...emptyResume("Bea Santos", "BS Information Technology"),
  city: "Laguna",
  availability: "April to July",
  summary: "IT student looking for a data internship.",
  projects: [{ title: "Canteen inventory system", line: "Built a stock tracker.", when: "2026", bullets: ["Designed the SQL database for a four-person team.", "Cut stock counts from two hours to 20 minutes."] }],
  experience: [{ section: "Leadership", title: "Treasurer, IT Society", line: "Ran the club's finances.", when: "2025-26", bullets: ["Collected dues from 120 members.", "Wrote monthly reports in Google Sheets."] }],
  skills: ["SQL", "Python", "Figma", "Google Sheets", "Budgeting"],
};

describe("resume review", () => {
  it("puts placeholders first and asks about them in plain words", () => {
    const { gaps, score } = reviewResume(onboarded());
    expect(gaps.map((g) => g.id)).toEqual(["placeholder:experience:0", "detail:projects:0", "summary", "details", "dates:experience:0"]);
    expect(gaps[0].ask).toMatch(/family store/i);
    expect(gaps[0].ask).toMatch(/customers a day/);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(70);
  });

  it("asks for a project when there are none", () => {
    expect(reviewResume(emptyResume("Ana", "BS Psychology")).gaps[0].id).toBe("no-project");
  });

  it("asks for numbers once an entry has bullets", () => {
    const r = structuredClone(strong);
    r.projects[0].bullets = ["Designed the database schema.", "Built the stock screens in PHP."];
    r.projects[0].line = "Built a stock tracker.";
    const { gaps } = reviewResume(r);
    expect(gaps.map((g) => g.id)).toEqual(["result:projects:0"]);
  });

  it("scores a complete resume 100 with nothing left", () => {
    expect(reviewResume(strong)).toEqual({ gaps: [], score: 100 });
  });

  it("raises the score as gaps close", () => {
    const before = reviewResume(onboarded()).score;
    const r = onboarded();
    r.summary = "IT student who designs clean, simple apps.";
    expect(reviewResume(r).score).toBeGreaterThan(before);
  });
});
