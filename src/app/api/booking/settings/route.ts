import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/booking/settings
 * Returns the authenticated owner's booking settings.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .select("booking_slug, booking_enabled, booking_service_types")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data ?? null });
}

const ALLOWED_FIELDS = ["booking_slug", "booking_enabled", "booking_service_types"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

/**
 * POST /api/booking/settings
 * Updates booking settings for the authenticated owner.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const updates: Partial<Record<AllowedField, unknown>> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  // Validate slug uniqueness if changing it
  if (updates.booking_slug) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("businesses")
      .select("owner_id")
      .eq("booking_slug", updates.booking_slug as string)
      .maybeSingle();
    if (existing && existing.owner_id !== user.id) {
      return NextResponse.json({ error: "That booking URL is already taken. Please choose another." }, { status: 409 });
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("businesses")
    .update(updates)
    .eq("owner_id", user.id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That booking URL is already taken. Please choose another." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
