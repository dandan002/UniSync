// Row shapes for the Supabase tables the app reads. Kept by hand so the app
// builds before types are generated; see supabase/migrations for the source.

export type Role = "student" | "coordinator" | "supervisor" | "admin";
export type AppStatus = "new" | "reviewing" | "interview" | "offer" | "hired" | "declined" | "withdrawn";
export type FormStatus = "missing" | "submitted" | "approved";
export type CheckStatus = "pending" | "confirmed" | "failed";
export type MoaStatus = "none" | "sent" | "signed";
export type FormKey = "resume" | "consent" | "medical" | "orientation" | "endorsement" | "training_plan";

export type School = {
  id: string;
  name: string;
  short_name: string;
  email_domain: string | null;
  term_label: string;
  required_hours: number;
};

export type Company = {
  id: string;
  name: string;
  city: string | null;
  about: string | null;
  logo: string;
  logo_bg: string;
  registration_type: "SEC" | "DTI";
  registration_no: string | null;
  work_email: string | null;
  phone: string | null;
  registration_check: CheckStatus;
  email_check: CheckStatus;
  phone_check: CheckStatus;
  verified_at: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  clerk_id: string | null;
  role: Role;
  full_name: string;
  email: string | null;
  phone: string | null;
  school_id: string | null;
  company_id: string | null;
  course: string | null;
  year_level: string | null;
  city: string | null;
  scope: string | null;
  status: "active" | "paused";
  last_active_at: string;
  created_at: string;
};

export type ResumeItem = {
  title: string;
  line: string;
  // Up to three supporting points Sync adds once the student gives details.
  bullets?: string[];
  when?: string;
  section?: "Leadership" | "Work" | "Volunteer" | "Activities";
  kind?: string;
};

export type ResumeData = {
  name: string;
  course: string;
  school?: string;
  email?: string;
  phone?: string;
  city?: string;
  language?: "English" | "Filipino" | "Taglish";
  availability?: string;
  projects: ResumeItem[];
  experience: ResumeItem[];
  skills: string[];
  prefs: { places: string[]; minAllowance: number };
};

export type Template = "classic" | "modern" | "compact";

export type ResumeRow = {
  student_id: string;
  data: ResumeData;
  template: Template;
  approved_at: string | null;
  updated_at: string;
};

export type Job = {
  id: string;
  company_id: string;
  title: string;
  city: string;
  mode: "On-site" | "Hybrid" | "Remote";
  allowance: number;
  schedule: string;
  dates: string;
  hours: number;
  teaser: string;
  about: string;
  duties: string[];
  needs: string[];
  perks: string[];
  programs: string[];
  skills: string[];
  openings: number;
  status: "open" | "closed";
  created_at: string;
};

export type JobWithCompany = Job & { company: Company };

export type Application = {
  id: string;
  job_id: string;
  student_id: string;
  status: AppStatus;
  viewed_at: string | null;
  interview_at: string | null;
  interview_where: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentForm = {
  student_id: string;
  form_key: FormKey;
  status: FormStatus;
  file_path: string | null;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  kind: string;
  created_at: string;
  read_at: string | null;
};

export type TimeLog = {
  id: string;
  student_id: string;
  company_id: string;
  work_date: string;
  hours: number;
  note: string;
  status: "pending" | "approved";
  created_at: string;
};

export type StudentOverview = {
  id: string;
  full_name: string;
  email: string | null;
  school_id: string | null;
  course: string | null;
  year_level: string | null;
  last_active_at: string;
  resume_approved_at: string | null;
  forms_done: number;
  hours: number;
  pending_logs: number;
  app_count: number;
  host_company_id: string | null;
  host_company: string | null;
  stage: "Signing up" | "Applying" | "Interning";
};

export type AuditEntry = {
  id: number;
  school_id: string;
  actor_name: string;
  action: string;
  created_at: string;
};

export type Invite = {
  id: string;
  email: string;
  role: Role;
  scope: string | null;
  created_at: string;
  accepted_at: string | null;
};

export const FORM_LABELS: Record<FormKey, string> = {
  resume: "Resume",
  consent: "Parent consent",
  medical: "Medical certificate",
  orientation: "Orientation",
  endorsement: "Endorsement letter",
  training_plan: "Training plan",
};

export const FORM_ORDER: FormKey[] = ["resume", "consent", "medical", "orientation", "endorsement", "training_plan"];

// Forms a student uploads; the school issues the endorsement, and the resume
// is approved in the app.
export const UPLOADABLE: FormKey[] = ["consent", "medical", "orientation", "training_plan"];
