import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizeAccentColour, DEFAULT_ACCENT_HEX } from "@/lib/brand-accent";
import type { IndustrySlug } from "@/lib/industries";
import { isIndustrySlug, parseIndustryTagsJson } from "@/lib/industries";
import { bootstrapSignupProfiles } from "@/lib/signup/bootstrap-writes";
import { processReferral } from "@/lib/referral";
import { seedOwnerDemoData } from "@/lib/demo/seed-owner-demo";
import { sendEmail, welcomeOwnerEmailTemplate } from "@/lib/email";
import {
  buildInitialEnabledFeatures,
  isWorkspaceFeatureId,
  primaryIndustrySlug,
  serializeFeatureFlags,
  welcomeHighlightLabels,
  type WorkspaceFeatureId
} from "@/lib/workspace-features";
import { formatIndustryLabels } from "@/lib/industries";

type SetupBusinessBody = {
  userId?: string;
  fullName?: string;
  businessName?: string;
  abn?: string;
  phone?: string;
  industries?: unknown;
  accentColour?: string;
  demoOnly?: boolean;
  workspaceFeaturesEnabled?: unknown;
  selectedPlan?: string;
  selectedProducts?: string;
  entityName?: string;
  /** grow_referral code — marks the referral as signed_up when provided */
  referralCode?: string;
  /** promo code e.g. EARLYACCESS — marks user as founding member */
  promoCode?: string;
};

