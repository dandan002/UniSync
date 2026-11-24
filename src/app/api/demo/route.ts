import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// One-click demo sign-in. Only these Clerk users (matched by external_id)
// can be signed in this way, and only when DEMO_LOGINS=on.
const PERSONAS: Record<string, string> = {
  student: "demo-student-bea",
  newstudent: "demo-student-nina",
  coordinator: "demo-coordinator-maria",
  admin: "demo-admin-ramon",
  employer: "demo-employer-liza",
  pending: "demo-employer-tess",
};

export async function POST(req: Request) {
  if (process.env.DEMO_LOGINS !== "on") return NextResponse.json({ error: "Demo sign-in is off." }, { status: 404 });
  const { persona } = (await req.json().catch(() => ({}))) as { persona?: string };
  const externalId = persona ? PERSONAS[persona] : undefined;
  if (!externalId) return NextResponse.json({ error: "Unknown demo account." }, { status: 400 });

  const clerk = await clerkClient();
  const { data } = await clerk.users.getUserList({ externalId: [externalId], limit: 1 });
  const user = data[0];
  if (!user) return NextResponse.json({ error: "That demo account isn't set up." }, { status: 404 });

  const token = await clerk.signInTokens.createSignInToken({ userId: user.id, expiresInSeconds: 120 });
  return NextResponse.json({ ticket: token.token });
}
