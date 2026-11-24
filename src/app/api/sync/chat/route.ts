import Anthropic from "@anthropic-ai/sdk";
import { ChatRequest, LIMITS, type ChatEvent } from "@/lib/agent/chat";
import { runAgent } from "@/lib/agent/run";
import { scriptedTurn } from "@/lib/agent/scripted";
import { loadResume, persistResume } from "@/lib/data";
import { allow } from "@/lib/limit";
import { anthropic } from "@/lib/sync";
import type { ResumeData } from "@/lib/types";
import { getViewer, SetupError, type Viewer } from "@/lib/viewer";

// One chat turn with Sync. Signed-in students only, rate limited per student,
// working only on the student's own saved resume. Streams newline-delimited
// JSON events (see ChatEvent) and saves each batch of edits as it lands.

export const maxDuration = 60;

class SaveError extends Error {}

function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

// Browsers send Origin on cross-site POSTs. JSON-only also forces a CORS
// preflight, which this route never approves.
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

let warned = false;
async function takeTurn(viewer: Viewer): Promise<"ok" | "burst" | "daily"> {
  const { data, error } = await viewer.supabase.rpc("take_sync_turn");
  if (!error && (data === "ok" || data === "burst" || data === "daily")) return data;
  if (!warned) {
    warned = true;
    console.warn(`Sync chat: take_sync_turn() unavailable (${error?.code ?? "unexpected result"}), so limits are per server instance. Apply supabase/migrations/20261124090000_sync_chat_limits.sql.`);
  }
  const id = viewer.profile.id;
  if (!allow(`sync:10m:${id}`, 20, 10 * 60_000)) return "burst";
  if (!allow(`sync:day:${id}`, 150, 24 * 60 * 60_000)) return "daily";
  return "ok";
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cross-site requests aren't allowed.");
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return fail(415, "Send JSON.");

  let viewer: Viewer | null;
  try {
    viewer = await getViewer();
  } catch (e) {
    return fail(503, e instanceof SetupError ? e.message : "Sync isn't available right now.");
  }
  if (!viewer) return fail(401, "Sign in to chat with Sync.");
  if (viewer.profile.role !== "student") return fail(403, "Sync is for students.");
  const me = viewer;

  const raw = await req.text();
  if (raw.length > LIMITS.body) return fail(413, "This chat is too long. Tap Start over to keep going.");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "Send JSON.");
  }
  const parsed = ChatRequest.safeParse(body);
  if (!parsed.success) {
    const long = parsed.error.issues.some((i) => i.path[0] === "message" && i.code === "too_big");
    return fail(400, long ? `Keep messages under ${LIMITS.message.toLocaleString("en-US")} characters.` : "Write a message first.");
  }
  const { history, message, focus, pick } = parsed.data;

  const { row, data } = await loadResume(me);
  if (!row) return fail(409, "Save your resume first.");

  const turn = await takeTurn(me);
  if (turn === "burst") return fail(429, "That's a lot of messages at once. Take a short break and try again in a few minutes.");
  if (turn === "daily") return fail(429, "You've reached today's limit for Sync. Your resume is saved, so come back tomorrow.");

  const client = anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (e: ChatEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
        } catch {
          open = false;
        }
      };

      let saved: ResumeData = data;
      let nextFocus: string | undefined;
      const commit = async (resume: ResumeData) => {
        const res = await persistResume(me, resume);
        if (!res.ok) throw new SaveError(res.error);
        saved = res.data;
      };

      try {
        if (client) {
          await runAgent({ client, resume: data, history, message, emit: send, commit, signal: req.signal });
        } else {
          const out = scriptedTurn(data, { focus, pick, message });
          if (out.edits.length) {
            await commit(out.resume);
            for (const label of out.edits) send({ t: "edit", label, resume: saved });
          }
          send({ t: "text", v: out.text });
          nextFocus = out.focus;
        }
      } catch (e) {
        if (!req.signal.aborted) {
          if (e instanceof SaveError) console.error("Sync chat: save failed", e.message);
          else if (e instanceof Anthropic.APIError) console.error(`Sync chat: API error ${e.status ?? ""}`, e.message);
          else console.error("Sync chat failed", e);
          send({ t: "error", message: e instanceof SaveError ? "Sync couldn't save that change. Try again." : "Sync couldn't answer just now. Try again in a moment." });
        }
      } finally {
        // The resume as stored, which is what the student should see.
        send({ t: "done", resume: saved, focus: nextFocus });
        if (open) {
          try {
            controller.close();
          } catch {
            // already closed by a disconnect
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
