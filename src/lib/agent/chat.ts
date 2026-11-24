import { z } from "zod";
import { spell } from "@/lib/format";
import { reviewResume } from "@/lib/review";
import type { ResumeData } from "@/lib/types";

// The contract between the Sync chat in the browser and /api/sync/chat.

export const LIMITS = {
  message: 1200,
  turns: 24,
  userText: 1200,
  assistantText: 2400,
  body: 64_000,
} as const;

// The transcript lives on the student's device and comes back with every
// message. The server treats it as untrusted: it's capped here, tool calls
// are never replayed from it, and the resume itself is always reloaded from
// the database.
export const ChatTurn = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().max(LIMITS.assistantText * 2),
  edits: z.array(z.string().max(120)).max(12).optional(),
});
export type ChatTurn = z.infer<typeof ChatTurn>;

export const ChatRequest = z.object({
  history: z.array(ChatTurn).max(80),
  message: z.string().trim().min(1).max(LIMITS.message),
  // The checklist item Sync last asked about, and one the student tapped.
  // Only the no-key fallback needs them; Claude reads the conversation.
  focus: z.string().max(80).optional(),
  pick: z.string().max(80).optional(),
});
export type ChatRequest = z.infer<typeof ChatRequest>;

// Newline-delimited JSON events streamed back to the browser.
export type ChatEvent =
  | { t: "text"; v: string }
  | { t: "reset" }
  | { t: "edit"; label: string; resume: ResumeData }
  | { t: "done"; resume: ResumeData; focus?: string }
  | { t: "error"; message: string };

// Sync's first message, built from the checklist so it's instant and free.
export function openingMessage(resume: ResumeData, firstName: string): { text: string; focus?: string } {
  const { gaps } = reviewResume(resume);
  const hi = firstName ? `Hi ${firstName}!` : "Hi!";
  if (!gaps.length) {
    return {
      text: `${hi} Your resume already covers the essentials. Tell me about anything we haven't listed yet, like a part-time job, a competition or an org role, or ask me to sharpen any entry.`,
    };
  }
  const count = gaps.length === 1 ? "one thing" : `${spell(gaps.length)} things`;
  return {
    text: `${hi} You've got the basics down. Now let's make this a resume a company would shortlist. I found ${count} to strengthen, and I'll update your resume as we talk. English, Filipino or Taglish is fine.\n\n${gaps[0].ask}`,
    focus: gaps[0].id,
  };
}
