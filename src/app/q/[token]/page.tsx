import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicQuoteView } from "./public-quote-view";

export const dynamic = "force-dynamic";

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Fetch quote by public token — admin client bypasses RLS so unauthenticated visitors can view
  const { data: quote, error } = await supabase
    .from("quotes")
    .select(
      `id, quote_number, client_name, client_id, total, subtotal, notes, status,
       created_at, expiry_date, signed_at, signed_by_name, version, owner_id,
       public_token`
    )
    .eq("public_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !quote) notFound();

  // Fetch business details for the quote owner
  const { data: business } = await supabase
    .from("businesses")
    .select("business_name, abn, address, suburb, state, postcode, phone, email, accent_colour, logo_url")
    .eq("owner_id", quote.owner_id)
    .maybeSingle();

  // Fetch line items
  const { data: items } = await supabase
    .from("quote_items")
    .select("id, description, quantity, unit_price, gst_applicable, sort_order")
    .eq("quote_id", quote.id)
    .order("sort_order", { ascending: true });

  return (
    <PublicQuoteView
      quote={quote as Record<string, unknown>}
      business={(business ?? {}) as Record<string, unknown>}
      lineItems={(items ?? []) as Record<string, unknown>[]}
      token={token}
    />
  );
}
