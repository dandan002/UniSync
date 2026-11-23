import { render } from "@react-email/render";
import { NextResponse } from "next/server";
import {
  ApplicationSentEmail,
  InterviewEmail,
  InviteEmail,
  MessageEmail,
  MoaEmail,
  NewApplicantEmail,
  OfferEmail,
  ReminderEmail,
  ResumeReadyEmail,
  VerifiedEmail,
} from "@/lib/email/templates";

// Email previews with sample data, for demo deployments only.
const SAMPLES = {
  "resume-ready": () => ResumeReadyEmail({ name: "Bea", matches: 6, skills: ["SQL", "Database design", "Budgeting", "Google Sheets", "Inventory"], topJob: { title: "Data intern", company: "Kalye Logistics", detail: "Pasig · ₱6,000 a month" } }),
  "application-sent": () => ApplicationSentEmail({ name: "Bea", job: "Data intern", company: "Kalye Logistics", detail: "Pasig · ₱6,000 a month" }),
  "new-applicant": () =>
    NewApplicantEmail({
      company: "Kalye Logistics",
      student: "Bea Santos",
      school: "Bayview State University",
      job: "Data intern",
      why: "Built canteen inventory system: designed the SQL database for a four-person team. Treasurer, IT Society: collected dues for 120 members. Two of your listed skills (SQL, Python), wants to intern in Pasig.",
    }),
  interview: () => InterviewEmail({ name: "Bea", company: "Kalye Logistics", job: "Data intern", when: "Thursday, 2 p.m.", where: "Google Meet" }),
  offer: () => OfferEmail({ name: "Ella", company: "Kalye Logistics", job: "Data intern", detail: "Pasig · ₱6,000 a month" }),
  reminder: () => ReminderEmail({ name: "Mark", school: "Bayview State University", message: "Hi Mark, please finish your resume and upload your medical certificate this week.", missing: ["Resume", "Medical certificate", "Orientation"] }),
  invite: () => InviteEmail({ school: "Bayview State University", role: "coordinator", inviter: "Ramon Cruz", email: "jun.mercado@bayview.example.com" }),
  verified: () => VerifiedEmail({ company: "Pulo Telecom" }),
  message: () => MessageEmail({ name: "Bea", company: "Kalye Logistics", body: "Hi Bea! Can you share your capstone repo before Thursday's interview?" }),
  moa: () => MoaEmail({ company: "Tanglaw Software", school: "Bayview State University" }),
} as const;

export async function GET(_req: Request, ctx: RouteContext<"/api/emails/[name]">) {
  if (process.env.DEMO_LOGINS !== "on") return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { name } = await ctx.params;
  if (name === "index") {
    const links = Object.keys(SAMPLES)
      .map((k) => `<li><a href="/api/emails/${k}">${k}</a></li>`)
      .join("");
    return new NextResponse(`<!doctype html><meta charset="utf-8"><title>Email previews</title><body style="font-family:system-ui;padding:32px"><h1>Unisync emails</h1><ul>${links}</ul></body>`, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  const make = SAMPLES[name as keyof typeof SAMPLES];
  if (!make) return NextResponse.json({ error: "Unknown email." }, { status: 404 });
  const html = await render(make());
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
