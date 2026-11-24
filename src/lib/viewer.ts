import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/supabase/server";
import type { Company, Profile, Role, School } from "@/lib/types";

export type Viewer = {
  clerkId: string;
  profile: Profile;
  school: School | null;
  company: Company | null;
  supabase: Awaited<ReturnType<typeof db>>;
};

export class SetupError extends Error {}

// Signed-in user plus their profile. Creates or claims the profile on first
// visit. Null when signed out or the account was just deleted. Memoized per
// request.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = await db();

  const ensured = await supabase.rpc("ensure_profile");
  if (ensured.error) {
    // Deleted moments ago: the Clerk token outlives the account by up to a
    // minute. Treat it as signed out.
    if (ensured.error.hint === "account_deleted") return null;
    // A bad or unrecognized token means Supabase doesn't trust Clerk yet.
    const msg = `${ensured.error.code ?? ""} ${ensured.error.message}`;
    if (/JWS|JWT|jwt|PGRST301|401|third.party|No suitable key/i.test(msg)) {
      throw new SetupError("Supabase is not accepting Clerk sign-ins yet.");
    }
    throw new Error(ensured.error.message);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*, school:schools(*), company:companies!profiles_company_id_fkey(*)")
    .eq("clerk_id", userId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Profile not found.");

  const { school, company, ...profile } = data as Profile & { school: School | null; company: Company | null };
  return { clerkId: userId, profile, school, company, supabase };
});

export function homeFor(profile: Profile, company?: Company | null): string {
  switch (profile.role) {
    case "student":
      return "/home";
    case "coordinator":
    case "admin":
      return profile.school_id ? "/school" : "/sign-in?error=no-school";
    case "supervisor":
      return profile.company_id || company ? "/employer" : "/register";
  }
}

// Page guard: signed in with one of these roles, or sent where they belong.
export async function requireRole(roles: Role[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!roles.includes(viewer.profile.role)) redirect(homeFor(viewer.profile, viewer.company));
  return viewer;
}
