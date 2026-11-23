import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";

// Sends through Resend. Skips (and logs) when no key is set, and never mails
// reserved demo domains (example.com and .test).
const RESERVED = /@([a-z0-9-]+\.)*(example\.(com|org|net)|test|invalid|localhost)$/i;

let resend: Resend | null = null;

export async function sendEmail(to: string | Array<string | null | undefined> | null | undefined, subject: string, react: ReactElement) {
  const list = (Array.isArray(to) ? to : [to]).filter((e): e is string => !!e && /@/.test(e)).map((e) => e.trim().toLowerCase());
  const recipients = [...new Set(list)].filter((e) => !RESERVED.test(e));
  if (!recipients.length) return { skipped: "no deliverable recipients" as const };
  if (!process.env.RESEND_API_KEY) {
    console.info(`[email skipped, no RESEND_API_KEY] ${subject} -> ${recipients.length} recipient(s)`);
    return { skipped: "no key" as const };
  }
  resend ??= new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Unisync <onboarding@resend.dev>",
    to: recipients,
    subject,
    react,
  });
  if (error) {
    console.error(`[email failed] ${subject}: ${error.message}`);
    return { error: error.message };
  }
  return { id: data?.id };
}
