export interface PublicSupabaseEnvironment {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}

export interface PublicSupabaseConfig {
  url: string;
  anonKey: string;
}

export function requireEnvironmentVariable(name: string, value?: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return normalized;
}

export function readPublicSupabaseConfig(
  environment: PublicSupabaseEnvironment
): PublicSupabaseConfig {
  const url = readSupabaseUrl(environment.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = requireEnvironmentVariable(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    environment.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return { url, anonKey };
}

export function readSupabaseUrl(value?: string): string {
  const url = requireEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL", value);

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid URL using HTTP or HTTPS."
    );
  }

  return url;
}
