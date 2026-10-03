import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readPublicSupabaseConfig } from "./config";

/**
 * Server-side client using the public anon key.
 * This client respects database privileges and RLS.
 */

export function isServerSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Use for server reads that should not bypass RLS.
 */
export function getServerSupabase(): SupabaseClient {
  const { url, anonKey } = readPublicSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
