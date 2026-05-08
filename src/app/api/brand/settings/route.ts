import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_FIELDS = [
  "brand_company_name",
  "brand_email_from_name",
  "brand_color_primary",
  "brand_phone",
  "brand_address",
  "brand_logo_url",
] as const;

/** GET /api/brand/settings — returns current brand settings for authenticated owner */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data } = await admin
      .from("businesses")
      .select(ALLOWED_FIELDS.join(", "))
      .eq("owner_id", user.id)
      .maybeSingle();

    return NextResponse.json({ brand: data ?? {} });
  } catch (err) {
    console.error("[brand/settings GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** POST /api/brand/settings — saves brand fields to businesses table */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Only allow known brand fields to be written
    const payload: Record<string, string | null> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        payload[field] = typeof body[field] === "string" && body[field].trim() !== ""
          ? body[field].trim()
          : null;
      }
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("businesses")
      .update(payload)
      .eq("owner_id", user.id);

    if (error) {
      console.error("[brand/settings POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[brand/settings POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
