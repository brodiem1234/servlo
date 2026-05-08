import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateOwnerWorkspaceRoutes } from "@/lib/dashboard/revalidate-owner";
import OwnerClientsView, { type ClientMetric, type SortKey } from "./owner-clients-view";
import { portalShareEmailTemplate, sendEmail } from "@/lib/email";
import FirstVisitBanner from "@/components/dashboard/first-visit-banner";

export const dynamic = "force-dynamic";

type ClientsPageProps = {
  searchParams?: {
    view?: string;
    sort?: string;
    client_type?: string;
  };
};

type ClientActionResult = {
  ok: boolean;
  message?: string;
};

function formatDbError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}) {
  return [
    error.code ? `code=${error.code}` : null,
    error.message ? `message=${error.message}` : null,
    error.details ? `details=${error.details}` : null,
    error.hint ? `hint=${error.hint}` : null
  ]
    .filter(Boolean)
    .join(" | ");
}

/** Legacy ?sort=created_at|full_name → new SortKey */
function parseSort(raw: string | undefined): SortKey {
  if (raw === "newest" || raw === "oldest" || raw === "name_asc" || raw === "name_desc" || raw === "most_jobs") {
    return raw;
  }
  if (raw === "created_at") return "newest";
  if (raw === "full_name") return "name_asc";
  return "name_asc";
}

function parseClientTypeTab(raw: string | undefined): "all" | "customer" | "supplier" | "lead" {
  if (raw === "customer" || raw === "supplier" || raw === "lead") return raw;
  return "all";
}

async function ensureOwnerProfileExists(
  sb: Awaited<ReturnType<typeof createClient>>,
  owner: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  }
) {
  const fullName =
    (owner.user_metadata?.full_name as string | undefined) ??
    (owner.user_metadata?.name as string | undefined) ??
    "";

  const { data: idProfile } = await sb.from("profiles").select("id").eq("id", owner.id).maybeSingle();
  if (idProfile?.id) return idProfile.id;

  if (owner.email) {
    const { data: emailProfile } = await sb
      .from("profiles")
      .select("id")
      .eq("email", owner.email)
      .maybeSingle();
    if (emailProfile?.id) return emailProfile.id;
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").upsert(
      {
        id: owner.id,
        email: owner.email ?? "",
        full_name: fullName,
        role: "owner"
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("ensureOwnerProfileExists admin upsert failed", {
        code: error.code,
        message: error.message,
        ownerId: owner.id
      });
    } else {
      return owner.id;
    }
  } catch (error) {
    console.error("ensureOwnerProfileExists admin client error", { ownerId: owner.id, error });
  }

  const { error: fallbackError } = await sb.from("profiles").upsert(
    {
      id: owner.id,
      email: owner.email ?? "",
      full_name: fullName,
      role: "owner"
    },
    { onConflict: "id" }
  );

  if (fallbackError) {
    console.error("ensureOwnerProfileExists fallback upsert failed", {
      code: fallbackError.code,
      message: fallbackError.message,
      ownerId: owner.id
    });
  }

  return owner.id;
}

