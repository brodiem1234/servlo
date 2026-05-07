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

/**
 * Immediately upserts profiles + businesses rows right after auth.signUp() succeeds.
 * Uses service-role to bypass RLS — called from signup-form.tsx.
 * Non-fatal: logs errors but never throws so the signup flow can continue.
 */
export async function immediateOwnerUpsert(payload: OwnerSignupPayload): Promise<void> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[immediateOwnerUpsert] admin client unavailable", e);
    return;
  }

  const { userId, fullName, email, phone, businessName, abn, entityName, selectedIndustries, selectedPlan, selectedProducts } = payload;

  // Upsert profile
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
    }
  } catch (e) {
    console.error("[immediateOwnerUpsert] profiles upsert threw", e);
  }

  // Upsert business
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
    }
  } catch (e) {
    console.error("[immediateOwnerUpsert] businesses upsert threw", e);
  }
}
