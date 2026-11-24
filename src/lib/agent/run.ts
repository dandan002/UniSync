import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatEvent, ChatTurn } from "@/lib/agent/chat";
import { applyEdit, TOOLS } from "@/lib/agent/edits";
import { buildMessages, renderGaps, SYSTEM } from "@/lib/agent/prompt";
import { reviewResume } from "@/lib/review";
import type { ResumeData } from "@/lib/types";

// Sync's chat turn: Claude Haiku with adaptive thinking, five resume tools,
// and a hard cap on steps. The text streams to the student as it's written,
// and each edit shows up on their resume as soon as it's applied.

export const AGENT_MODEL = "claude-haiku-5-5";
const EFFORT = "medium";
const MAX_STEPS = 6;
const MAX_TOKENS = 8000;

const REFUSED = "I can only help with your resume. Let's get back to it: what should we work on next?";

export async function runAgent(opts: {
  client: Anthropic;
  resume: ResumeData;
  history: ChatTurn[];
  message: string;
  emit: (e: ChatEvent) => void;
  // Saves after each batch of edits. Throwing ends the turn.
  commit: (resume: ResumeData) => Promise<void>;
  signal?: AbortSignal;
}): Promise<ResumeData> {
  const { client, emit, signal } = opts;
  let resume = opts.resume;
  const messages = buildMessages(opts.history, opts.message, resume, reviewResume(resume));
  let wrote = false;
  let edited = false;
  let badJson = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    let stepWrote = false;
    const stream = client.messages.stream(
      {
        model: AGENT_MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: "adaptive" },
        output_config: { effort: EFFORT },
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        tools: TOOLS,
        messages,
      },
      { signal, timeout: 40_000, maxRetries: 1 },
    );
    stream.on("text", (delta) => {
      if (!stepWrote && wrote) emit({ t: "text", v: "\n\n" });
      stepWrote = true;
      wrote = true;
      emit({ t: "text", v: delta });
    });

    let msg: Anthropic.Message;
    try {
      msg = await stream.finalMessage();
    } catch (err) {
      // With eager input streaming, a tool input that isn't JSON at all
      // rejects here. Re-issue the step once; API errors and aborts go up.
      if (err instanceof Anthropic.APIError || badJson++ >= 1) throw err;
      continue;
    }

    if (msg.stop_reason === "refusal") {
      emit({ t: "reset" });
      emit({ t: "text", v: REFUSED });
      return resume;
    }

    const calls = msg.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    // A tool input cut off at max_tokens can still parse, so never run it.
    if (msg.stop_reason !== "tool_use" || !calls.length) {
      if (msg.stop_reason === "max_tokens") console.warn("Sync chat: hit max_tokens");
      break;
    }

    messages.push({ role: "assistant", content: msg.content });
    const results: Anthropic.ContentBlockParam[] = [];
    let changed = false;
    for (const call of calls) {
      const r = applyEdit(resume, call.name, call.input);
      if (r.ok) {
        resume = r.resume;
        changed = true;
        emit({ t: "edit", label: r.label, resume });
        results.push({ type: "tool_result", tool_use_id: call.id, content: r.result });
      } else {
        results.push({ type: "tool_result", tool_use_id: call.id, content: r.error, is_error: true });
      }
    }
    if (changed) {
      edited = true;
      await opts.commit(resume);
    }
    // The checklist after these edits, so the next question comes from what's left.
    const review = reviewResume(resume);
    results.push({ type: "text", text: `<gaps>\nResume strength: ${review.score}%\n${renderGaps(review)}\n</gaps>` });
    messages.push({ role: "user", content: results });
  }

  if (!wrote) {
    emit({ t: "text", v: edited ? "Done, I updated your resume. What should we work on next?" : "Sorry, I lost my train of thought. Could you say that again?" });
  }
  return resume;
}
