import { NextResponse } from "next/server";
import { rewrite, RewriteInput } from "@/lib/sync";

// Students call Sync before they have an account, so this route is public.
// Inputs are capped and each IP gets a small budget per minute.
const WINDOW_MS = 60_000;
const LIMIT = 12;
const hits = new Map<string, number[]>();

function allowed(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowed(ip)) {
    return NextResponse.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON." }, { status: 400 });
  }
  const parsed = RewriteInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Write a little more first." }, { status: 400 });
  }
  const result = await rewrite(parsed.data);
  return NextResponse.json(result);
}
