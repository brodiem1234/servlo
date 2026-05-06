import type { SupabaseClient } from "@supabase/supabase-js";
import { seedOwnerDemoData } from "@/lib/demo/seed-owner-demo";
import { normalizeAccentColour } from "@/lib/brand-accent";
import type { IndustrySlug } from "@/lib/industries";

export function describeSupabaseError(prefix: string, err: { message?: string; code?: string; details?: string }) {
  const bits = [prefix, err.code ? `(${err.code})` : null, err.message, err.details].filter(Boolean);
  return bits.join(" ").trim();
}

export type BootstrapSignupParams = {
  userId: string;
  email: string;
  businessName: string;
  abn: string;
  phoneNumber: string;
  role: "owner" | "client";
  industry_tags: IndustrySlug[];
  otherNote: string | null;
  accentColourRaw: string;
  full_name: string;
};

export async function bootstrapSignupWrites(
  admin: SupabaseClient,
  params: BootstrapSignupParams,
  trialStart: Date,
  trialEnd: Date
): Promise<
  { ok: true; role: "owner" | "client" } | { ok: false; step: "core_profile" | "business"; message: string }
> {
  const role = params.role;

  const corePayload = {
    id: params.userId,
    full_name: params.full_name || params.email.split("@")[0],
    role: role === "owner" ? ("owner" as const) : ("client" as const)
  };

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
    console.error("[bootstrapSignupWrites] core profile threw", e);
    return {
      ok: false,
      step: "core_profile",
      message: e instanceof Error ? `Profile setup failed: ${e.message}` : "Profile setup failed."
    };
  }

  const extendedPayload: Record<string, unknown> = {
    email: params.email,
    phone: params.phoneNumber || null,
    business_name: params.businessName || null,
    abn: params.abn || null,
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
      console.warn("[bootstrapSignupWrites] extended profile update failed (non-fatal)", extRes.error);
    }
  } catch (e) {
    console.warn("[bootstrapSignupWrites] extended profile threw (non-fatal)", e);
  }

  if (role === "owner") {
    try {
      const accent_colour = normalizeAccentColour(params.accentColourRaw);
      const bizRes = await admin.from("businesses").upsert(
        { owner_id: params.userId, accent_colour },
        { onConflict: "owner_id" }
      );
      if (bizRes.error) {
        console.error("[bootstrapSignupWrites] businesses upsert failed", bizRes.error);
        return {
          ok: false,
          step: "business",
          message: describeSupabaseError("Business record setup failed:", bizRes.error)
        };
      }
    } catch (e) {
      console.error("[bootstrapSignupWrites] businesses upsert threw", e);
      return {
        ok: false,
        step: "business",
        message:
          e instanceof Error ? `Business record setup failed: ${e.message}` : "Business record setup failed."
      };
    }

    try {
      const seeded = await seedOwnerDemoData(admin, params.userId);
      if (!seeded.ok) {
        console.warn("[bootstrapSignupWrites] demo seed failed (non-fatal)", seeded.message);
      }
    } catch (e) {
      console.warn("[bootstrapSignupWrites] demo seed threw (non-fatal)", e);
    }
  }

  return { ok: true, role };
}
