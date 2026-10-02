import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
 * Returns a browser Supabase client, or null when public env vars are missing.
 * Does not use placeholder credentials.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
