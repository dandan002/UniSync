// Facts the privacy policy and terms depend on. Update the effective date
// whenever either page changes in substance.

export const LEGAL = {
  // The name people see as the operator. Replace with the registered
  // business name once there is one.
  operator: "Unisync",
  effective: "Nov. 24, 2026",
  // Where privacy requests and questions go. Required by the Data Privacy Act,
  // so set NEXT_PUBLIC_LEGAL_EMAIL before launch.
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL?.trim() || "",
} as const;

// Outside services that handle personal data for Unisync, and what for.
export const PROCESSORS: Array<{ name: string; use: string }> = [
  { name: "Clerk", use: "sign-in codes by email or text, and keeping you signed in" },
  { name: "Supabase", use: "the database and private file storage for school forms" },
  { name: "Anthropic", use: "the Claude models behind Sync, which read your answers, resume and chat messages to write resume entries" },
  { name: "Resend", use: "sending emails, such as application updates and reminders" },
  { name: "Vercel", use: "hosting the app and its server logs" },
];
