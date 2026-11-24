import { describe, expect, it } from "vitest";
import { draftToResume, EMPTY_DRAFT, filledCount, followupTopic, normalizeResume, sectionsOf, skillsForCourse } from "@/lib/resume";

describe("resume building", () => {
  it("suggests starter skills from the course", () => {
    expect(skillsForCourse("BS Information Technology")).toEqual(["SQL", "Networking", "Web dev"]);
    expect(skillsForCourse("BS Accountancy")).toContain("Bookkeeping");
    expect(skillsForCourse("AB Philosophy")).toEqual(["Teamwork", "Communication"]);
    expect(skillsForCourse("IT")).toEqual([]);
  });

  it("asks a follow-up about the first real experience", () => {
    expect(followupTopic({ experiences: ["None yet"] })).toBeNull();
    expect(followupTopic({ experiences: ["Family business", "Club officer"] })).toBe("Family business");
  });

  it("turns a finished draft into a resume", () => {
    const r = draftToResume(
      {
        ...EMPTY_DRAFT,
        course: "BS Information Technology",
        name: " Bea Santos ",
        capstoneItem: { title: "Canteen inventory system", line: "Designed the database." },
        capstoneSkills: ["Database design"],
        experiences: ["Club officer", "Family business"],
        followupItem: { title: "Treasurer, IT Society", line: "Collected dues for 120 members." },
        followupSkills: ["Budgeting", "SQL"],
        places: ["Pasig"],
        minAllowance: 3000,
      },
      { school: "Bayview State University" },
    );
    expect(r.name).toBe("Bea Santos");
    expect(r.school).toBe("Bayview State University");
    expect(r.projects[0]?.title).toBe("Canteen inventory system");
    expect(r.experience.map((e) => e.title)).toEqual(["Treasurer, IT Society", "Family store"]);
    expect(r.experience[0]?.section).toBe("Leadership");
    // Skills are de-duplicated case-insensitively.
    expect(r.skills.filter((s) => s.toLowerCase() === "sql")).toHaveLength(1);
    expect(r.skills).toContain("Inventory");
    expect(r.prefs).toEqual({ places: ["Pasig"], minAllowance: 3000 });
    expect(sectionsOf(r).map((s) => s.heading)).toEqual(["Projects", "Leadership", "Work"]);
  });

  it("counts filled answers", () => {
    expect(filledCount({ course: "BS IT", language: "English" })).toBe(2);
  });

  it("normalizes untrusted stored JSON", () => {
    const r = normalizeResume({ name: 5, projects: [{ title: "X" }, null, "bad"], skills: ["SQL", 3], prefs: { places: "Pasig" } }, "Fallback");
    expect(r.name).toBe("Fallback");
    expect(r.projects).toEqual([{ title: "X", line: "" }]);
    expect(r.skills).toEqual(["SQL"]);
    expect(r.prefs).toEqual({ places: [], minAllowance: 0 });
  });
});

describe("resume details from Sync", () => {
  it("keeps bullets and a summary, dropping junk", () => {
    const r = normalizeResume({ name: "Bea", summary: "  ", projects: [{ title: "App", line: "Built it.", bullets: ["Used SQL.", 4, "", "Shipped it."] }] });
    expect(r.summary).toBeUndefined();
    expect(r.projects[0].bullets).toEqual(["Used SQL.", "Shipped it."]);
    expect(normalizeResume({ name: "Bea", summary: "IT student." }).summary).toBe("IT student.");
    expect(normalizeResume({ name: "Bea", projects: [{ title: "App", line: "x", bullets: [] }] }).projects[0]).toEqual({ title: "App", line: "x" });
  });
});
