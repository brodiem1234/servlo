import type { createAdminClient } from "@/lib/supabase/admin";

export const FOUNDING_MEMBER_LIMIT = 50;
export const EARLY_ACCESS_PROMO_CODE = "EARLYACCESS";

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

export function normalizePromoCode(code: string | null | undefined) {
  const normalized = code?.trim().toUpperCase() ?? "";
  return normalized || null;
}

export function isEarlyAccessPromoCode(code: string | null | undefined) {
  return normalizePromoCode(code) === EARLY_ACCESS_PROMO_CODE;
}

export async function getFoundingMemberCount(admin: SupabaseAdminClient) {
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_founding_member", true);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function hasFoundingMemberCapacity(admin: SupabaseAdminClient) {
  return (await getFoundingMemberCount(admin)) < FOUNDING_MEMBER_LIMIT;
}
