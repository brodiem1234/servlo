import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/quotes/[id]/sign — Accept quote (public, no auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const body = await req.json().catch(() => ({}));
  const { token, signed_by_name, signature_data } = body;

  if (!token || !signed_by_name?.trim()) {
    return NextResponse.json({ error: "token and signed_by_name required" }, { status: 400 });
  }

  // Verify token matches quote (also fetch owner info for notification)
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status, public_token, expiry_date, signed_at, quote_number, total, owner_id, client_name")
    .eq("id", id)
    .eq("public_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const status = String(quote.status ?? "").toLowerCase();
  if (status === "accepted") {
    return NextResponse.json({ error: "Quote already accepted" }, { status: 409 });
  }
  if (status === "declined" || status === "cancelled") {
    return NextResponse.json({ error: "Quote has been declined" }, { status: 409 });
  }
  if (quote.expiry_date && new Date(quote.expiry_date as string) < new Date()) {
    return NextResponse.json({ error: "Quote has expired" }, { status: 410 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { error } = await supabase
    .from("quotes")
    .update({
      status: "accepted",
      signed_at: new Date().toISOString(),
      signed_by_name: signed_by_name.trim(),
      signed_ip: ip,
      signature_data: signature_data ?? null,
    })
    .eq("id", id)
    .eq("public_token", token);

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Quotes table not ready" }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify owner via email (fire-and-forget)
  try {
    const ownerId = (quote as any).owner_id;
    if (ownerId) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", ownerId)
        .maybeSingle();
      if (ownerProfile?.email) {
        const quoteNum = (quote as any).quote_number ?? "Quote";
        const clientName = (quote as any).client_name ?? signed_by_name.trim();
        const total = (quote as any).total;
        const totalStr = total != null ? ` for $${Number(total).toFixed(2)}` : "";
        await sendEmail(
          ownerProfile.email,
          `✅ Quote ${quoteNum} accepted by ${clientName}`,
          `<p>Hi ${ownerProfile.full_name ?? "there"},</p>
<p><strong>${clientName}</strong> has accepted ${quoteNum}${totalStr}.</p>
<p>Log in to SERVLO to convert it to a job or invoice.</p>
<p style="margin-top:24px;color:#64748b;font-size:12px;">SERVLO — your field service management platform</p>`
        );
      }
    }
  } catch {
    // email failure is non-fatal
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/quotes/[id]/sign — Decline quote (public)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const body = await req.json().catch(() => ({}));
  const { token } = body;

  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status, public_token")
    .eq("id", id)
    .eq("public_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const { error } = await supabase
    .from("quotes")
    .update({ status: "declined" })
    .eq("id", id)
    .eq("public_token", token);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
