"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, LayoutList, Plus, Search } from "lucide-react";
import ClientFormSheet from "./client-form-sheet";
import PortalShareButton from "./portal-share-button";

export type ClientMetric = {
  totalJobs: number;
  totalInvoiced: number;
  lastJobDate: string | null;
};

export type ClientRow = {
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
};

export type SortKey = "newest" | "oldest" | "name_asc" | "name_desc";

type Props = {
  clients: ClientRow[];
  metrics: Record<string, ClientMetric>;
  initialView: "card" | "list";
  initialSort: SortKey;
  createClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  updateClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  sendPortalEmailAction: (formData: FormData) => Promise<void>;
  appOrigin: string;
};

function statusBadgeClass(status: string | null | undefined) {
  const s = (status ?? "active").toLowerCase();
  if (s === "active") return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800";
  if (s === "lead") return "bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800";
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600";
}

export default function OwnerClientsView({
  clients,
  metrics,
  initialView,
  initialSort,
  createClientAction,
  updateClientAction,
  sendPortalEmailAction,
  appOrigin
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const viewQs = searchParams.get("view");
  const effectiveView: "card" | "list" = viewQs === "list" ? "list" : viewQs === "card" ? "card" : initialView;

  const sortQs = searchParams.get("sort") as SortKey | null;
  const sortParam: SortKey =
    sortQs === "newest" || sortQs === "oldest" || sortQs === "name_desc" || sortQs === "name_asc" ? sortQs : initialSort;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetClient, setSheetClient] = useState<ClientRow | null>(null);
  const [banner, setBanner] = useState<{ type: "success"; message: string } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 4500);
    return () => window.clearTimeout(t);
  }, [banner]);

  const pushParams = useCallback(
    (next: { view?: "card" | "list"; sort?: SortKey }) => {
      const p = new URLSearchParams(searchParams.toString());
      if (next.view) p.set("view", next.view);
      if (next.sort) p.set("sort", next.sort);
      const qs = p.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      router.push(href as Parameters<typeof router.push>[0]);
    },
    [pathname, router, searchParams]
  );

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const blob = [c.full_name, c.email, c.phone, c.company_name, c.suburb]
        .map((x) => (x ?? "").toLowerCase())
        .join(" ");
      return blob.includes(q);
    });
  }, [clients, search]);

  function openCreate() {
    setSheetClient(null);
    setSheetOpen(true);
  }

  function openEdit(client: ClientRow) {
    setSheetClient(client);
    setSheetOpen(true);
  }

  return (
    <section className="space-y-5">
      <ClientFormSheet
        open={sheetOpen}
        client={sheetClient}
        onClose={() => {
          setSheetOpen(false);
          setSheetClient(null);
        }}
        createClientAction={createClientAction}
        updateClientAction={updateClientAction}
        onSaveSuccess={(message) => setBanner({ type: "success", message })}
      />

      {banner ? (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-100">
          {banner.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Clients</h1>

        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
          <div className="relative min-w-[200px] flex-1 lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2 pl-10 pr-3 text-sm text-[var(--text-primary)]"
              aria-label="Search clients"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span className="hidden sm:inline">Sort by</span>
            <select
              value={sortParam}
              onChange={(e) => pushParams({ sort: e.target.value as SortKey })}
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)]"
              aria-label="Sort by"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
            </select>
          </label>

          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
            <button
              type="button"
              title="Card view"
              aria-label="Card view"
              aria-pressed={effectiveView === "card"}
              onClick={() => pushParams({ view: "card" })}
              className={`rounded-md p-2 ${effectiveView === "card" ? "bg-[#0db8c8] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              <LayoutGrid className="size-5" />
            </button>
            <button
              type="button"
              title="List view"
              aria-label="List view"
              aria-pressed={effectiveView === "list"}
              onClick={() => pushParams({ view: "list" })}
              className={`rounded-md p-2 ${effectiveView === "list" ? "bg-[#0db8c8] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              <LayoutList className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0db8c8] px-4 text-sm font-semibold text-white hover:bg-[#0a9dab]"
          >
            <Plus className="size-4" aria-hidden />
            Add Client
          </button>
        </div>
      </div>

      {effectiveView === "list" ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Phone</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Source</th>
                <th className="px-2 py-2 font-medium">Jobs</th>
                <th className="px-2 py-2 font-medium">Invoiced</th>
                <th className="px-2 py-2 font-medium">Last job</th>
                <th className="px-2 py-2 font-medium">Created</th>
                <th className="px-2 py-2 font-medium">Portal</th>
                <th className="px-2 py-2 font-medium">Jobs</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEdit(client)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openEdit(client);
                    }
                  }}
                  className="cursor-pointer border-b border-[var(--border)] hover:bg-[var(--bg-primary)]"
                >
                  <td className="px-2 py-2 font-medium text-[var(--text-primary)]">{client.full_name ?? "-"}</td>
                  <td className="px-2 py-2 text-[var(--text-secondary)]">{client.email ?? "-"}</td>
                  <td className="px-2 py-2 text-[var(--text-secondary)]">{client.phone ?? "-"}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(client.status)}`}>
                      {client.status ?? "active"}
                    </span>
                  </td>
                  <td className="px-2 py-2 capitalize text-[var(--text-secondary)]">{client.source ?? "other"}</td>
                  <td className="px-2 py-2 text-[var(--text-secondary)]">{metrics[client.id]?.totalJobs ?? 0}</td>
                  <td className="px-2 py-2 text-[var(--text-secondary)]">${(metrics[client.id]?.totalInvoiced ?? 0).toFixed(2)}</td>
                  <td className="px-2 py-2 text-[var(--text-secondary)]">
                    {metrics[client.id]?.lastJobDate
                      ? new Date(metrics[client.id]!.lastJobDate!).toLocaleDateString("en-AU")
                      : "-"}
                  </td>
                  <td className="px-2 py-2 text-[var(--text-secondary)]">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString("en-AU") : "-"}
                  </td>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    {client.portal_token ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <PortalShareButton url={`${appOrigin}/portal/${client.portal_token}`} />
                        <form action={sendPortalEmailAction}>
                          <input type="hidden" name="client_id" value={client.id} />
                          <button type="submit" className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]">
                            Email Portal
                          </button>
                        </form>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/dashboard/owner/jobs?client=${encodeURIComponent(client.id)}`}
                      className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[#0db8c8]/10"
                    >
                      View Jobs
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 ? (
                <tr>
                  <td className="px-2 py-6 text-[var(--text-muted)]" colSpan={11}>
                    {clients.length === 0 ? "No clients yet." : "No clients match your search."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              role="button"
              tabIndex={0}
              onClick={() => openEdit(client)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openEdit(client);
                }
              }}
              className="flex cursor-pointer flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm transition hover:bg-[var(--bg-primary)]"
            >
              <p className="font-semibold text-[var(--text-primary)]">{client.full_name ?? "Unnamed client"}</p>
              {client.company_name ? <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{client.company_name}</p> : null}
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{client.phone ?? "No phone"}</p>
              <p className="text-sm text-[var(--text-secondary)]">{client.email ?? "No email"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(client.status)}`}>
                  {client.status ?? "active"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/dashboard/owner/jobs?client=${encodeURIComponent(client.id)}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[#0db8c8]/10"
                >
                  View Jobs
                </Link>
                {client.portal_token ? (
                  <PortalShareButton url={`${appOrigin}/portal/${client.portal_token}`} />
                ) : null}
              </div>
            </div>
          ))}
          {filteredClients.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">{clients.length === 0 ? "No clients yet." : "No clients match your search."}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
