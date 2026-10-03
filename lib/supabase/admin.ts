import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  readSupabaseUrl,
  requireEnvironmentVariable,
} from "./config";

/**
 * Privileged client for trusted API routes and persistence adapters only.
 * Never import this module from a Client Component.
 */
export function getAdminSupabase(): SupabaseClient {
  const url = readSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = requireEnvironmentVariable(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
