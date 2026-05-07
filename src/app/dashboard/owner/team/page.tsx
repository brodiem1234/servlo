import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import OwnerEmployeesPage from "../employees/page";
import OwnerTimesheetsPage from "../timesheets/page";

type Props = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function TeamPage({ searchParams }: Props) {
  const { enabled } = await requireOwnerWorkspaceFeatures();

  const availableTabs = [
    enabled.has("employee_management") && { id: "employees",   label: "Employees" },
    enabled.has("contractors")         && { id: "contractors", label: "Contractors" },
    enabled.has("timesheets")          && { id: "timesheets",  label: "Timesheets" },
  ].filter(Boolean) as { id: string; label: string }[];

  if (availableTabs.length === 0) redirect("/dashboard/owner");

  const sp = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[]>;
  const rawTab = typeof sp.tab === "string" ? sp.tab : Array.isArray(sp.tab) ? sp.tab[0] : undefined;
  const activeTab = availableTabs.find((t) => t.id === rawTab) ? rawTab! : availableTabs[0].id;

  // Contractors tab — delegate to the dedicated page (that file has file-level "use server")
  if (activeTab === "contractors") redirect("/dashboard/contractors");

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 border-b border-[var(--border)]">
        <h1 className="mb-3 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Team
        </h1>
        <div className="flex gap-1">
          {availableTabs.map((t) => (
            <Link
              key={t.id}
              href={
                t.id === "contractors"
                  ? "/dashboard/contractors"
                  : `/dashboard/owner/team?tab=${t.id}`
              }
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

      {/* Active tab content */}
      {activeTab === "employees"  && <OwnerEmployeesPage />}
      {activeTab === "timesheets" && <OwnerTimesheetsPage />}
    </div>
  );
}
