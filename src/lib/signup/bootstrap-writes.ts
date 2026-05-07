import type { SupabaseClient } from "@supabase/supabase-js";
import { seedOwnerDemoData } from "@/lib/demo/seed-owner-demo";
import { normalizeAccentColour } from "@/lib/brand-accent";
import type { IndustrySlug } from "@/lib/industries";
import { businessesRowForOwner, BUSINESSES_UPSERT_ON_CONFLICT } from "@/lib/businesses";

export function describeSupabaseError(prefix: string, err: { message?: string; code?: string; details?: string }) {
  const bits = [prefix, err.code ? `(${err.code})` : null, err.message, err.details].filter(Boolean);
  return bits.join(" ").trim();
}

function logBusinessUpsertError(scope: string, err: unknown) {
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    console.error(scope, {
      message: o.message,
      code: o.code,
      details: o.details,
      hint: o.hint
    });
  } else {
    console.error(scope, err);
  }
}

/** Upsert owner business row (accent). Works with service role or a user JWT client (RLS). */
export async function upsertOwnerBusinessRow(
  sb: SupabaseClient,
  ownerUserId: string,
  accentColourRaw: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const accent_colour = normalizeAccentColour(accentColourRaw);
    const bizRes = await sb.from("businesses").upsert(businessesRowForOwner(ownerUserId, { accent_colour }), {
      onConflict: BUSINESSES_UPSERT_ON_CONFLICT
    });
    if (bizRes.error) {
      logBusinessUpsertError("[upsertOwnerBusinessRow] PostgREST error", bizRes.error);
      return {
        ok: false,
        message: describeSupabaseError("Business record setup failed:", bizRes.error)
      };
    }
    return { ok: true };
  } catch (e) {
    console.error("[upsertOwnerBusinessRow] threw", e);
    return {
      ok: false,
      message: e instanceof Error ? `Business record setup failed: ${e.message}` : "Business record setup failed."
    };
  }
}

/** Two attempts with 1500ms pause — signup flow only. Logs each failure in detail. */
export async function upsertOwnerBusinessRowWithRetry(
  sb: SupabaseClient,
  ownerUserId: string,
  accentColourRaw: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const first = await upsertOwnerBusinessRow(sb, ownerUserId, accentColourRaw);
  if (first.ok) return first;

  console.error("[signup/business] first upsert failed — retrying after 1500ms", {
    ownerUserId,
    message: first.message
  });
  await new Promise((r) => setTimeout(r, 1500));

  const second = await upsertOwnerBusinessRow(sb, ownerUserId, accentColourRaw);
  if (!second.ok) {
    console.error("[signup/business] second upsert failed", {
      ownerUserId,
      message: second.message
    });
  }
  return second;
}

export async function seedOwnerDemoNonFatal(admin: SupabaseClient, ownerUserId: string): Promise<void> {
  try {
    const seeded = await seedOwnerDemoData(admin, ownerUserId);
    if (!seeded.ok) {
      console.warn("[seedOwnerDemoNonFatal] demo seed failed (non-fatal)", seeded.message);
    }
  } catch (e) {
    console.warn("[seedOwnerDemoNonFatal] demo seed threw (non-fatal)", e);
  }
}

export type BootstrapSignupParams = {
  userId: string;
  email: string;
  businessName: string;
  abn: string;
  phoneNumber: string;
  /** Database `profiles.role` — contractors map to employee. */
  role: "owner" | "client" | "employee";
  industry_tags: IndustrySlug[];
  otherNote: string | null;
  accentColourRaw: string;
  full_name: string;
  planTier?: string;
  selectedProducts?: string;
};

/** Profiles only (service role). Used by signup before session-scoped business insert. */
export async function bootstrapSignupProfiles(
  admin: SupabaseClient,
  params: BootstrapSignupParams,
  trialStart: Date,
  trialEnd: Date
): Promise<
  | { ok: true; role: "owner" | "client" | "employee" }
  | { ok: false; step: "core_profile" | "extended_profile"; message: string }
> {
  const role = params.role;

  const corePayload: Record<string, unknown> = {
    id: params.userId,
    full_name: params.full_name || params.email.split("@")[0],
    role:
      role === "owner" ? ("owner" as const) : role === "employee" ? ("employee" as const) : ("client" as const),
    onboarding_completed: false,
  };
  if (role === "owner") {
    corePayload.plan_tier = params.planTier ?? "solo";
    corePayload.selected_products = params.selectedProducts ?? "core";
  }

  try {
    const coreRes = await admin.from("profiles").upsert(corePayload, { onConflict: "id" });
    if (coreRes.error) {
      return {
        ok: false,
        step: "core_profile",
        message: describeSupabaseError("Profile setup failed:", coreRes.error)
      };
    }
  } catch (e) {
    console.error("[bootstrapSignupProfiles] core profile threw", e);
    return {
      ok: false,
      step: "core_profile",
      message: e instanceof Error ? `Profile setup failed: ${e.message}` : "Profile setup failed."
    };
  }

  const extendedPayload: Record<string, unknown> = {
    email: params.email,
    phone: params.phoneNumber || null,
    trial_start: trialStart.toISOString(),
    trial_end: trialEnd.toISOString(),
    subscription_status: "trialing",
    subscription_tier: "solo"
  };

  if (role === "owner") {
    extendedPayload.industry_tags = params.industry_tags;
    extendedPayload.industry_other_note = params.otherNote;
  } else {
    extendedPayload.industry_tags = [];
    extendedPayload.industry_other_note = null;
  }

  try {
    const extRes = await admin.from("profiles").update(extendedPayload).eq("id", params.userId);
    if (extRes.error) {
      if (role === "owner") {
        return {
          ok: false,
          step: "extended_profile",
          message: describeSupabaseError("Trial and profile fields failed to save:", extRes.error)
        };
      }
      console.warn("[bootstrapSignupProfiles] extended profile update failed (non-fatal)", extRes.error);
    } else {
      // no-op: trial_end is canonical
    }
  } catch (e) {
    if (role === "owner") {
      console.error("[bootstrapSignupProfiles] extended profile threw", e);
      return {
        ok: false,
        step: "extended_profile",
        message:
          e instanceof Error ? `Trial and profile fields failed to save: ${e.message}` : "Trial setup failed."
      };
    }
    console.warn("[bootstrapSignupProfiles] extended profile threw (non-fatal)", e);
  }

  return { ok: true, role };
}

/** Full bootstrap via service role (onboarding retry / environments without signup session). */
export async function bootstrapSignupWrites(
  admin: SupabaseClient,
  params: BootstrapSignupParams,
  trialStart: Date,
  trialEnd: Date
): Promise<
  | { ok: true; role: "owner" | "client" | "employee" }
  | { ok: false; step: "core_profile" | "extended_profile" | "business"; message: string }
> {
  const profiles = await bootstrapSignupProfiles(admin, params, trialStart, trialEnd);
  if (!profiles.ok) {
    return profiles;
  }

  if (profiles.role === "owner") {
    const biz = await upsertOwnerBusinessRow(admin, params.userId, params.accentColourRaw);
    if (!biz.ok) {
      return { ok: false, step: "business", message: biz.message };
    }
    await seedOwnerDemoNonFatal(admin, params.userId);
  }

  return { ok: true, role: profiles.role };
}
