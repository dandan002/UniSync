import { describe, expect, it } from "vitest";
import { currentResume, draftToResume, EMPTY_DRAFT, filledCount, normalizeResume, sectionsOf, skillsForCourse } from "@/lib/resume";

describe("resume building", () => {
  it("suggests starter skills from the course", () => {
    expect(skillsForCourse("BS Information Technology")).toEqual(["SQL", "Networking", "Web dev"]);
    expect(skillsForCourse("BS Accountancy")).toContain("Bookkeeping");
    expect(skillsForCourse("AB Philosophy")).toEqual(["Teamwork", "Communication"]);
    expect(skillsForCourse("IT")).toEqual([]);
  });

  it("turns the basic answers into a resume with placeholders for Sync", () => {
    const d = {
      ...EMPTY_DRAFT,
      course: "BS Information Technology",
      name: " Bea Santos ",
      capstoneItem: { title: "Canteen inventory system", line: "Designed the database." },
      capstoneSkills: ["Database design", "sql"],
      experiences: ["Club officer", "Family business"] as typeof EMPTY_DRAFT.experiences,
      places: ["Pasig"],
      minAllowance: 3000,
    };
    const r = draftToResume(d, { school: "Bayview State University" });
    expect(r.name).toBe("Bea Santos");
    expect(r.school).toBe("Bayview State University");
    expect(r.projects[0]).toMatchObject({ title: "Canteen inventory system", kind: "capstone" });
    expect(r.experience.map((e) => e.title)).toEqual(["Officer, student organization", "Family store"]);
    expect(r.experience[0]?.section).toBe("Leadership");
    // Skills are de-duplicated case-insensitively.
    expect(r.skills.filter((s) => s.toLowerCase() === "sql")).toHaveLength(1);
    expect(r.skills).toContain("Inventory");
    expect(r.prefs).toEqual({ places: ["Pasig"], minAllowance: 3000 });
    expect(sectionsOf(r).map((s) => s.heading)).toEqual(["Projects", "Leadership", "Work"]);

    // After the chat, Sync's version replaces the content; name and preferences stay the student's.
    const refined = {
      projects: r.projects,
      experience: [{ title: "Treasurer, IT Society", line: "Collected dues from 120 members.", bullets: ["Kept the ledger in Google Sheets."], section: "Leadership" as const }],
      skills: ["SQL", "Google Sheets"],
      city: "Pasig",
      availability: "April to July",
    };
    const after = currentResume({ ...d, coach: { resume: refined, messages: [], strikes: 0, sig: "", done: true, quickReplies: [] } });
    expect(after.name).toBe("Bea Santos");
    expect(after.experience).toEqual(refined.experience);
    expect(after.city).toBe("Pasig");
    expect(after.availability).toBe("April to July");
    expect(after.prefs).toEqual({ places: ["Pasig"], minAllowance: 3000 });
  });

  it("counts filled answers", () => {
    expect(filledCount({ course: "BS IT", language: "English" })).toBe(2);
  });

  it("normalizes untrusted stored JSON", () => {
    const r = normalizeResume(
      { name: 5, projects: [{ title: "X" }, null, "bad", { title: "Y", line: "Built it.", bullets: ["Used Figma.", 4, ""] }], skills: ["SQL", 3], prefs: { places: "Pasig" } },
      "Fallback",
    );
    expect(r.name).toBe("Fallback");
    expect(r.projects).toEqual([
      { title: "X", line: "" },
      { title: "Y", line: "Built it.", bullets: ["Used Figma."] },
    ]);
    expect(r.skills).toEqual(["SQL"]);
    expect(r.prefs).toEqual({ places: [], minAllowance: 0 });
  });
});
