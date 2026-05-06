import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizeAccentColour, DEFAULT_ACCENT_HEX } from "@/lib/brand-accent";
import type { IndustrySlug } from "@/lib/industries";
import { isIndustrySlug, parseIndustryTagsJson } from "@/lib/industries";
import { bootstrapSignupProfiles } from "@/lib/signup/bootstrap-writes";
import { seedOwnerDemoData } from "@/lib/demo/seed-owner-demo";

type SetupBusinessBody = {
  userId?: string;
  businessName?: string;
  abn?: string;
  phone?: string;
  industries?: unknown;
  accentColour?: string;
  demoOnly?: boolean;
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

  const fullName = String(meta.name ?? "").trim() || email.split("@")[0];
  const businessName =
    typeof body.businessName === "string" ? body.businessName.trim() : String(meta.business_name ?? "").trim();
  const abn = typeof body.abn === "string" ? body.abn.trim() : String(meta.abn ?? "").trim();
  const phone =
    typeof body.phone === "string" ? body.phone.trim() : String(meta.phone_number ?? "").trim();

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
      full_name: fullName
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
      trial_end_date: trialEnd.toISOString(),
      subscription_status: "trialing",
      subscription_tier: "solo"
    })
    .eq("id", userId);

  if (trialReinforce.error) {
    console.error("[setup-business] trial dates reinforcement failed", trialReinforce.error);
  }

  const buildBusinessPayload = (accentHex: string) => ({
    user_id: userId,
    owner_id: userId,
    business_name: businessName || null,
    abn: abn || null,
    phone: phone || null,
    industries,
    accent_colour: accentHex
  });

  let bizRowId: string | null = null;
  let insertAttempt = await supabaseAdmin
    .from("businesses")
    .upsert(buildBusinessPayload(accent_colour), { onConflict: "user_id" })
    .select("id")
    .single();

  if (insertAttempt.error && accent_colour !== teal_fallback) {
    logBusinessInsertError("[setup-business] businesses upsert (chosen accent) failed — retrying teal", insertAttempt.error);
    insertAttempt = await supabaseAdmin
      .from("businesses")
      .upsert(buildBusinessPayload(teal_fallback), { onConflict: "user_id" })
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
          user_id: userId,
          owner_id: userId,
          accent_colour: teal_fallback
        },
        { onConflict: "user_id" }
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

  return NextResponse.json({
    success: true,
    businessId: bizRowId,
    demoSeeded: demo.ok,
    ...(demo.ok ? {} : { demoSeedError: demo.message ?? "Unknown demo seed error" })
  });
}
