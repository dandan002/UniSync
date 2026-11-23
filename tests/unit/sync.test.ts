import { describe, expect, it } from "vitest";
import { rewrite, RewriteInput, ruleRewrite } from "@/lib/sync";

describe("Sync", () => {
  it("validates input", () => {
    expect(RewriteInput.safeParse({ kind: "project", answer: "x" }).success).toBe(false);
    expect(RewriteInput.safeParse({ kind: "project", answer: "Inventory system" }).success).toBe(true);
    expect(RewriteInput.safeParse({ kind: "other", answer: "Inventory system" }).success).toBe(false);
  });

  it("rewrites Taglish with rules when Claude isn't available", () => {
    const out = ruleRewrite({ kind: "project", topic: "", answer: "Inventory system para sa school canteen. Ako yung gumawa ng database, 4 kami sa team." });
    expect(out.title.toLowerCase()).toContain("inventory system");
    expect(out.line).toMatch(/\.$/);
    expect(out.line).not.toMatch(/para sa/);
    expect(out.skills).toContain("Database design");
  });

  it("falls back to rules without an API key", async () => {
    const prev = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const out = await rewrite({ kind: "experience", topic: "Club officer", question: "", course: "", answer: "Treasurer ng IT Society, nag-collect ng fees sa Google Sheets" });
    expect(out.source).toBe("rules");
    expect(out.title).toBe("Club officer");
    expect(out.skills).toContain("Google Sheets");
    if (prev) process.env.ANTHROPIC_API_KEY = prev;
  });
});
