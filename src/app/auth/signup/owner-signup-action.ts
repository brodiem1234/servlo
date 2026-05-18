"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { IndustrySlug } from "@/lib/industries";
import { DEFAULT_ACCENT_HEX } from "@/lib/brand-accent";

export type OwnerSignupPayload = {
  accessToken: string;
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

async function verifyAccessTokenMatchesUserId(
  accessToken: string,
  expectedUserId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return { ok: false, message: "Server misconfiguration: missing Supabase URL or anon key." };
  }

  const verificationClient = createSupabaseClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });

  const {
    data: { user },
    error
  } = await verificationClient.auth.getUser();

  if (error || !user?.id) {
    return { ok: false, message: error?.message ?? "Invalid or expired session." };
  }

  if (user.id !== expectedUserId) {
    return { ok: false, message: "Token does not match user." };
  }

  return { ok: true };
}

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

  const {
    accessToken, userId, fullName, email, phone, businessName, abn,
    entityName, selectedIndustries, selectedPlan, selectedProducts
  } = payload;

  const verified = await verifyAccessTokenMatchesUserId(accessToken, userId);
  if (!verified.ok) {
    console.error("[immediateOwnerUpsert] auth verification failed", verified.message);
    result.errors.push(`auth: ${verified.message}`);
    return result;
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "admin client unavailable";
    console.error("[immediateOwnerUpsert] admin client unavailable", e);
    result.errors.push(`admin_client: ${msg}`);
    return result;
  }

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
