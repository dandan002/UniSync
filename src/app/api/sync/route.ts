import { NextResponse } from "next/server";
import { clientIp, rateLimiter } from "@/lib/rate-limit";
import { rewrite, RewriteInput } from "@/lib/sync";

// Students call Sync before they have an account, so this route is public.
// Inputs are capped and each IP gets a small budget per minute.
const allowed = rateLimiter(12, 60_000);

export async function POST(req: Request) {
  if (!allowed(clientIp(req))) {
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
