import { describe, expect, it } from "vitest";
import { isMatch, matchJob, programFits, whyRecommend } from "@/lib/match";
import type { Job, ResumeData } from "@/lib/types";

const job = (over: Partial<Job> = {}): Job => ({
  id: "j1",
  company_id: "c1",
  title: "Data intern",
  city: "Pasig",
  mode: "On-site",
  allowance: 6000,
  schedule: "",
  dates: "",
  hours: 600,
  teaser: "",
  about: "",
  duties: [],
  needs: [],
  perks: [],
  programs: ["Information Technology", "Computer Science"],
  skills: ["SQL", "Excel", "Python"],
  openings: 3,
  status: "open",
  created_at: "",
  ...over,
});

const bea: ResumeData = {
  name: "Bea Santos",
  course: "BS Information Technology",
  availability: "April to July",
  projects: [{ title: "Canteen inventory system, capstone", line: "Designed the SQL database for a four-person team." }],
  experience: [{ section: "Leadership", title: "Treasurer, IT Society", line: "Collected dues for 120 members." }],
  skills: ["SQL", "Python", "Google Sheets"],
  prefs: { places: ["Pasig", "Remote"], minAllowance: 3000 },
};

describe("matching", () => {
  it("matches programs by name regardless of the BS prefix", () => {
    expect(programFits(job(), "BS Information Technology")).toBe(true);
    expect(programFits(job(), "BS Psychology")).toBe(false);
    expect(programFits(job({ programs: [] }), "anything")).toBe(true);
  });

  it("scores skills, place and pay", () => {
    const m = matchJob(job(), { resume: bea });
    expect(m.skills).toEqual(["SQL", "Python"]);
    expect(m.near).toBe(true);
    expect(m.payFit).toBe(true);
    expect(isMatch(m)).toBe(true);
  });

  it("drops jobs below the minimum allowance", () => {
    const m = matchJob(job({ allowance: 0 }), { resume: bea });
    expect(m.payFit).toBe(false);
    expect(isMatch(m)).toBe(false);
  });

  it("treats remote jobs as near when the student picked Remote", () => {
    expect(matchJob(job({ mode: "Remote", city: "Cebu" }), { resume: bea }).near).toBe(true);
    expect(matchJob(job({ mode: "Remote", city: "Cebu" }), { resume: { ...bea, prefs: { places: ["Pasig"], minAllowance: 0 } } }).near).toBe(false);
  });

  it("explains a recommendation without personal attributes", () => {
    const why = whyRecommend(job(), bea);
    expect(why).toContain("canteen inventory system");
    expect(why).toContain("Two of your listed skills");
    expect(why).toMatch(/available April to July/);
    expect(why).not.toMatch(/age|gender|photo/i);
  });
});
