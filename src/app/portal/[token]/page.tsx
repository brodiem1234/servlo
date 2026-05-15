import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { PortalClient } from "./portal-client";
import { getBusinessBrand } from "@/lib/business-brand";

type Props = {
  params: Promise<{ token: string }>;
};

/**
 * Client portal page — accessed by clients with a secret token. They're not
 * authenticated, so we use the admin client to bypass RLS (mirroring the
 * /q/[token] and /book/[slug] pattern). Previously used the cookie-auth
 * client, which silently 404'd because RLS rejected the lookup.
 */
export default async function ClientPortalPage({ params }: Props) {
  const { token } = await params;

  // Enumeration defence.
  if (!token || token.length < 16) return notFound();

  const admin = createAdminClient();

  const { data: client } = await admin
    .from("clients")
    .select("id, full_name, email, owner_id")
    .eq("portal_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (!client) return notFound();

  const [
    { data: jobs },
    { data: quotes },
    { data: invoices },
    { data: business },
    brand,
  ] = await Promise.all([
    admin
      .from("jobs")
      .select(
        "id, title, status, scheduled_date, address, suburb, notes"
      )
      .eq("client_id", client.id)
      .order("scheduled_date", { ascending: false }),
    admin
      .from("quotes")
      .select("id, quote_number, total, status, created_at, public_token, expiry_date")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false }),
    admin
      .from("invoices")
      .select("id, invoice_number, total, status, due_date, stripe_payment_link")
      .eq("client_id", client.id)
      .order("due_date", { ascending: true }),
    admin
      .from("businesses")
      .select("business_name, phone, email, accent_colour, google_review_url, logo_url")
      .eq("owner_id", client.owner_id)
      .maybeSingle(),
    getBusinessBrand(client.owner_id),
  ]);

  async function acceptQuoteAction(formData: FormData) {
    "use server";
    const quoteId = String(formData.get("quote_id") ?? "");
    const tokenInner = String(formData.get("token") ?? "");
    const sb = createAdminClient();
    const { data: tokenClient } = await sb
      .from("clients")
      .select("id")
      .eq("portal_token", tokenInner)
      .is("deleted_at", null)
      .maybeSingle();
    if (!tokenClient) return;
    await sb
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", quoteId)
      .eq("client_id", tokenClient.id);
    revalidatePath(`/portal/${tokenInner}`);
  }

  async function declineQuoteAction(formData: FormData) {
    "use server";
    const quoteId = String(formData.get("quote_id") ?? "");
    const tokenInner = String(formData.get("token") ?? "");
    const sb = createAdminClient();
    const { data: tokenClient } = await sb
      .from("clients")
      .select("id")
      .eq("portal_token", tokenInner)
      .is("deleted_at", null)
      .maybeSingle();
    if (!tokenClient) return;
    await sb
      .from("quotes")
      .update({ status: "declined" })
      .eq("id", quoteId)
      .eq("client_id", tokenClient.id);
    revalidatePath(`/portal/${tokenInner}`);
  }

  async function requestServiceAction(
    formData: FormData
  ): Promise<{ ok: boolean }> {
    "use server";
    const tokenInner = String(formData.get("token") ?? "");
    const sb = createAdminClient();
    const { data: tokenClient } = await sb
      .from("clients")
      .select("id, owner_id")
      .eq("portal_token", tokenInner)
      .is("deleted_at", null)
      .maybeSingle();
    if (!tokenClient) return { ok: false };

    const { error } = await sb.from("client_enquiries").insert({
      client_id: tokenClient.id,
      owner_id: tokenClient.owner_id,
      service_type: String(formData.get("service_type") ?? ""),
      description: String(formData.get("description") ?? ""),
      preferred_date: String(formData.get("preferred_date") ?? "") || null,
      urgency: String(formData.get("urgency") ?? "flexible"),
    });

    if (error) {
      console.error("[portal] client_enquiries insert failed:", error);
      return { ok: false };
    }
    return { ok: true };
  }

  // Merge brand settings over business defaults
  const mergedBusiness = business
    ? {
        ...business,
        business_name: brand.businessName || business.business_name,
        accent_colour: brand.colorPrimary || business.accent_colour,
        logo_url: brand.logoUrl || (business as { logo_url?: string | null }).logo_url,
        phone: brand.phone || business.phone,
      }
    : null;

  return (
    <PortalClient
      client={{ id: client.id, full_name: client.full_name, email: client.email }}
      jobs={jobs ?? []}
      invoices={invoices ?? []}
      quotes={quotes ?? []}
      business={mergedBusiness}
      token={token}
      acceptQuoteAction={acceptQuoteAction}
      declineQuoteAction={declineQuoteAction}
      requestServiceAction={requestServiceAction}
    />
  );
}
