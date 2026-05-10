import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import OwnerInvoicesPage from "../invoices/page";
import OwnerQuotesPage from "../quotes/page";
import OwnerPurchaseOrdersPage from "../purchase-orders/page";
import FirstVisitBanner from "@/components/dashboard/first-visit-banner";

type Props = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function FinancePage({ searchParams }: Props) {
  const { enabled } = await requireOwnerWorkspaceFeatures();

  const availableTabs = [
    enabled.has("invoices")        && { id: "invoices",         label: "Invoices" },
    enabled.has("quotes")          && { id: "quotes",           label: "Quotes" },
    enabled.has("purchase_orders") && { id: "purchase-orders",  label: "Purchase Orders" },
  ].filter(Boolean) as { id: string; label: string }[];

  if (availableTabs.length === 0) redirect("/dashboard/owner");

  const sp = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[]>;
  const rawTab = typeof sp.tab === "string" ? sp.tab : Array.isArray(sp.tab) ? sp.tab[0] : undefined;
  const activeTab = availableTabs.find((t) => t.id === rawTab) ? rawTab! : availableTabs[0].id;

  return (
    <div>
      <FirstVisitBanner
        pageKey="finance"
        title="Finance & billing"
        description="Create invoices, send quotes, and track what you're owed. All in one place."
      />
      {/* Tab bar */}
      <div className="mb-6 border-b border-[var(--border)]">
        <h1 className="mb-3 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Finance
        </h1>
        <div className="flex gap-1 overflow-x-auto">
          {availableTabs.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/owner/finance?tab=${t.id}`}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "border-[#3B82F6] text-[#3B82F6]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Active tab content — each sub-page handles its own auth + guards */}
      {activeTab === "invoices"        && <OwnerInvoicesPage />}
      {activeTab === "quotes"          && <OwnerQuotesPage />}
      {activeTab === "purchase-orders" && <OwnerPurchaseOrdersPage />}

      {/* Quick access cards */}
      <div className="mt-8 space-y-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Pricebook</p>
            <p className="text-xs text-[var(--text-muted)]">Manage reusable materials, labour rates, and service items.</p>
          </div>
          <Link
            href="/dashboard/owner/pricebook"
            className="shrink-0 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Open Pricebook
          </Link>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">BAS Helper ✨</p>
            <p className="text-xs text-[var(--text-muted)]">Estimate your quarterly BAS figures from your invoice and expense data.</p>
          </div>
          <Link
            href={"/dashboard/owner/bas" as never}
            className="shrink-0 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Open BAS Helper
          </Link>
        </div>
      </div>
    </div>
  );
}
