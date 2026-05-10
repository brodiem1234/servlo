"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import ClientFormSheet from "./client-form-sheet";
import PortalShareButton from "./portal-share-button";
import { DemoBadge } from "@/components/demo-badge";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { useUndoToast } from "@/hooks/useUndoToast";

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
  is_demo?: boolean | null;
  client_type?: string | null;
};

export type SortKey = "newest" | "oldest" | "name_asc" | "name_desc" | "most_jobs";
export type ClientTypeTab = "all" | "customer" | "supplier" | "lead";

type Props = {
  clients: ClientRow[];
  metrics: Record<string, ClientMetric>;
  initialView: "card" | "list";
  initialSort: SortKey;
  initialClientTypeTab: ClientTypeTab;
  createClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  updateClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  deleteClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  restoreClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  sendPortalEmailAction: (formData: FormData) => Promise<void>;
  appOrigin: string;
};

function statusBadgeClass(status: string | null | undefined) {
  const s = (status ?? "active").toLowerCase();
  if (s === "active") return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800";
  if (s === "lead") return "bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800";
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600";
}

function clientTypeBadgeClass(t: string | null | undefined) {
  const v = (t ?? "customer").toLowerCase();
  if (v === "supplier") return "bg-sky-100 text-sky-900 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-800";
  if (v === "lead") return "bg-violet-100 text-violet-900 ring-1 ring-violet-200 dark:bg-violet-950 dark:text-violet-100 dark:ring-violet-800";
  return "bg-blue-100 text-blue-900 ring-1 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800/50";
}

function clientTypeLabel(t: string | null | undefined) {
  const v = (t ?? "customer").toLowerCase();
  if (v === "supplier") return "Supplier";
  if (v === "lead") return "Lead";
  return "Customer";
}

