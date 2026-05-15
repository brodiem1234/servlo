import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import { revalidatePath } from "next/cache";
import ClientDetailTabs from "./client-detail-tabs";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OwnerClientDetailPage({ params }: Props) {
  const { id: clientId } = await params;
  const { user, enabled, supabase } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "client_management");

  let client = null;
  let jobs: Array<{ id: string; title: string | null; status: string | null; scheduled_date: string | null; materials_cost: number | null; labour_hours: number | null; hourly_rate: number | null }> = [];
  let invoices: Array<{ id: string; invoice_number: string | null; total: number | null; status: string | null; due_date: string | null; created_at: string | null }> = [];
  let quotes: Array<{ id: string; quote_number: string | null; total: number | null; status: string | null; created_at: string | null }> = [];

  try {
    const [clientResult, jobsResult, invoicesResult, quotesResult] = await Promise.all([
      supabase
        .from("clients")
        .select("id, full_name, email, phone, company_name, abn, address, suburb, state, postcode, notes, status, source, client_type")
        .eq("id", clientId)
        .eq("owner_id", user.id)
        .maybeSingle(),
      supabase
        .from("jobs")
        .select("id, title, status, scheduled_date, materials_cost, labour_hours, hourly_rate")
        .eq("owner_id", user.id)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("id, invoice_number, total, status, due_date, created_at")
        .eq("owner_id", user.id)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("quotes")
        .select("id, quote_number, total, status, created_at")
        .eq("owner_id", user.id)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
    ]);

    client = clientResult.data ?? null;
    jobs = jobsResult.data ?? [];
    invoices = invoicesResult.data ?? [];
    quotes = quotesResult.data ?? [];
  } catch {
    return (
      <section className="space-y-3 p-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Unable to load client</h1>
        <p className="text-sm text-[var(--text-secondary)]">There was a problem fetching client data. Please try refreshing.</p>
        <a href="/dashboard/owner/clients" className="text-sm text-[var(--accent-color)] hover:underline">
          Back to clients
        </a>
      </section>
    );
  }

  if (!client) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Client not found</h1>
        <a href="/dashboard/owner/clients" className="text-sm text-[var(--accent-color)] hover:underline">
          Back to clients
        </a>
      </section>
    );
  }

  // Compute stats
  const totalJobs = jobs.length;
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total ?? 0), 0);
  const totalPaid = invoices.filter((inv) => (inv.status ?? "").toLowerCase() === "paid").reduce((sum, inv) => sum + Number(inv.total ?? 0), 0);
  const outstanding = totalInvoiced - totalPaid;

  // Server actions
  async function updateNotesAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const { supabase: sb, user: u } = await requireOwnerWorkspaceFeatures();
    const cid = formData.get("client_id") as string;
    const notes = formData.get("notes") as string;
    const { error } = await sb
      .from("clients")
      .update({ notes })
      .eq("id", cid)
      .eq("owner_id", u.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath(`/dashboard/owner/clients/${cid}`);
    return { ok: true, message: "Notes saved" };
  }

  async function acceptQuoteAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const { supabase: sb, user: u } = await requireOwnerWorkspaceFeatures();
    const qid = formData.get("quote_id") as string;

    // Match the quotes/page.tsx behaviour: accepting a quote should also
    // auto-create the matching job (idempotently — don't create a duplicate
    // if one already exists for this quote).
    const { data: quote } = await sb
      .from("quotes")
      .select("id, quote_number, client_id, is_demo, notes")
      .eq("id", qid)
      .eq("owner_id", u.id)
      .maybeSingle();

    if (!quote) return { ok: false, message: "Quote not found" };
    if (quote.is_demo) {
      // Don't spawn real jobs from demo quotes.
      await sb.from("quotes").update({ status: "accepted" }).eq("id", qid).eq("owner_id", u.id);
      revalidatePath(`/dashboard/owner/clients/${clientId}`);
      return { ok: true, message: "Demo quote accepted" };
    }

    // Idempotency: don't create a second job if one already references this quote.
    const { data: existingJob } = await sb
      .from("jobs")
      .select("id")
      .eq("quote_id", quote.id)
      .eq("owner_id", u.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existingJob) {
      await sb.from("jobs").insert({
        owner_id: u.id,
        client_id: quote.client_id,
        title: quote.quote_number ?? "Quote Job",
        description: (quote as { notes?: string | null }).notes ?? "",
        status: "scheduled",
        priority: "normal",
        is_demo: false,
        quote_id: quote.id,
      });
    }

    const { error } = await sb
      .from("quotes")
      .update({ status: "accepted" })
      .eq("id", qid)
      .eq("owner_id", u.id);
    if (error) return { ok: false, message: error.message };

    revalidatePath(`/dashboard/owner/clients/${clientId}`);
    revalidatePath("/dashboard/owner/jobs");
    revalidatePath("/dashboard/owner/quotes");
    return { ok: true, message: "Quote accepted" };
  }

  async function declineQuoteAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const { supabase: sb, user: u } = await requireOwnerWorkspaceFeatures();
    const qid = formData.get("quote_id") as string;
    const { error } = await sb
      .from("quotes")
      .update({ status: "declined" })
      .eq("id", qid)
      .eq("owner_id", u.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath(`/dashboard/owner/clients/${clientId}`);
    return { ok: true, message: "Quote declined" };
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{client.full_name ?? "Client Profile"}</h1>
          <p className="text-sm text-[var(--text-secondary)]">Client profile, jobs, invoices and quotes</p>
        </div>
        <a href="/dashboard/owner/clients" className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition">
          Back to clients
        </a>
      </div>
      <ClientDetailTabs
        client={client}
        jobs={jobs}
        invoices={invoices}
        quotes={quotes}
        stats={{ totalJobs, totalInvoiced, totalPaid, outstanding }}
        updateNotesAction={updateNotesAction}
        acceptQuoteAction={acceptQuoteAction}
        declineQuoteAction={declineQuoteAction}
      />
    </section>
  );
}