export default async function OwnerClientsPage({ searchParams }: ClientsPageProps) {
  const { user, enabled, supabase } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "client_management");

  const ownerId = user.id;
  const view = searchParams?.view === "list" ? "list" : "card";
  const sortKey = parseSort(searchParams?.sort);
  const clientTypeTab = parseClientTypeTab(searchParams?.client_type);

  let clientsQuery = supabase
    .from("clients")
    .select(
      "id, owner_id, full_name, email, phone, company_name, abn, address, suburb, state, postcode, notes, status, source, portal_token, created_at, is_demo, client_type"
    )
    .eq("owner_id", ownerId)
    .is("deleted_at", null);

  if (sortKey === "newest") {
    clientsQuery = clientsQuery.order("created_at", { ascending: false });
  } else if (sortKey === "oldest") {
    clientsQuery = clientsQuery.order("created_at", { ascending: true });
  } else if (sortKey === "name_desc") {
    clientsQuery = clientsQuery.order("full_name", { ascending: false });
  } else {
    clientsQuery = clientsQuery.order("full_name", { ascending: true });
  }

  const primaryClientsQuery = await clientsQuery;

  console.log("Fetching clients for owner:", ownerId);
  console.log("Raw results:", JSON.stringify(primaryClientsQuery.data ?? []));
  console.log("[clients-page] owner_id (= Supabase auth user id)", ownerId);
  console.log("[clients-page] Supabase SELECT error", primaryClientsQuery.error ?? null);
  console.log(
    "[clients-page] Supabase SELECT raw rows (full array)",
    JSON.stringify(primaryClientsQuery.data ?? [], null, 2)
  );

  let clients:
    | Array<{
        id: string;
        owner_id?: string | null;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        company_name: string | null;
        abn: string | null;
        address: string | null;
        suburb: string | null;
        state: string | null;
        postcode: string | null;
        notes: string | null;
        status?: string | null;
        source?: string | null;
        portal_token?: string | null;
        created_at: string | null;
        is_demo?: boolean | null;
        client_type?: string | null;
      }>
    | null = null;

  if (primaryClientsQuery.error) {
    console.error("[clients-page] clients query failed", primaryClientsQuery.error);
    clients = [];
  } else {
    clients = primaryClientsQuery.data ?? [];
  }

  console.log("[clients-page] clients after query handling (full array, includes demo + real)", JSON.stringify(clients ?? [], null, 2));

  /** All rows where owner_id = auth uid(), including `is_demo: true`. */
  const clientsBase = clients ?? [];

  const clientIds = clientsBase.map((client) => client.id);
  const [{ data: jobs }, { data: invoices }] = await Promise.all([
    clientIds.length
      ? supabase
          .from("jobs")
          .select("id, client_id, scheduled_date")
          .in("client_id", clientIds)
          .eq("owner_id", ownerId)
      : Promise.resolve({ data: [] as Array<{ id: string; client_id: string | null; scheduled_date: string | null }> }),
    clientIds.length
          ? supabase
              .from("invoices")
              .select("id, client_id, total")
              .in("client_id", clientIds)
              .eq("owner_id", ownerId)
      : Promise.resolve({ data: [] as Array<{ id: string; client_id: string | null; total: number | null }> })
  ]);

  const metricsByClient = new Map<string, ClientMetric>();
  for (const clientId of clientIds) {
    metricsByClient.set(clientId, { totalJobs: 0, totalInvoiced: 0, lastJobDate: null });
  }
  for (const job of jobs ?? []) {
    if (!job.client_id) continue;
    const metric = metricsByClient.get(job.client_id);
    if (!metric) continue;
    metric.totalJobs += 1;
    if (job.scheduled_date && (!metric.lastJobDate || job.scheduled_date > metric.lastJobDate)) {
      metric.lastJobDate = job.scheduled_date;
    }
  }
  for (const invoice of invoices ?? []) {
    if (!invoice.client_id) continue;
    const metric = metricsByClient.get(invoice.client_id);
    if (!metric) continue;
    metric.totalInvoiced += Number(invoice.total ?? 0);
  }

  const metricsRecord = Object.fromEntries(metricsByClient) as Record<string, ClientMetric>;

  const clientsForUi =
    sortKey === "most_jobs"
      ? [...clientsBase].sort((a, b) => {
          const ja = metricsByClient.get(a.id)?.totalJobs ?? 0;
          const jb = metricsByClient.get(b.id)?.totalJobs ?? 0;
          return jb - ja;
        })
      : clientsBase;

  async function createClientAction(formData: FormData): Promise<ClientActionResult> {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) {
      return { ok: false, message: "You are not authenticated. Please sign in again." };
    }

    await ensureOwnerProfileExists(sb, owner);

    const rawClientType = String(formData.get("client_type") ?? "customer");
    const client_type = rawClientType === "supplier" || rawClientType === "lead" ? rawClientType : "customer";

    const basePayload = {
      full_name: String(formData.get("full_name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      status: String(formData.get("status") ?? "active"),
      source: String(formData.get("source") ?? "other"),
      portal_token: crypto.randomUUID(),
      company_name: String(formData.get("company_name") ?? ""),
      abn: String(formData.get("abn") ?? ""),
      address: String(formData.get("address") ?? ""),
      suburb: String(formData.get("suburb") ?? ""),
      state: String(formData.get("state") ?? ""),
      postcode: String(formData.get("postcode") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      client_type
    };

    let attempt = await sb.from("clients").insert({
      owner_id: owner.id,
      is_demo: false,
      ...basePayload
    }).select("id").maybeSingle();

    if (attempt.error?.code === "23503") {
      await ensureOwnerProfileExists(sb, owner);
      attempt = await sb.from("clients").insert({
        owner_id: owner.id,
        ...basePayload
      }).select("id").maybeSingle();
    }

    if (attempt.error || !attempt.data?.id) {
      console.error("Create client failed", {
        code: attempt.error?.code,
        message: attempt.error?.message ?? (!attempt.data?.id ? "Insert returned no row id" : undefined),
        ownerId: owner.id,
        payload: basePayload
      });
      return {
        ok: false,
        message: attempt.error ? formatDbError(attempt.error) || "Failed to create client" : "Failed to create client"
      };
    }

    console.info("Create client succeeded", { ownerId: owner.id, clientId: attempt.data.id });
    revalidateOwnerWorkspaceRoutes();
    return { ok: true };
  }

  async function updateClientAction(formData: FormData): Promise<ClientActionResult> {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) {
      return { ok: false, message: "You are not authenticated. Please sign in again." };
    }

    await ensureOwnerProfileExists(sb, owner);

    const id = String(formData.get("id") ?? "");
    const rawClientType = String(formData.get("client_type") ?? "customer");
    const client_type = rawClientType === "supplier" || rawClientType === "lead" ? rawClientType : "customer";

    const payload = {
      full_name: String(formData.get("full_name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      status: String(formData.get("status") ?? "active"),
      source: String(formData.get("source") ?? "other"),
      company_name: String(formData.get("company_name") ?? ""),
      abn: String(formData.get("abn") ?? ""),
      address: String(formData.get("address") ?? ""),
      suburb: String(formData.get("suburb") ?? ""),
      state: String(formData.get("state") ?? ""),
      postcode: String(formData.get("postcode") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      client_type
    };

    let { error } = await sb
      .from("clients")
      .update(payload)
      .eq("id", id)
      .eq("owner_id", owner.id);

    if (error) {
      console.error("Update client failed", {
        code: error.code,
        message: error.message,
        ownerId: owner.id,
        clientId: id
      });
      return {
        ok: false,
        message: formatDbError(error) || "Failed to update client"
      };
    }

    revalidateOwnerWorkspaceRoutes();
    return { ok: true };
  }

  async function sendPortalEmailAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) return;
    const clientId = String(formData.get("client_id") ?? "");
    const { data: client } = await sb
      .from("clients")
      .select("full_name, email, portal_token, is_demo")
      .eq("id", clientId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (client?.is_demo) return;
    if (!client?.email || !client.portal_token) return;
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au"}/portal/${client.portal_token}`;
    await sendEmail(
      client.email,
      "Your SERVLO Client Portal",
      portalShareEmailTemplate({
        clientName: client.full_name ?? "there",
        portalUrl
      })
    );
    revalidateOwnerWorkspaceRoutes();
  }

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au";

  return (
    <>
      <FirstVisitBanner
        pageKey="clients"
        title="Your client database"
        description="Store client details, view job history, and track outstanding invoices."
      />
    <Suspense fallback={<div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-8 text-sm text-[var(--text-muted)]">Loading clients…</div>}>
      <OwnerClientsView
        clients={clientsForUi}
        metrics={metricsRecord}
        initialView={view}
        initialSort={sortKey}
        initialClientTypeTab={clientTypeTab}
        createClientAction={createClientAction}
        updateClientAction={updateClientAction}
        sendPortalEmailAction={sendPortalEmailAction}
        appOrigin={appOrigin}
      />
    </Suspense>
    </>
  );
}
