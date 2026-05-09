import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// POST /api/quotes/[id]/token — Generate (or return existing) public share token
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Check ownership
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, public_token")
    .eq("id", id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  // Return existing token if set
  if (quote.public_token) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/q/${quote.public_token}`;
    return NextResponse.json({ token: quote.public_token, url });
  }

  // Generate new token
  const token = randomBytes(20).toString("hex");

  const { error } = await supabase
    .from("quotes")
    .update({ public_token: token })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Quotes table not ready" }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/q/${token}`;
  return NextResponse.json({ token, url });
}
