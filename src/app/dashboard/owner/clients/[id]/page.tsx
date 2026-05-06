import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import ClientDetailTabs from "./client-detail-tabs";

type Props = {
  params: {
    id: string;
  };
};

export default async function OwnerClientDetailPage({ params }: Props) {
  const { user, enabled, supabase } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "client_management");

  const clientId = params.id;

  const [{ data: client }, { data: jobs }, { data: invoices }, { data: quotes }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, full_name, email, phone, company_name, address, suburb, state, postcode, notes, status, source, client_type")
      .eq("id", clientId)
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("id, title, status, scheduled_date")
      .eq("owner_id", user.id)
      .eq("client_id", clientId)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, amount, status, due_date")
      .eq("owner_id", user.id)
      .eq("client_id", clientId)
      .order("due_date", { ascending: false }),
    supabase
      .from("quotes")
      .select("id, quote_number, total, status, created_at")
      .eq("owner_id", user.id)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
  ]);

  if (!client) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Client not found</h1>
        <a href="/dashboard/owner/clients" className="text-sm text-[#3b82f6] hover:underline">
          Back to clients
        </a>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{client.full_name ?? "Client Profile"}</h1>
          <p className="text-sm text-slate-600">Client profile, jobs, invoices and quotes</p>
        </div>
        <a href="/dashboard/owner/clients" className="rounded border px-3 py-2 text-sm">
          Back to clients
        </a>
      </div>
      <ClientDetailTabs client={client} jobs={jobs ?? []} invoices={invoices ?? []} quotes={quotes ?? []} />
    </section>
  );
}

