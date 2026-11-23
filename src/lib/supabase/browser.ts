"use client";

import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";

// Browser client for uploads to Supabase Storage, authorized by Clerk.
export function useSupabase() {
  const { session } = useSession();
  return useMemo(
    () =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
        accessToken: async () => (await session?.getToken()) ?? null,
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    [session],
  );
}
