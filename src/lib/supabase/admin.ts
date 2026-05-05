import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }

  // Supabase accepts legacy JWT service-role keys and newer sb_secret_* keys.
  const isSupportedKeyFormat =
    serviceRoleKey.startsWith("sb_secret_") || serviceRoleKey.startsWith("eyJ");

  if (!isSupportedKeyFormat) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY has an invalid format. Expected sb_secret_* or legacy JWT key."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    }
  });
}