function jsonErr(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function logBusinessInsertError(scope: string, err: unknown) {
  if (err && typeof err === "object") {
    const e = err as { code?: string; message?: string; details?: string; hint?: string };
    console.error(scope, {
      code: e.code,
      message: e.message,
      details: e.details,
      hint: e.hint,
      fullError: err
    });
  } else {
    console.error(scope, err);
  }
}

/**
 * Validates the caller JWT only (not used for PostgREST). Database work uses `supabaseAdmin` below.
 */
async function verifyBearerMatchesUserId(
  bearerToken: string,
  expectedUserId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return { ok: false, message: "Server misconfiguration: missing Supabase URL or anon key." };
  }

  const verificationClient = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${bearerToken}`
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

function parseIndustriesField(raw: unknown): IndustrySlug[] {
  if (Array.isArray(raw)) {
    return parseIndustryTagsJson(JSON.stringify(raw.filter((x) => typeof x === "string")));
  }
  if (typeof raw === "string") {
    return parseIndustryTagsJson(raw);
  }
  return [];
}

export async function POST(request: Request) {
  let body: SetupBusinessBody;
  try {
    body = (await request.json()) as SetupBusinessBody;
  } catch {
    return jsonErr("Invalid JSON body.", 400);
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!userId) {
    return jsonErr("userId is required.", 400);
  }

  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
  if (!token) {
    return jsonErr("Authorization Bearer token is required.", 401);
  }

  const verified = await verifyBearerMatchesUserId(token, userId);
  if (!verified.ok) {
    return jsonErr(verified.message, 401);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[setup-business] missing URL or SUPABASE_SERVICE_ROLE_KEY");
    return jsonErr("Server misconfiguration: missing Supabase URL or service role key.", 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  if (body.demoOnly === true) {
    console.log("[setup-business] demoOnly: seed demo template rows for JWT user id (owner_id)", userId);
    const demo = await seedOwnerDemoData(supabaseAdmin, userId);
    return NextResponse.json(
      {
        success: demo.ok,
        demoSeeded: demo.ok,
        ...(demo.ok ? {} : { demoSeedError: demo.message ?? "Unknown demo seed error" })
      },
      { status: demo.ok ? 200 : 500 }
    );
  }

  // Duplicate ABN prevention — check before creating anything
  const cleanABN = (body.abn as string || '').replace(/\s/g, '');
  if (cleanABN) {
    const { data: existingBusiness } = await supabaseAdmin
      .from('businesses')
      .select('owner_id')
      .eq('abn', cleanABN)
      .neq('owner_id', userId)
      .single();
    if (existingBusiness) {
      return NextResponse.json(
        { error: 'This ABN is already registered with SERVLO. Please sign in to your existing account.' },
        { status: 409 }
      );
    }
  }

  const {
    data: authUserRes,
    error: authLookupErr
  } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (authLookupErr || !authUserRes?.user) {
    console.error("[setup-business] admin.getUserById failed", authLookupErr);
    return jsonErr(authLookupErr?.message ?? "Could not load auth user.", 404);
  }

  const authUser = authUserRes.user;
  const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const email = authUser.email ?? "";
  if (!email) {
    return jsonErr("Auth user has no email.", 422);
  }

  const fullName =
    (typeof body.fullName === "string" ? body.fullName.trim() : "") ||
    String(meta.name ?? "").trim() ||
    email.split("@")[0];
  const businessName =
    typeof body.businessName === "string" ? body.businessName.trim() : String(meta.business_name ?? "").trim();
  const abn = typeof body.abn === "string" ? body.abn.trim() : String(meta.abn ?? "").trim();
  const phone =
    typeof body.phone === "string" ? body.phone.trim() : String(meta.phone_number ?? "").trim();
  const entityName =
    typeof body.entityName === "string" ? body.entityName.trim() : null;
  const referralCode =
    typeof body.referralCode === "string" ? body.referralCode.trim() : null;
  const promoCode =
    typeof body.promoCode === "string" ? body.promoCode.trim().toUpperCase() : null;
  const isFoundingMember = promoCode === "EARLYACCESS";
  const planTier =
    typeof body.selectedPlan === "string" && body.selectedPlan.trim()
      ? body.selectedPlan.trim()
      : "solo";
  const selectedProducts =
    typeof body.selectedProducts === "string" && body.selectedProducts.trim()
      ? body.selectedProducts.trim()
      : "core";

  let industries = parseIndustriesField(body.industries);
  if (!industries.length) {
    const fallbackCsv = String(meta.industry_tags ?? "");
    industries = fallbackCsv
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is IndustrySlug => isIndustrySlug(s));
  }

  /** Accent only from request body (signup keeps colour in UI state until this insert). */
  const accent_colour = normalizeAccentColour(
    typeof body.accentColour === "string" && body.accentColour.trim()
      ? body.accentColour.trim()
      : DEFAULT_ACCENT_HEX
  );
  const teal_fallback = normalizeAccentColour(DEFAULT_ACCENT_HEX);

  const otherNote =
    industries.includes("other") ? String(meta.industry_other_note ?? "").trim() || null : null;

  const primaryIndustry = primaryIndustrySlug(industries.length ? industries : ["other"]);

  let featureFlagsPayload: Record<string, unknown> | undefined;
  if (Array.isArray(body.workspaceFeaturesEnabled)) {
    const ids = body.workspaceFeaturesEnabled.filter(
      (x): x is WorkspaceFeatureId => typeof x === "string" && isWorkspaceFeatureId(x)
    );
    featureFlagsPayload = serializeFeatureFlags(new Set(ids));
  } else {
    featureFlagsPayload = serializeFeatureFlags(
      new Set(buildInitialEnabledFeatures(primaryIndustry, new Set()))
    );
  }

  const trialStart = new Date();
  const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const profileBootstrap = await bootstrapSignupProfiles(
    supabaseAdmin,
    {
      userId,
      email,
      businessName,
      abn,
      phoneNumber: phone,
      role: "owner",
      industry_tags: industries,
      otherNote,
      // Unused by bootstrapSignupProfiles for DB writes; accent is saved only on businesses insert below.
      accentColourRaw: DEFAULT_ACCENT_HEX,
      full_name: fullName,
      planTier,
      selectedProducts
    },
    trialStart,
    trialEnd
  );

  if (!profileBootstrap.ok) {
    console.error("[setup-business] profile bootstrap failed", profileBootstrap.message);
    return jsonErr(profileBootstrap.message, 500);
  }

  const trialReinforce = await supabaseAdmin
    .from("profiles")
    .update({
      trial_start: trialStart.toISOString(),
      trial_end: trialEnd.toISOString(),
      subscription_status: "trialing",
      subscription_tier: planTier
    })
    .eq("id", userId);

  if (trialReinforce.error) {
    console.error("[setup-business] trial dates reinforcement failed", trialReinforce.error);
  }

  const buildBusinessPayload = (accentHex: string) => ({
    owner_id: userId,
    business_name: businessName || null,
    abn: abn ? abn.replace(/\s/g, '') : null,
    phone: phone || null,
    industries,
    entity_name: entityName || null,
    accent_colour: accentHex,
    ...(isFoundingMember ? {
      is_founding_member: true,
      founding_started_at: new Date().toISOString(),
      commitment_end_date: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    } : {}),
    ...(featureFlagsPayload ? { feature_flags: featureFlagsPayload } : {})
  });

  let bizRowId: string | null = null;
  let insertAttempt = await supabaseAdmin
    .from("businesses")
    .upsert(buildBusinessPayload(accent_colour), { onConflict: "owner_id" })
    .select("id")
    .single();

  if (insertAttempt.error && accent_colour !== teal_fallback) {
    logBusinessInsertError("[setup-business] businesses upsert (chosen accent) failed — retrying teal", insertAttempt.error);
    insertAttempt = await supabaseAdmin
      .from("businesses")
      .upsert(buildBusinessPayload(teal_fallback), { onConflict: "owner_id" })
      .select("id")
      .single();
  }

  if (!insertAttempt.error && insertAttempt.data?.id) {
    bizRowId = insertAttempt.data.id as string;
  } else if (insertAttempt.error) {
    logBusinessInsertError("[setup-business] businesses upsert (full) failed", insertAttempt.error);
    const minimal = await supabaseAdmin
      .from("businesses")
      .upsert(
        {
          owner_id: userId,
          accent_colour: accent_colour,
          ...(featureFlagsPayload ? { feature_flags: featureFlagsPayload } : {})
        },
        { onConflict: "owner_id" }
      )
      .select("id")
      .single();

    if (minimal.error || !minimal.data?.id) {
      if (minimal.error) {
        logBusinessInsertError("[setup-business] businesses upsert (minimal) failed", minimal.error);
      }
      const msg =
        minimal.error?.message ??
        insertAttempt.error?.message ??
        "Could not create business record.";
      return jsonErr(msg, 500);
    }

    bizRowId = minimal.data.id as string;
  }

  if (!bizRowId) {
    return jsonErr("Business saved but no id returned.", 500);
  }

  console.log("[setup-business] seeding demo data (service role)", { userId, owner_id: userId });

  const demo = await seedOwnerDemoData(supabaseAdmin, userId);
  if (!demo.ok) {
    console.error("[setup-business] demo seed FAILED:", demo.message ?? demo);
  } else {
    console.log("[setup-business] demo seed completed OK", { userId });
  }

  try {
    const welcomeFrom = process.env.RESEND_WELCOME_FROM ?? "SERVLO <hello@servlo.com.au>";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";
    await sendEmail(
      email,
      `Welcome to SERVLO${businessName ? `, ${businessName}` : ""}!`,
      welcomeOwnerEmailTemplate({
        ownerName: fullName,
        businessName: businessName || undefined,
        dashboardUrl: `${appUrl}/dashboard/owner`,
        supportUrl: `${appUrl}/contact`,
        industryLabel: formatIndustryLabels(industries.length ? industries : []),
        highlightFeatures: welcomeHighlightLabels(primaryIndustry)
      }),
      welcomeFrom
    );
  } catch (welcomeErr) {
    console.warn("[setup-business] welcome email failed (non-fatal)", welcomeErr);
  }

  // Process referral code if provided — try user_referrals first, then grow_referrals
  if (referralCode) {
    try {
      // Check if this is a user-to-user referral (profiles.referral_code)
      const { data: referrerProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode.toUpperCase())
        .maybeSingle();

      if (referrerProfile) {
        // Owner-to-owner referral — record in user_referrals
        const { data: authU } = await supabaseAdmin.auth.admin.getUserById(userId);
        const referredEmail = authU?.user?.email ?? "";
        if (referredEmail) {
          await processReferral(referredEmail, referralCode);
        }
      } else {
        // Client referral program — update grow_referrals row
        await supabaseAdmin
          .from("grow_referrals")
          .update({ status: "signed_up", referred_user_id: userId })
          .eq("referral_code", referralCode)
          .eq("status", "pending");
      }
    } catch (refErr) {
      console.warn("[setup-business] referral update failed (non-fatal)", refErr);
    }
  }

  return NextResponse.json({
    success: true,
    businessId: bizRowId,
    demoSeeded: demo.ok,
    ...(demo.ok ? {} : { demoSeedError: demo.message ?? "Unknown demo seed error" })
  });
}
