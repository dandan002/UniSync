import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

// Unisync emails: periwinkle band, white card, Instrument Sans with system
// fallbacks, one soft primary button. Inline styles for email clients.

const C = {
  ink: "#1E2140",
  ink2: "#3F4262",
  muted: "#5E6280",
  line: "#E6E7F2",
  surface: "#F4F5FC",
  primary: "#D4DAFF",
  soft: "#E8EBFF",
  mark: "#7C88DC",
  accent: "#4A55A8",
  lilac: "#A99BF0",
  lilacSoft: "#F1EDFF",
};
const FONT = "'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function appUrl(path = "/"): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

type Fact = { label: string; value: string };

function Layout({
  preview,
  eyebrow,
  title,
  children,
  cta,
  facts,
  tone = "periwinkle",
}: {
  preview: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  cta?: { label: string; href: string };
  facts?: Fact[];
  tone?: "periwinkle" | "lilac";
}) {
  const band = tone === "lilac" ? C.lilacSoft : C.primary;
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Instrument Sans"
          fallbackFontFamily={["Helvetica", "Arial", "sans-serif"] as never}
          webFont={{ url: "https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1Q.woff2", format: "woff2" }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "32px 12px", backgroundColor: C.surface, fontFamily: FONT, color: C.ink }}>
        <Container style={{ maxWidth: 560, width: "100%", margin: "0 auto" }}>
          <Section style={{ padding: "0 4px 20px" }}>
            <Img src={appUrl("/email/logo.png")} width="132" height="32" alt="unisync" style={{ display: "block" }} />
          </Section>

          <Section style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
            <Section style={{ backgroundColor: band, padding: "28px 32px 24px" }}>
              {eyebrow ? (
                <Text style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: C.accent, letterSpacing: "0.02em" }}>{eyebrow}</Text>
              ) : null}
              <Heading as="h1" style={{ margin: 0, fontSize: 30, lineHeight: "36px", fontWeight: 400, letterSpacing: "-0.03em", color: C.ink }}>
                {title}
              </Heading>
            </Section>

            <Section style={{ padding: "28px 32px 8px" }}>{children}</Section>

            {facts && facts.length ? (
              <Section style={{ padding: "4px 32px 8px" }}>
                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: C.surface, borderRadius: 12 }}>
                  <tbody>
                    {facts.map((f, i) => (
                      <tr key={f.label}>
                        <td style={{ padding: i === 0 ? "18px 20px 6px" : i === facts.length - 1 ? "6px 20px 18px" : "6px 20px", fontSize: 13, color: C.muted, width: "38%", verticalAlign: "top" }}>
                          {f.label}
                        </td>
                        <td style={{ padding: i === 0 ? "18px 20px 6px 0" : i === facts.length - 1 ? "6px 20px 18px 0" : "6px 20px 6px 0", fontSize: 15, fontWeight: 600, color: C.ink, verticalAlign: "top" }}>
                          {f.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            ) : null}

            {cta ? (
              <Section style={{ padding: "16px 32px 32px" }}>
                <Button
                  href={cta.href}
                  style={{ backgroundColor: C.primary, color: C.ink, borderRadius: 8, padding: "14px 24px", fontSize: 15, fontWeight: 600, textDecoration: "none", display: "inline-block" }}
                >
                  {cta.label} →
                </Button>
              </Section>
            ) : (
              <Section style={{ padding: "0 32px 24px" }} />
            )}
          </Section>

          <Section style={{ padding: "24px 4px 0" }}>
            <Text style={{ margin: "0 0 6px", fontSize: 13, lineHeight: "20px", color: C.muted }}>
              Messages stay on Unisync. We never ask for money, and we block companies that do.
            </Text>
            <Hr style={{ borderColor: C.line, margin: "16px 0" }} />
            <Text style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: C.muted }}>
              Made for students in the Philippines ·{" "}
              <Link href={appUrl("/")} style={{ color: C.accent, textDecoration: "none" }}>
                unisync
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const p: CSSProperties = { margin: "0 0 16px", fontSize: 16, lineHeight: "26px", color: C.ink2 };
const quote: CSSProperties = {
  margin: "0 0 16px",
  padding: "14px 18px",
  borderLeft: `3px solid ${C.mark}`,
  backgroundColor: C.surface,
  borderRadius: 8,
  fontSize: 16,
  lineHeight: "26px",
  color: C.ink,
};

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <Text style={{ margin: "0 0 16px", lineHeight: "34px" }}>
      {items.map((s) => (
        <span key={s} style={{ display: "inline-block", backgroundColor: "#F2F4FF", color: C.accent, borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 600, marginRight: 6 }}>
          {s}
        </span>
      ))}
    </Text>
  );
}

// 1. Resume saved after onboarding
export function ResumeReadyEmail(props: { name: string; matches: number; topJob?: { title: string; company: string; detail: string }; skills: string[] }) {
  return (
    <Layout
      preview={`Your resume is ready. ${props.matches > 0 ? `${props.matches} internships match it.` : ""}`}
      eyebrow="Your resume is saved"
      title={`You're ready, ${props.name}.`}
      cta={{ label: "View internships", href: appUrl("/jobs") }}
      facts={props.topJob ? [{ label: "Closest match", value: `${props.topJob.title}, ${props.topJob.company}` }, { label: "Details", value: props.topJob.detail }] : undefined}
    >
      <Text style={p}>Sync turned your answers into a resume. Here are the skills it found:</Text>
      <Chips items={props.skills.slice(0, 6)} />
      <Text style={p}>
        {props.matches > 0 ? `${props.matches === 1 ? "One internship matches" : `${props.matches} internships match`} your resume.` : "New internships are posted every week."} Every company on Unisync is verified.
      </Text>
    </Layout>
  );
}

