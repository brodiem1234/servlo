import { createBrowserClient } from "@supabase/ssr";

/** Singleton-style factory used by client hooks/forms (`createBrowserClient` per docs). */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
