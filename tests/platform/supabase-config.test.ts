import assert from "node:assert/strict";
import { test } from "node:test";
import { readPublicSupabaseConfig, requireEnvironmentVariable } from "../../lib/supabase/config";

test("public Supabase config rejects a missing project URL", () => {
  assert.throws(
    () =>
      readPublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key",
      }),
    /NEXT_PUBLIC_SUPABASE_URL/
  );
});

test("public Supabase config rejects a malformed project URL", () => {
  assert.throws(
    () =>
      readPublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key",
      }),
    /valid URL/
  );
});

test("public Supabase config returns validated browser-safe values", () => {
  assert.deepEqual(
    readPublicSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-key",
    }),
    {
      url: "https://example.supabase.co",
      anonKey: "public-key",
    }
  );
});

test("required server environment values reject blank strings", () => {
  assert.throws(
    () => requireEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", "   "),
    /SUPABASE_SERVICE_ROLE_KEY/
  );
});
