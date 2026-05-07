import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { PortalClient } from "./portal-client";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function ClientPortalPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, email, owner_id")
    .eq("portal_token", token)
    .maybeSingle();

  if (!client) return notFound();

  const [
    { data: jobs },
    { data: quotes },
    { data: invoices },
    { data: business },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, title, status, scheduled_date, address, suburb, notes"
      )
      .eq("client_id", client.id)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("quotes")
      .select("id, quote_number, total, status, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, status, due_date, stripe_payment_link")
      .eq("client_id", client.id)
      .order("due_date", { ascending: true }),
    supabase
      .from("businesses")
      .select("business_name, phone, email, accent_colour, google_review_url, logo_url")
      .eq("owner_id", client.owner_id)
      .maybeSingle(),
  ]);

  async function acceptQuoteAction(formData: FormData) {
    "use server";
    const quoteId = String(formData.get("quote_id") ?? "");
    const token = String(formData.get("token") ?? "");
    const sb = await createClient();
    const { data: tokenClient } = await sb
      .from("clients")
      .select("id")
      .eq("portal_token", token)
      .maybeSingle();
    if (!tokenClient) return;
    await sb
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", quoteId)
      .eq("client_id", tokenClient.id);
    revalidatePath(`/portal/${token}`);
  }

  async function declineQuoteAction(formData: FormData) {
    "use server";
    const quoteId = String(formData.get("quote_id") ?? "");
    const token = String(formData.get("token") ?? "");
    const sb = await createClient();
    const { data: tokenClient } = await sb
      .from("clients")
      .select("id")
      .eq("portal_token", token)
      .maybeSingle();
    if (!tokenClient) return;
    await sb
      .from("quotes")
      .update({ status: "declined" })
      .eq("id", quoteId)
      .eq("client_id", tokenClient.id);
    revalidatePath(`/portal/${token}`);
  }

  async function requestServiceAction(
    formData: FormData
  ): Promise<{ ok: boolean }> {
    "use server";
    const token = String(formData.get("token") ?? "");
    const sb = await createClient();
    const { data: tokenClient } = await sb
      .from("clients")
      .select("id, owner_id")
      .eq("portal_token", token)
      .maybeSingle();
    if (!tokenClient) return { ok: false };

    const admin = createAdminClient();
    const { error } = await admin.from("client_enquiries").insert({
      client_id: tokenClient.id,
      owner_id: tokenClient.owner_id,
      service_type: String(formData.get("service_type") ?? ""),
      description: String(formData.get("description") ?? ""),
      preferred_date: String(formData.get("preferred_date") ?? "") || null,
      urgency: String(formData.get("urgency") ?? "flexible"),
    });

    if (error) return { ok: false };
    return { ok: true };
  }

  return (
    <PortalClient
      client={{ id: client.id, full_name: client.full_name, email: client.email }}
      jobs={jobs ?? []}
      invoices={invoices ?? []}
      quotes={quotes ?? []}
      business={business ?? null}
      token={token}
      acceptQuoteAction={acceptQuoteAction}
      declineQuoteAction={declineQuoteAction}
      requestServiceAction={requestServiceAction}
    />
  );
}
