import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/sms";
import { formatCurrencyFromDollars } from "@/lib/format-au";

/**
 * POST /api/invoices/:id/quick-pay-sms
 * Sends an SMS with a direct payment link to the client.
 * Gracefully stubs if Twilio is not configured.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: invoiceId } = await params;

  // Fetch invoice
  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .select("id, invoice_number, total, due_date, client_id, status")
    .eq("id", invoiceId)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (invErr || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (!invoice.client_id) {
    return NextResponse.json({ error: "Invoice has no associated client" }, { status: 400 });
  }

  // Fetch client phone
  const { data: client } = await supabase
    .from("clients")
    .select("full_name, phone")
    .eq("id", invoice.client_id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!client?.phone) {
    return NextResponse.json({ error: "Client has no phone number on file" }, { status: 400 });
  }

  // Fetch business name
  const { data: business } = await supabase
    .from("businesses")
    .select("business_name")
    .eq("owner_id", user.id)
    .maybeSingle();

  const businessName = business?.business_name ?? "Your service provider";
  const clientName = client.full_name ?? "there";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";
  const payUrl = `${appUrl}/pay/${invoice.id}`;

  const amountFormatted = formatCurrencyFromDollars(invoice.total ?? 0);
  const invoiceNum = invoice.invoice_number ?? invoice.id.slice(0, 8).toUpperCase();

  const message = `Hi ${clientName}, your invoice #${invoiceNum} for ${amountFormatted} is ready. Pay now: ${payUrl} — ${businessName}`;

  const result = await sendSms(client.phone, message);
  const isStub = !result.ok || result.sid === "dev-noop";

  // Best-effort: log SMS in sms_messages
  const admin = createAdminClient();
  try {
    await admin.from("sms_messages").insert({
      owner_id: user.id,
      client_id: invoice.client_id,
      to_number: client.phone,
      from_number: process.env.TWILIO_FROM_NUMBER ?? null,
      message,
      direction: "outbound",
      status: result.ok ? "sent" : "failed",
      sent_at: new Date().toISOString(),
      is_stub: isStub,
      external_id: result.sid && result.sid !== "dev-noop" ? result.sid : null,
    });
  } catch {
    // sms_messages table not yet created — swallow
  }

  return NextResponse.json({ success: true, stub: isStub, pay_url: payUrl });
}
