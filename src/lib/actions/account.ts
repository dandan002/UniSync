"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { DELETE_PHRASE } from "@/lib/account";
import type { Result } from "@/lib/actions/student";
import { getViewer } from "@/lib/viewer";

function message(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

// Start over: removes the resume and resets its approval. The account,
// applications and forms stay.
export async function deleteResume(): Promise<Result> {
  try {
    const viewer = await getViewer();
    if (!viewer) return { ok: false, error: "Sign in first." };
    if (viewer.profile.role !== "student") return { ok: false, error: "Only students have a resume to delete." };
    const res = await viewer.supabase.rpc("delete_my_resume");
    if (res.error) return { ok: false, error: res.error.message };
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}

// Deletes everything: uploaded forms, the profile and all rows that hang off
// it (in the database, as the signed-in user), then the Clerk login. Demo
// personas are refused here and again in the database.
export async function deleteAccount(phrase: string): Promise<Result> {
  try {
    if (phrase.trim().toUpperCase() !== DELETE_PHRASE) return { ok: false, error: `Type ${DELETE_PHRASE} to confirm.` };
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Sign in first." };
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    if (user.externalId?.startsWith("demo-")) return { ok: false, error: "Demo accounts can't be deleted." };

    const viewer = await getViewer();
    // Signed in but no profile: the data was deleted on an earlier try and
    // only the login is left.
    if (!viewer) {
      await clerk.users.deleteUser(userId);
      return { ok: true, data: undefined };
    }
    const { profile, supabase, clerkId } = viewer;
    if (profile.demo) return { ok: false, error: "Demo accounts can't be deleted." };

    // Files first: once the profile is gone, nobody can reach them to clean up.
    if (profile.role === "student") {
      const listed = await supabase.storage.from("forms").list(profile.id, { limit: 1000 });
      if (listed.error) throw new Error("Couldn't remove your uploaded forms. Try again.");
      const paths = (listed.data ?? []).filter((f) => f.name && f.name !== ".emptyFolderPlaceholder").map((f) => `${profile.id}/${f.name}`);
      if (paths.length) {
        const removed = await supabase.storage.from("forms").remove(paths);
        if (removed.error) throw new Error("Couldn't remove your uploaded forms. Try again.");
      }
    }

    const res = await supabase.rpc("delete_my_account");
    if (res.error) return { ok: false, error: res.error.message };

    try {
      await clerk.users.deleteUser(clerkId);
    } catch (e) {
      console.error("deleteAccount: Clerk user not deleted", e);
      return { ok: false, error: "Your data is deleted, but we couldn't close your login. Try again to finish." };
    }
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: message(e) };
  }
}
