/**
 * AI usage caps, logging, and rate limiting per plan tier.
 *
 * NOTE: Install @upstash/ratelimit for production rate limiting.
 * Currently using Supabase-based per-minute check as a fallback.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface AIUsageStats {
  used: number;
  limit: number;
  plan: string;
  resetDate: Date;
  allowed: boolean;
  isSoftCap: boolean;
}

/** Returns the first day of next calendar month (UTC). */
function nextMonthReset(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/** Returns ISO string for the first day of the current calendar month (UTC). */
function startOfCurrentMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * Check whether the user is allowed to make an AI call.
 * Compares their current-month usage against their plan limit.
 */
export async function checkAILimit(userId: string): Promise<AIUsageStats> {
  const admin = createAdminClient();
  const resetDate = nextMonthReset();
  const monthStart = startOfCurrentMonth();

  // Fetch plan and AI limit in parallel
  const [profileResult, countResult] = await Promise.all([
    admin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single(),
    admin
      .from("ai_usage_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart),
  ]);

  const plan: string = (profileResult.data as { plan?: string } | null)?.plan ?? "free";
  const used: number = countResult.count ?? 0;

  // Look up the limit for this plan
  const limitResult = await admin
    .from("plan_ai_limits")
    .select("monthly_limit, is_soft_cap")
    .eq("plan", plan)
    .single();

  const monthlyLimit: number = (limitResult.data as { monthly_limit?: number } | null)?.monthly_limit ?? 0;
  const isSoftCap: boolean = (limitResult.data as { is_soft_cap?: boolean } | null)?.is_soft_cap ?? false;

  const allowed = monthlyLimit === 0 ? false : isSoftCap || used < monthlyLimit;

  return { used, limit: monthlyLimit, plan, resetDate, allowed, isSoftCap };
}

/**
 * Log an AI call after it completes.
 * Uses admin client to bypass RLS — call only from server-side code.
 */
export async function logAICall(
  userId: string,
  businessId: string | null,
  endpoint: string,
  model: string,
  tokens: { prompt: number; completion: number },
  costCents: number
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("ai_usage_log").insert({
      user_id: userId,
      business_id: businessId,
      endpoint,
      model,
      prompt_tokens: tokens.prompt,
      completion_tokens: tokens.completion,
      cost_aud_cents: costCents,
    });
  } catch (err) {
    console.error("[ai-limits] logAICall error:", err);
  }
}

/**
 * Returns usage stats for display in the UI (e.g. AI usage meter).
 */
export async function getUsageStats(userId: string): Promise<AIUsageStats> {
  return checkAILimit(userId);
}

/**
 * Simple per-minute rate-limit check using Supabase.
 * Prevents burst abuse. Returns true if under the limit (10 calls/min).
 *
 * TODO: Replace with @upstash/ratelimit for production-grade rate limiting.
 */
export async function checkPerMinuteRateLimit(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count } = await admin
      .from("ai_usage_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneMinuteAgo);
    return (count ?? 0) < 10;
  } catch {
    return true; // Fail open — better than blocking legitimate requests
  }
}
