import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase admin client.
 * MUST ONLY be called in API routes or Server Actions.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS — never expose to the browser.
 */

export function isServerSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Create an admin Supabase client.
 * Throws a clear error when credentials are missing — never fabricates placeholder keys.
 */
export function getAdminSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase server credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (server-only)."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
