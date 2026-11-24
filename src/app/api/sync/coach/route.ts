import { NextResponse } from "next/server";
import { coachTurn, CoachRequest } from "@/lib/coach";
import { clientIp, rateLimiter } from "@/lib/rate-limit";

// Sync's resume chat. Public, because students chat before they have an
// account. See src/lib/coach.ts for the guardrails.
const perMinute = rateLimiter(20, 60_000);
const perHour = rateLimiter(150, 60 * 60_000);
const MAX_BODY = 96_000;

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!perMinute(ip) || !perHour(`h:${ip}`)) {
    return NextResponse.json({ error: "Sync needs a short break. Wait a minute and try again." }, { status: 429 });
  }
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) {
    return NextResponse.json({ error: "That's too long for Sync." }, { status: 413 });
  }
  const text = await req.text();
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: "That's too long for Sync." }, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Send JSON." }, { status: 400 });
  }
  const parsed = CoachRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Sync couldn't read that. Try a shorter message." }, { status: 400 });
  }
  const result = await coachTurn(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, reset: result.reset ?? false }, { status: result.status });
  }
  return NextResponse.json(result.reply);
}
