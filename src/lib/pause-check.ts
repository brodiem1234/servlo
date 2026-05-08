/**
 * Pause check helper.
 *
 * TODO: Add pause check to all mutating API endpoints to prevent
 * writes while a subscription is paused.
 *
 * Currently applied to: create job, create invoice, create quote.
 */

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Returns true if the account is paused (subscription pause active).
 * Use this to guard mutating endpoints.
 */
export async function checkNotPaused(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("paused")
      .eq("id", userId)
      .single();
    return (data as { paused?: boolean } | null)?.paused === true;
  } catch {
    return false; // Fail open — better than blocking legitimate requests
  }
}
