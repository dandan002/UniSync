import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/shells";
import { db } from "@/lib/supabase/server";
import { getViewer, homeFor, SetupError } from "@/lib/viewer";

// After sign-in: create or claim the profile, then send people home.
export default async function Welcome({ searchParams }: PageProps<"/welcome">) {
  const sp = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  if (sp.as === "employer") {
    const supabase = await db();
    await supabase.rpc("ensure_profile", { p_account_type: "employer" });
  }

  let viewer;
  try {
    viewer = await getViewer();
  } catch (e) {
    if (e instanceof SetupError) return <SetupNotice />;
    throw e;
  }
  if (!viewer) redirect("/sign-in");

  const { profile } = viewer;
  if (profile.role === "student") {
    const { data } = await viewer.supabase.from("resumes").select("student_id").eq("student_id", profile.id).maybeSingle();
    redirect(data ? "/home" : "/start");
  }
  redirect(homeFor(profile, viewer.company));
}
