import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import { sendEmail } from "@/lib/email/send";
import { InterviewEmail, ResumeReadyEmail } from "@/lib/email/templates";

describe("emails", () => {
  it("renders branded HTML with the call to action", async () => {
    const html = await render(InterviewEmail({ name: "Bea", company: "Kalye Logistics", job: "Data intern", when: "Thursday, 2 p.m.", where: "Google Meet" }));
    expect(html).toContain("Kalye Logistics wants to interview you.");
    expect(html).toContain("Thursday, 2 p.m.");
    expect(html).toContain("/email/logo.png");
    expect(html).toContain("#D4DAFF");
  });

  it("lists skills on the resume email", async () => {
    const html = await render(ResumeReadyEmail({ name: "Bea", matches: 6, skills: ["SQL", "Budgeting"] }));
    expect(html).toContain("6 internships match");
    expect(html).toContain("Budgeting");
  });

  it("never mails reserved demo domains", async () => {
    const res = await sendEmail(["bea@bayview.example.com", "x@foo.test"], "Hi", ResumeReadyEmail({ name: "B", matches: 0, skills: [] }));
    expect(res).toEqual({ skipped: "no deliverable recipients" });
  });
});
