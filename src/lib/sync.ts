import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// Sync turns a student's answer (English, Filipino or Taglish) into one
// resume entry. Claude Haiku does the writing; a rule-based rewrite covers
// a missing key, an API error or a refusal.

export const MODEL = "claude-haiku-5-5";

export const RewriteInput = z.object({
  kind: z.enum(["project", "experience"]),
  topic: z.string().max(60).default(""),
  question: z.string().max(200).default(""),
  answer: z.string().trim().min(2).max(800),
  course: z.string().max(120).default(""),
});
export type RewriteInput = z.infer<typeof RewriteInput>;

export const RewriteOutput = z.object({
  title: z.string().describe("Short entry title, at most 60 characters, e.g. 'Canteen inventory system' or 'Treasurer, IT Society'."),
  line: z.string().describe("One English sentence, at most 140 characters, starting with a past-tense verb."),
  skills: z.array(z.string()).describe("Up to four concrete skills the answer shows, each one to three words."),
});
export type RewriteOutput = z.infer<typeof RewriteOutput>;

const SYSTEM = `You are Sync, the resume assistant inside Unisync, an internship app for college students in the Philippines.
A student answered one onboarding question, often in Taglish or Filipino. Turn the answer into one resume entry in English.

Rules:
- Use only facts in the answer. Never invent employers, numbers, dates, tools, awards or results.
- Translate Filipino and Taglish into plain, professional English.
- title: a short noun phrase. For a project, name the thing built ("Canteen inventory system"). For a role, use "Role, Organization" when both are given ("Treasurer, IT Society").
- line: one sentence that starts with a past-tense action verb and says what the student did. No first person. Keep any numbers from the answer.
- Follow AP style: spell out one through nine, use numerals for 10 and up, write "four-person team".
- skills: up to four concrete skills shown in the answer, such as "SQL", "Budgeting" or "Google Sheets". Use an empty list if none are clear.`;

let client: Anthropic | null = null;
// Shared client, or null when no API key is set.
export function anthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

export async function rewrite(input: RewriteInput): Promise<RewriteOutput & { source: "claude" | "rules" }> {
  const c = anthropic();
  if (c) {
    try {
      const prompt = [
        `Entry type: ${input.kind === "project" ? "project (capstone or school project)" : `experience (${input.topic || "activity"})`}`,
        input.course ? `Student's course: ${input.course}` : "",
        input.question ? `Question: ${input.question}` : "",
        `Answer: ${input.answer}`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await c.messages.parse(
        {
          model: MODEL,
          max_tokens: 2000,
          system: SYSTEM,
          output_config: { effort: "low", format: zodOutputFormat(RewriteOutput) },
          messages: [{ role: "user", content: prompt }],
        },
        { timeout: 15_000, maxRetries: 1 },
      );

      if (response.stop_reason !== "refusal" && response.parsed_output) {
        return { ...clean(response.parsed_output), source: "claude" };
      }
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) {
        console.warn("Sync: rate limited, using rules");
      } else if (error instanceof Anthropic.AuthenticationError) {
        console.error("Sync: ANTHROPIC_API_KEY was rejected");
      } else if (error instanceof Anthropic.APIError) {
        console.error(`Sync: API error ${error.status}`);
      } else {
        console.error("Sync: rewrite failed", error);
      }
    }
  }
  return { ...ruleRewrite(input), source: "rules" };
}

function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > n * 0.6 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

function clean(o: RewriteOutput): RewriteOutput {
  const line = clip(o.line, 160);
  return {
    title: clip(o.title, 70),
    line: /[.!?…]$/.test(line) ? line : `${line}.`,
    skills: o.skills.map((s) => clip(s, 30)).filter(Boolean).slice(0, 4),
  };
}

// Common Taglish words, mapped so the fallback still reads as English.
const TAGLISH: Array<[RegExp, string]> = [
  [/,?\s*(\d+) kami sa team/gi, " for a $1-person team"],
  [/\bpara sa\b/gi, "for the"],
  [/\bako (yung|ang) (gumawa ng|gumawa)\b/gi, "I built the"],
  [/\bako (yung|ang) nag-?/gi, "I "],
  [/\b(gumawa|ginawa) (kami|ako) ng\b/gi, "built the"],
  [/\bgamit ang\b/gi, "using"],
  [/\bkasama ang\b/gi, "with"],
  [/\bginamit (siya|ito|namin)?\s*ng\b/gi, "used by the"],
  [/\bkami\b/gi, "we"],
  [/\bat\b/gi, "and"],
  [/\bsa\b/gi, "in"],
  [/\bng\b/gi, "the"],
  [/\bmga\b/gi, ""],
  [/\btapos\b/gi, "then"],
  [/\bnag-?/gi, ""],
];

const SKILL_WORDS = ["SQL", "Python", "Excel", "Google Sheets", "Figma", "Canva", "React", "Java", "PHP", "Power BI", "Tableau", "Photoshop", "Inventory", "Budgeting", "Customer service", "Networking"];

export function ruleRewrite(input: Pick<RewriteInput, "kind" | "topic" | "answer">): RewriteOutput {
  let text = input.answer.replace(/\s+/g, " ").trim();
  for (const [re, to] of TAGLISH) text = text.replace(re, to);
  text = text.replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").trim();
  const firstClause = text.split(/[.,;!?]/)[0]?.trim() ?? text;
  const titleWords = firstClause.split(" ").slice(0, 6).join(" ");
  const title =
    input.kind === "project"
      ? capitalize(titleWords.replace(/^(i |we |my |our )/i, ""))
      : input.topic || capitalize(titleWords);
  // Capitalize each sentence, since the word swaps above can leave "built the. then…".
  let line = capitalize(text.replace(/^(i |we )/i, "")).replace(/([.!?]\s+)([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
  if (!/[.!?]$/.test(line)) line += ".";
  const lower = input.answer.toLowerCase();
  const skills = SKILL_WORDS.filter((s) => lower.includes(s.toLowerCase())).slice(0, 4);
  if (/database/.test(lower) && !skills.includes("Database design")) skills.push("Database design");
  return clean({ title: title || (input.kind === "project" ? "Capstone project" : "Experience"), line, skills });
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
