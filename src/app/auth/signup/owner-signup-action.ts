"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { IndustrySlug } from "@/lib/industries";
import { DEFAULT_ACCENT_HEX } from "@/lib/brand-accent";

export type OwnerSignupPayload = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  abn: string;
  entityName?: string | null;
  selectedIndustries: IndustrySlug[];
  selectedPlan: string;
  selectedProducts: string;
};

export type OwnerSignupResult = {
  ok: boolean;
  profileWritten: boolean;
  businessWritten: boolean;
  errors: string[];
};

/**
 * Immediately upserts profiles + businesses rows right after auth.signUp().
 * Uses service-role to bypass RLS.
 *
 * Returns a structured result so the caller (signup-form) can verify both
 * writes succeeded and decide whether to fall back to the /api/setup-business
 * pass or route the user to /onboarding/complete-profile for recovery.
 *
 * Never throws — errors are captured in the returned `errors` array.
 */
export async function immediateOwnerUpsert(payload: OwnerSignupPayload): Promise<OwnerSignupResult> {
  const result: OwnerSignupResult = {
    ok: false,
    profileWritten: false,
    businessWritten: false,
    errors: [],
  };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "admin client unavailable";
    console.error("[immediateOwnerUpsert] admin client unavailable", e);
    result.errors.push(`admin_client: ${msg}`);
    return result;
  }

  const {
    userId, fullName, email, phone, businessName, abn,
    entityName, selectedIndustries, selectedPlan, selectedProducts
  } = payload;

  // ── Profile ──────────────────────────────────────────────────────────────
  try {
    const { error } = await admin.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        email,
        phone,
        role: "owner",
        plan_tier: selectedPlan ?? "solo",
        selected_products: selectedProducts ?? "core",
        onboarding_completed: false,
      },
      { onConflict: "id" }
    );
    if (error) {
      console.error("[immediateOwnerUpsert] profiles upsert failed", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      result.errors.push(`profiles: ${error.message}`);
    } else {
      result.profileWritten = true;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown profile upsert error";
    console.error("[immediateOwnerUpsert] profiles upsert threw", e);
    result.errors.push(`profiles_threw: ${msg}`);
  }

  // ── Business ─────────────────────────────────────────────────────────────
  try {
    const { error } = await admin.from("businesses").upsert(
      {
        owner_id: userId,
        business_name: businessName,
        abn: abn.replace(/\s/g, ""),
        phone,
        entity_name: entityName ?? null,
        industries: selectedIndustries ?? [],
        accent_colour: DEFAULT_ACCENT_HEX,
        feature_flags: { enabled: [] },
      },
      { onConflict: "owner_id" }
    );
    if (error) {
      console.error("[immediateOwnerUpsert] businesses upsert failed", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      result.errors.push(`businesses: ${error.message}`);
    } else {
      result.businessWritten = true;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown business upsert error";
    console.error("[immediateOwnerUpsert] businesses upsert threw", e);
    result.errors.push(`businesses_threw: ${msg}`);
  }

  result.ok = result.profileWritten && result.businessWritten;
  return result;
}