/** Three-dot row menu */
function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors"
        aria-label="Row actions"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-lg">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            <Pencil size={14} className="shrink-0" />
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 size={14} className="shrink-0" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function OwnerClientsView({
  clients,
  metrics,
  initialView,
  initialSort,
  initialClientTypeTab,
  createClientAction,
  updateClientAction,
  deleteClientAction,
  restoreClientAction,
  sendPortalEmailAction,
  appOrigin,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showUndo } = useUndoToast();

  const viewQs = searchParams.get("view");
  const effectiveView: "card" | "list" = viewQs === "list" ? "list" : viewQs === "card" ? "card" : initialView;

  const sortQs = searchParams.get("sort") as SortKey | null;
  const sortParam: SortKey =
    sortQs === "newest" || sortQs === "oldest" || sortQs === "name_desc" || sortQs === "name_asc" || sortQs === "most_jobs"
      ? sortQs
      : initialSort;

  const clientTypeQs = searchParams.get("client_type");
  const clientTypeTab: ClientTypeTab =
    clientTypeQs === "customer" || clientTypeQs === "supplier" || clientTypeQs === "lead"
      ? clientTypeQs
      : initialClientTypeTab;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetClient, setSheetClient] = useState<ClientRow | null>(null);
  const [banner, setBanner] = useState<{ type: "success"; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Optimistic removed IDs (shown hidden until undo expires or page reloads)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 4500);
    return () => window.clearTimeout(t);
  }, [banner]);

  const pushParams = useCallback(
    (next: { view?: "card" | "list"; sort?: SortKey; client_type?: ClientTypeTab }) => {
      const p = new URLSearchParams(searchParams.toString());
      if (next.view) p.set("view", next.view);
      if (next.sort) p.set("sort", next.sort);
      if (next.client_type !== undefined) {
        if (next.client_type === "all") p.delete("client_type");
        else p.set("client_type", next.client_type);
      }
      const qs = p.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      router.push(href as Parameters<typeof router.push>[0]);
    },
    [pathname, router, searchParams]
  );

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (removedIds.has(c.id)) return false;
      if (clientTypeTab !== "all" && (c.client_type ?? "customer") !== clientTypeTab) return false;
      if (!q) return true;
      const blob = [c.full_name, c.email, c.phone, c.company_name, c.suburb, clientTypeLabel(c.client_type)]
        .map((x) => (x ?? "").toLowerCase())
        .join(" ");
      return blob.includes(q);
    });
  }, [clients, search, clientTypeTab, removedIds]);

  const allFilteredIds = useMemo(() => filteredClients.map((c) => c.id), [filteredClients]);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allFilteredIds));
    }
  }

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreate() {
    setSheetClient(null);
    setSheetOpen(true);
  }

  function openEdit(client: ClientRow) {
    setSheetClient(client);
    setSheetOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const fd = new FormData();
    fd.set("id", deleteTarget.id);
    const result = await deleteClientAction(fd);
    setDeleting(false);
    if (!result.ok) {
      setBanner({ type: "success", message: result.message ?? "Failed to delete." });
      setDeleteTarget(null);
      return;
    }
    const deletedId = deleteTarget.id;
    const deletedName = deleteTarget.full_name ?? "Client";
    setRemovedIds((prev) => new Set([...prev, deletedId]));
    setSelected((prev) => { const n = new Set(prev); n.delete(deletedId); return n; });
    setDeleteTarget(null);

    showUndo({
      message: `${deletedName} deleted.`,
      onUndo: async () => {
        const rfd = new FormData();
        rfd.set("id", deletedId);
        await restoreClientAction(rfd);
        setRemovedIds((prev) => { const n = new Set(prev); n.delete(deletedId); return n; });
      },
    });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    // Optimistically remove all
    setRemovedIds((prev) => new Set([...prev, ...ids]));
    setSelected(new Set());
    const count = ids.length;
    await Promise.all(ids.map((id) => {
      const fd = new FormData(); fd.set("id", id); return deleteClientAction(fd);
    }));
    showUndo({
      message: `${count} client${count > 1 ? "s" : ""} deleted.`,
      onUndo: async () => {
        await Promise.all(ids.map((id) => {
          const fd = new FormData(); fd.set("id", id); return restoreClientAction(fd);
        }));
        setRemovedIds((prev) => { const n = new Set(prev); ids.forEach((id) => n.delete(id)); return n; });
      },
    });
  }

  const selectedCount = selected.size;

  return (
    <section className="space-y-5">
      <ClientFormSheet
        open={sheetOpen}
        client={sheetClient}
        onClose={() => { setSheetOpen(false); setSheetClient(null); }}
        createClientAction={createClientAction}
        updateClientAction={updateClientAction}
        onSaveSuccess={(message) => { setBanner({ type: "success", message }); setSearch(""); }}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        entityName={deleteTarget?.full_name ?? "this client"}
        entityType="client"
        loading={deleting}
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
              ref={searchInputRef}
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
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most_jobs">Most jobs</option>
            </select>
          </label>

          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
            <button
              type="button"
              title="Card view"
              aria-label="Card view"
              aria-pressed={effectiveView === "card"}
              onClick={() => pushParams({ view: "card" })}
              className={`rounded-md p-2 ${effectiveView === "card" ? "bg-[var(--accent-color)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              <LayoutGrid className="size-5" />
            </button>
            <button
              type="button"
              title="List view"
              aria-label="List view"
              aria-pressed={effectiveView === "list"}
              onClick={() => pushParams({ view: "list" })}
              className={`rounded-md p-2 ${effectiveView === "list" ? "bg-[var(--accent-color)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
            >
              <LayoutList className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[var(--product-accent)] px-5 text-sm font-bold text-white shadow-md shadow-blue-900/20 hover:opacity-90 dark:shadow-black/40"
          >
            <Plus className="size-4" aria-hidden />
            Add Client
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 shadow-sm">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {selectedCount} selected
          </span>
          <button
            type="button"
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            <Trash2 size={13} />
            Delete selected
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["customer", "Customers"],
            ["supplier", "Suppliers"],
            ["lead", "Leads"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => pushParams({ client_type: value })}
            className={`rounded-full px-4 py-2 text-xs font-bold transition shadow-sm ${
              clientTypeTab === value
                ? "border-2 border-[var(--accent-color)] bg-[var(--accent-color)] text-white shadow-md"
                : "border-2 border-dashed border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:border-[color-mix(in_srgb,var(--accent-color)_45%,var(--border))] hover:bg-[color-mix(in_srgb,var(--accent-color)_6%,transparent)] hover:text-[var(--text-secondary)] dark:hover:bg-[color-mix(in_srgb,var(--accent-color)_12%,transparent)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {clients.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-8 py-16 text-center shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-color)_14%,transparent)] text-[var(--accent-color)]">
            <Users className="size-8" aria-hidden />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">No clients yet</h2>
          <p className="max-w-md text-sm text-[var(--text-secondary)]">Add your first client to get started.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-2 inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--accent-color)] px-6 text-sm font-bold text-white shadow-md hover:bg-[var(--accent-hover)]"
          >
            <Plus className="size-4" aria-hidden />
            Add Client
          </button>
        </div>
      ) : effectiveView === "list" ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                <th className="px-2 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                    className="rounded border-[var(--border)] accent-[var(--accent-color)]"
                  />
                </th>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Phone</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Source</th>
                <th className="px-2 py-2 font-medium">Jobs</th>
                <th className="px-2 py-2 font-medium">Invoiced</th>
                <th className="px-2 py-2 font-medium">Last job</th>
                <th className="px-2 py-2 font-medium">Created</th>
                <th className="px-2 py-2 font-medium">Portal</th>
                <th className="px-2 py-2 font-medium">Open</th>
                <th className="px-2 py-2 w-8" />
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
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEdit(client); }
                  }}
                  className="cursor-pointer border-b border-[var(--border)] hover:bg-[var(--bg-primary)]"
                >
                  <td className="px-2 py-2 w-8" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(client.id)}
                      onChange={(e) => toggleSelect(client.id, e as unknown as React.MouseEvent)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${client.full_name ?? "client"}`}
                      className="rounded border-[var(--border)] accent-[var(--accent-color)]"
                    />
                  </td>
                  <td className="px-2 py-2 font-medium text-[var(--text-primary)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{client.full_name ?? "-"}</span>
                      {client.is_demo ? <DemoBadge /> : null}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${clientTypeBadgeClass(client.client_type)}`}>
                      {clientTypeLabel(client.client_type)}
                    </span>
                  </td>
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
                        {!client.is_demo ? (
                          <form action={sendPortalEmailAction}>
                            <input type="hidden" name="client_id" value={client.id} />
                            <button type="submit" className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]">
                              Email Portal
                            </button>
                          </form>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)]">Demo — email disabled</span>
                        )}
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/dashboard/owner/jobs?client=${encodeURIComponent(client.id)}`}
                      className="rounded border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--accent-color)]/10"
                    >
                      View Jobs
                    </Link>
                  </td>
                  <td className="px-2 py-2 w-8" onClick={(e) => e.stopPropagation()}>
                    <RowMenu
                      onEdit={() => openEdit(client)}
                      onDelete={() => setDeleteTarget(client)}
                    />
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 ? (
                <tr>
                  <td className="px-2 py-6 text-[var(--text-muted)]" colSpan={14}>
                    No clients match your filters or search.
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
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEdit(client); }
              }}
              className="relative flex cursor-pointer flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm transition hover:bg-[color-mix(in_srgb,var(--accent-color)_5%,var(--bg-primary))]"
            >
              {/* Three-dot menu */}
              <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
                <RowMenu
                  onEdit={() => openEdit(client)}
                  onDelete={() => setDeleteTarget(client)}
                />
              </div>

              {/* Checkbox */}
              <div
                className="absolute left-3 top-3"
                onClick={(e) => { e.stopPropagation(); toggleSelect(client.id, e); }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(client.id)}
                  onChange={() => {}}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${client.full_name ?? "client"}`}
                  className="rounded border-[var(--border)] accent-[var(--accent-color)]"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 pl-5 pr-8">
                <p className="text-lg font-semibold leading-tight text-[var(--text-primary)]">{client.full_name ?? "Unnamed client"}</p>
                {client.is_demo ? <DemoBadge /> : null}
              </div>
              {client.company_name ? (
                <p className="mt-1 pl-5 text-sm font-medium text-[var(--text-secondary)]">{client.company_name}</p>
              ) : null}
              <p className="mt-3 text-sm text-[var(--text-primary)]">{client.phone ?? "—"}</p>
              <p className="text-sm text-[var(--text-primary)]">{client.email ?? "—"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(client.status)}`}>
                  {(client.status ?? "active").replace(/-/g, " ")}
                </span>
              </div>
              <div className="mt-5 flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Link
                  href={`/dashboard/owner/jobs?client=${encodeURIComponent(client.id)}`}
                  className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
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
            <div className="col-span-full py-14 text-center text-sm text-[var(--text-muted)]">No clients match your filters or search.</div>
          ) : null}
        </div>
      )}
    </section>
  );
}
