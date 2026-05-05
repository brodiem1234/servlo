import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ClientsManager from "./clients-manager";
import PortalShareButton from "./portal-share-button";
import { portalShareEmailTemplate, sendEmail } from "@/lib/email";

type ClientsPageProps = {
  searchParams?: {
    view?: string;
    sort?: string;
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
        details: error.details,
        hint: error.hint,
        ownerId: owner.id
      });
    } else {
      return owner.id;
    }
  } catch (error) {
    console.error("ensureOwnerProfileExists admin client error", {
      ownerId: owner.id,
      error
    });
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
      details: fallbackError.details,
      hint: fallbackError.hint,
      ownerId: owner.id
    });
  }

  return owner.id;
}

async function resolveOwnerIdCandidates(
  sb: Awaited<ReturnType<typeof createClient>>,
  owner: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }
) {
  const candidates = new Set<string>();
  candidates.add(owner.id);

  const { data: profileById } = await sb
    .from("profiles")
    .select("id, business_id")
    .eq("id", owner.id)
    .maybeSingle();

  if (profileById?.id) candidates.add(profileById.id);
  if (profileById?.business_id) candidates.add(profileById.business_id);

  if (owner.email) {
    const { data: profileByEmail } = await sb
      .from("profiles")
      .select("id, business_id")
      .eq("email", owner.email)
      .maybeSingle();
    if (profileByEmail?.id) candidates.add(profileByEmail.id);
    if (profileByEmail?.business_id) candidates.add(profileByEmail.business_id);
  }

  return Array.from(candidates).filter(Boolean);
}