// 2. Student applied
export function ApplicationSentEmail(props: { name: string; job: string; company: string; detail: string }) {
  return (
    <Layout
      preview={`Your application to ${props.company} is in.`}
      eyebrow="Application sent"
      title={`${props.company} has your resume.`}
      cta={{ label: "Track your applications", href: appUrl("/home") }}
      facts={[
        { label: "Role", value: props.job },
        { label: "Company", value: props.company },
        { label: "Details", value: props.detail },
      ]}
    >
      <Text style={p}>Hi {props.name}, most companies reply within three days. We'll email you when they view it or invite you to an interview.</Text>
    </Layout>
  );
}

// 3. Employer: new applicant
export function NewApplicantEmail(props: { company: string; student: string; school: string; job: string; why: string }) {
  return (
    <Layout
      preview={`${props.student} applied to ${props.job}.`}
      eyebrow={`New applicant for ${props.job}`}
      title={`${props.student} applied.`}
      cta={{ label: "Review applicants", href: appUrl("/employer") }}
      facts={[
        { label: "School", value: props.school || "Not linked yet" },
        { label: "Role", value: props.job },
      ]}
      tone="lilac"
    >
      <Text style={p}>Why Sync suggests them:</Text>
      <Text style={quote}>{props.why}</Text>
      <Text style={{ ...p, fontSize: 14, color: C.muted }}>Recommendations exclude age, gender and photos. You make the final decision.</Text>
    </Layout>
  );
}

// 4. Interview invite
export function InterviewEmail(props: { name: string; company: string; job: string; when: string; where: string }) {
  return (
    <Layout
      preview={`${props.company} wants to interview you, ${props.when}.`}
      eyebrow="Interview"
      title={`${props.company} wants to interview you.`}
      cta={{ label: "See the details", href: appUrl("/home") }}
      facts={[
        { label: "Role", value: props.job },
        { label: "When", value: props.when },
        { label: "Where", value: props.where },
      ]}
    >
      <Text style={p}>Congratulations, {props.name}. Bring your resume and a short story about your capstone. You can practice with Sync before the day.</Text>
    </Layout>
  );
}

// 5. Offer
export function OfferEmail(props: { name: string; company: string; job: string; detail: string }) {
  return (
    <Layout
      preview={`${props.company} sent you an offer.`}
      eyebrow="Offer"
      title={`You got an offer from ${props.company}.`}
      cta={{ label: "Accept the offer", href: appUrl("/home") }}
      facts={[
        { label: "Role", value: props.job },
        { label: "Details", value: props.detail },
      ]}
      tone="lilac"
    >
      <Text style={p}>Nice work, {props.name}. Accept it on Unisync and we'll tell your school, so your coordinator can start your placement forms.</Text>
    </Layout>
  );
}

// 6. Coordinator reminder
export function ReminderEmail(props: { name: string; school: string; message: string; missing: string[] }) {
  return (
    <Layout
      preview={props.message}
      eyebrow={`From ${props.school}`}
      title={`A reminder from your coordinator`}
      cta={{ label: "Open Unisync", href: appUrl("/home") }}
    >
      <Text style={p}>Hi {props.name},</Text>
      <Text style={quote}>{props.message}</Text>
      {props.missing.length ? (
        <>
          <Text style={{ ...p, marginBottom: 8 }}>Still needed:</Text>
          <Chips items={props.missing} />
        </>
      ) : null}
    </Layout>
  );
}

// 7. Invite to a school
export function InviteEmail(props: { school: string; role: string; inviter: string; email: string }) {
  const article = /^[aeiou]/i.test(props.role) ? "an" : "a";
  return (
    <Layout
      preview={`${props.inviter} invited you to ${props.school} on Unisync.`}
      eyebrow="You're invited"
      title={`Join ${props.school} on Unisync.`}
      cta={{ label: "Accept the invite", href: appUrl(`/sign-in?email=${encodeURIComponent(props.email)}`) }}
      facts={[
        { label: "Role", value: props.role.charAt(0).toUpperCase() + props.role.slice(1) },
        { label: "Invited by", value: props.inviter },
      ]}
    >
      <Text style={p}>
        {props.inviter} added you as {article} {props.role}. Sign in with {props.email} and you'll land in the right place. No password needed; we'll email you a code.
      </Text>
    </Layout>
  );
}

// 8. Company verified
export function VerifiedEmail(props: { company: string }) {
  return (
    <Layout
      preview={`${props.company} is verified. Your jobs are live.`}
      eyebrow="Company verified"
      title={`${props.company} is verified.`}
      cta={{ label: "Post an internship", href: appUrl("/employer/jobs") }}
    >
      <Text style={p}>We checked your registration, work email and phone. Your jobs now show to students, with a verified badge next to your name.</Text>
    </Layout>
  );
}

// 9. Message from an employer
export function MessageEmail(props: { name: string; company: string; body: string }) {
  return (
    <Layout preview={`${props.company}: ${props.body.slice(0, 80)}`} eyebrow={`Message from ${props.company}`} title={`${props.company} sent you a message.`} cta={{ label: "Reply on Unisync", href: appUrl("/home") }}>
      <Text style={p}>Hi {props.name},</Text>
      <Text style={quote}>{props.body}</Text>
    </Layout>
  );
}

// 10. MOA sent to a company
export function MoaEmail(props: { company: string; school: string }) {
  return (
    <Layout preview={`${props.school} sent ${props.company} an MOA to sign.`} eyebrow="MOA to sign" title={`${props.school} sent you an MOA.`} cta={{ label: "Review and sign", href: appUrl("/employer/interns") }}>
      <Text style={p}>A signed memorandum of agreement lets {props.school} place interns with {props.company} and marks your jobs as school partner roles.</Text>
    </Layout>
  );
}
