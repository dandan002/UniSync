import { z } from "zod";

// What a saved resume may contain. Manual edits and Sync's edits both pass
// through these before they reach the database.

export const ItemSchema = z.object({
  title: z.string().max(120),
  line: z.string().max(300),
  bullets: z.array(z.string().max(200)).max(6).optional(),
  when: z.string().max(40).optional(),
  section: z.enum(["Leadership", "Work", "Volunteer", "Activities"]).optional(),
  kind: z.string().max(40).optional(),
});

export const ResumeSchema = z.object({
  name: z.string().min(1).max(120),
  course: z.string().max(120),
  school: z.string().max(160).optional(),
  email: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  availability: z.string().max(60).optional(),
  summary: z.string().max(400).optional(),
  language: z.enum(["English", "Filipino", "Taglish"]).optional(),
  projects: z.array(ItemSchema).max(8),
  experience: z.array(ItemSchema).max(12),
  skills: z.array(z.string().max(40)).max(20),
  prefs: z.object({ places: z.array(z.string().max(40)).max(12), minAllowance: z.number().int().min(0).max(100000) }),
});