export default async function OwnerClientsPage({ searchParams }: ClientsPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const view = searchParams?.view === "list" ? "list" : "card";
  const sort = searchParams?.sort === "created_at" ? "created_at" : "full_name";

  let clients:
    | Array<{
        id: string;
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
      }>
    | null = null;

  const primaryClientsQuery = await supabase
    .from("clients")
    .select("id, full_name, email, phone, company_name, abn, address, suburb, state, postcode, notes, status, source, portal_token, created_at")
    .eq("owner_id", user.id)
    .order(sort, { ascending: true });

  if (primaryClientsQuery.error?.code === "PGRST204") {
    const fallbackClientsQuery = await supabase
      .from("clients")
      .select("id, full_name, email, phone, company_name, abn, address, suburb, state, postcode, notes, created_at")
      .eq("owner_id", user.id)
      .order(sort, { ascending: true });
    clients = (fallbackClientsQuery.data ?? []).map((client) => ({
      ...client,
      status: null,
      source: null
    }));
  } else {
    clients = primaryClientsQuery.data ?? [];
  }

  const clientIds = (clients ?? []).map((client) => client.id);
  const [{ data: jobs }, { data: invoices }] = await Promise.all([
    clientIds.length
      ? supabase
          .from("jobs")
          .select("id, client_id, scheduled_date")
          .in("client_id", clientIds)
          .eq("owner_id", user.id)
      : Promise.resolve({ data: [] as Array<{ id: string; client_id: string | null; scheduled_date: string | null }> }),
    clientIds.length
      ? supabase
          .from("invoices")
          .select("id, client_id, amount")
          .in("client_id", clientIds)
          .eq("owner_id", user.id)
      : Promise.resolve({ data: [] as Array<{ id: string; client_id: string | null; amount: number | null }> })
  ]);

  const metricsByClient = new Map<string, { totalJobs: number; totalInvoiced: number; lastJobDate: string | null }>();
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
    metric.totalInvoiced += Number(invoice.amount ?? 0);
  }

  async function createClientAction(formData: FormData): Promise<ClientActionResult> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) {
      return { ok: false, message: "You are not authenticated. Please sign in again." };
    }

    await ensureOwnerProfileExists(sb, owner);
    const ownerIdCandidates = await resolveOwnerIdCandidates(sb, owner);

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
      notes: String(formData.get("notes") ?? "")
    };

    let error: {
      code?: string;
      message?: string;
      details?: string;
      hint?: string;
    } | null = null;
    let successfulOwnerId: string | null = null;

    for (const candidateOwnerId of ownerIdCandidates) {
      const attempt = await sb.from("clients").insert({
        owner_id: candidateOwnerId,
        ...basePayload
      });
      if (!attempt.error) {
        error = null;
        successfulOwnerId = candidateOwnerId;
        break;
      }
      error = attempt.error;
      if (attempt.error.code !== "23503") {
        break;
      }
    }

    // If production schema is missing optional columns, retry with core fields so save still succeeds.
    if (error && error.code === "PGRST204") {
      const fallbackPayload = {
        owner_id: owner.id,
        full_name: basePayload.full_name,
        email: basePayload.email,
        phone: basePayload.phone,
        notes: basePayload.notes
      };
      const fallback = await sb.from("clients").insert(fallbackPayload);
      error = fallback.error;
    }

    if (error) {
      console.error("Create client failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        ownerId: owner.id,
        ownerIdCandidates,
        payload: basePayload
      });
      return {
        ok: false,
        message: formatDbError(error) || "Failed to create client"
      };
    }

    console.info("Create client succeeded", {
      ownerId: owner.id,
      successfulOwnerId
    });

    revalidatePath("/dashboard/owner/clients");
    return { ok: true };
  }

  async function updateClientAction(formData: FormData): Promise<ClientActionResult> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) {
      return { ok: false, message: "You are not authenticated. Please sign in again." };
    }

    const resolvedOwnerId = await ensureOwnerProfileExists(sb, owner);

    const id = String(formData.get("id") ?? "");
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
      notes: String(formData.get("notes") ?? "")
    };

    let { error } = await sb
      .from("clients")
      .update(payload)
      .eq("id", id)
      .eq("owner_id", resolvedOwnerId);

    if (error && error.code === "PGRST204") {
      const fallback = await sb
        .from("clients")
        .update({
          full_name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
          notes: payload.notes
        })
        .eq("id", id)
        .eq("owner_id", owner.id);
      error = fallback.error;
    }

    if (error) {
      console.error("Update client failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        ownerId: owner.id,
        resolvedOwnerId,
        clientId: id,
        payload
      });
      return {
        ok: false,
        message: formatDbError(error) || "Failed to update client"
      };
    }

    revalidatePath("/dashboard/owner/clients");
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
      .select("full_name, email, portal_token")
      .eq("id", clientId)
      .eq("owner_id", owner.id)
      .maybeSingle();
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
    revalidatePath("/dashboard/owner/clients");
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Clients</h1>
        <div className="flex gap-2 text-sm">
          <ClientsManager
            clients={clients ?? []}
            createClientAction={createClientAction}
            updateClientAction={updateClientAction}
          />
          <a href={`/dashboard/owner/clients?view=${view}&sort=full_name`} className="rounded border bg-white px-3 py-2">
            Sort: Name
          </a>
          <a
            href={`/dashboard/owner/clients?view=${view}&sort=created_at`}
            className="rounded border bg-white px-3 py-2"
          >
            Sort: Newest
          </a>
          <a href={`/dashboard/owner/clients?view=card&sort=${sort}`} className="rounded border bg-white px-3 py-2">
            Card
          </a>
          <a href={`/dashboard/owner/clients?view=list&sort=${sort}`} className="rounded border bg-white px-3 py-2">
            List
          </a>
        </div>
      </div>

      {view === "list" ? (
        <div className="overflow-x-auto rounded-xl border bg-white p-4 shadow-sm">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">Jobs</th>
                <th className="px-2 py-2">Invoiced</th>
                <th className="px-2 py-2">Last job</th>
                <th className="px-2 py-2">Created</th>
                <th className="px-2 py-2">Portal</th>
              </tr>
            </thead>
            <tbody>
              {(clients ?? []).map((client) => (
                <tr key={client.id} className="border-b hover:bg-slate-50">
                  <td className="px-2 py-2 font-medium">
                    <a className="text-[#1e3a5f] hover:underline" href={`/dashboard/owner/clients/${client.id}`}>
                      {client.full_name ?? "-"}
                    </a>
                  </td>
                  <td className="px-2 py-2">{client.email ?? "-"}</td>
                  <td className="px-2 py-2">{client.phone ?? "-"}</td>
                  <td className="px-2 py-2 capitalize">{client.status ?? "active"}</td>
                  <td className="px-2 py-2 capitalize">{client.source ?? "other"}</td>
                  <td className="px-2 py-2">{metricsByClient.get(client.id)?.totalJobs ?? 0}</td>
                  <td className="px-2 py-2">${(metricsByClient.get(client.id)?.totalInvoiced ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-2">
                    {metricsByClient.get(client.id)?.lastJobDate
                      ? new Date(metricsByClient.get(client.id)!.lastJobDate!).toLocaleDateString("en-AU")
                      : "-"}
                  </td>
                  <td className="px-2 py-2">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString("en-AU") : "-"}
                  </td>
                  <td className="px-2 py-2">
                    {client.portal_token ? (
                      <div className="flex items-center gap-2">
                        <PortalShareButton
                          url={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au"}/portal/${client.portal_token}`}
                        />
                        <form action={sendPortalEmailAction}>
                          <input type="hidden" name="client_id" value={client.id} />
                          <button type="submit" className="rounded border px-2 py-1 text-xs">Email Portal</button>
                        </form>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {(clients ?? []).length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={10}>
                    No clients yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(clients ?? []).map((client) => (
            <a key={client.id} href={`/dashboard/owner/clients/${client.id}`} className="rounded-xl border bg-white p-4 shadow-sm hover:bg-slate-50">
              <p className="font-semibold text-[#1e3a5f]">{client.full_name ?? "Unnamed client"}</p>
              <p className="mt-1 text-sm text-slate-600">{client.email ?? "No email"}</p>
              <p className="text-sm text-slate-600">{client.phone ?? "No phone"}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <p>Status: <span className="font-medium capitalize">{client.status ?? "active"}</span></p>
                <p>Source: <span className="font-medium capitalize">{client.source ?? "other"}</span></p>
                <p>Jobs: <span className="font-medium">{metricsByClient.get(client.id)?.totalJobs ?? 0}</span></p>
                <p>Invoiced: <span className="font-medium">${(metricsByClient.get(client.id)?.totalInvoiced ?? 0).toFixed(2)}</span></p>
                <p className="col-span-2">
                  Last job:{" "}
                  <span className="font-medium">
                    {metricsByClient.get(client.id)?.lastJobDate
                      ? new Date(metricsByClient.get(client.id)!.lastJobDate!).toLocaleDateString("en-AU")
                      : "-"}
                  </span>
                </p>
              </div>
              <div className="mt-3">
                {client.portal_token ? (
                  <PortalShareButton
                    url={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au"}/portal/${client.portal_token}`}
                  />
                ) : null}
              </div>
            </a>
          ))}
          {(clients ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No clients yet.</p>
          ) : null}
        </div>
      )}
    </section>
  );
}