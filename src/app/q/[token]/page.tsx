import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicQuoteView } from "./public-quote-view";

export const dynamic = "force-dynamic";

/**
 * Public quote view — accessed by anyone with the secret token. Uses the
 * admin client to bypass RLS so unauthenticated visitors can view their quote.
 *
 * SECURITY:
 *  - Token must be >= 16 chars (cuts off brute-force enumeration).
 *  - `owner_id` is fetched internally to look up the business, but never
 *    returned to the client component.
 *  - Business projection is restricted to the visible columns only.
 */
export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Cheap enumeration defence — short tokens get 404'd before the DB hit.
  if (!token || token.length < 16) notFound();

  const supabase = createAdminClient();

  // Fetch quote — internally we still need owner_id to fetch the business,
  // but we strip it before passing to the client view.
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

  // Business — only the columns actually rendered on the public page.
  const { data: business } = await supabase
    .from("businesses")
    .select("business_name, abn, address, suburb, state, postcode, phone, email, accent_colour, logo_url")
    .eq("owner_id", quote.owner_id)
    .maybeSingle();

  // Strip owner_id and public_token before handing to the client.
  // The view component shouldn't have either — owner_id is internal,
  // public_token is already in the URL.
  const {
    owner_id: _ownerId,
    public_token: _publicToken,
    ...safeQuote
  } = quote as Record<string, unknown> & { owner_id: string; public_token: string };

  // Fetch line items
  const { data: items } = await supabase
    .from("quote_items")
    .select("id, description, quantity, unit_price, gst_applicable, sort_order")
    .eq("quote_id", quote.id)
    .order("sort_order", { ascending: true });

  return (
    <PublicQuoteView
      quote={safeQuote}
      business={(business ?? {}) as Record<string, unknown>}
      lineItems={(items ?? []) as Record<string, unknown>[]}
      token={token}
    />
  );
}
