import type { Session, SupabaseClient } from "@supabase/supabase-js";

export type WaitForSessionOptions = {
  maxWaitMs?: number;
  intervalMs?: number;
};

/**
 * Ensures cookie-backed session exists after signUp (SSR). Prefer auth.signUp() session when present.
 */
export async function waitForSessionAfterSignUp(
  supabase: SupabaseClient,
  initialSession: Session | null,
  opts: WaitForSessionOptions = {}
): Promise<Session | null> {
  const maxWaitMs = opts.maxWaitMs ?? 12_000;
  const intervalMs = opts.intervalMs ?? 350;

  if (initialSession?.access_token && initialSession.refresh_token) {
    const { error: setErr } = await supabase.auth.setSession({
      access_token: initialSession.access_token,
      refresh_token: initialSession.refresh_token
    });
    if (setErr) {
      console.warn("[signup] setSession after signUp failed (will poll getSession)", setErr.message);
    }
    const { data: afterSet } = await supabase.auth.getSession();
    if (afterSet.session?.access_token) {
      console.info("[signup] session ready immediately after setSession");
      return afterSet.session;
    }
  }

  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("[signup] getSession while waiting", error.message);
    }
    if (data.session?.access_token) {
      console.info("[signup] session available after polling");
      return data.session;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  console.warn("[signup] no session after waiting", { maxWaitMs });
  return null;
}
