import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import OwnerInvoicesPage from "../invoices/page";
import OwnerQuotesPage from "../quotes/page";
import OwnerPurchaseOrdersPage from "../purchase-orders/page";

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
      {/* Tab bar */}
      <div className="mb-6 border-b border-[var(--border)]">
        <h1 className="mb-3 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Finance
        </h1>
        <div className="flex gap-1">
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
    </div>
  );
}
