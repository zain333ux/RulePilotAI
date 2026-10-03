import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readPublicSupabaseConfig } from "./config";

/**
 * Client-side Supabase helpers.
 * Safe for browser React components — uses anon key only.
 * Never import SUPABASE_SERVICE_ROLE_KEY or GEMINI_API_KEY here.
 */

export function isBrowserSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Creates a browser client using only public project credentials.
 * Throws a clear configuration error instead of using placeholder credentials.
 */
export function getBrowserSupabase(): SupabaseClient {
  const { url, anonKey } = readPublicSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return createClient(url, anonKey);
}
