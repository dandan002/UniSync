import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// A Supabase client that sends the signed-in user's Clerk session token.
// Supabase verifies it (third-party auth) and row-level security does the rest.
export async function db(): Promise<SupabaseClient> {
  const { getToken } = await auth();
  return createClient(url, key, {
    accessToken: async () => (await getToken()) ?? null,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
