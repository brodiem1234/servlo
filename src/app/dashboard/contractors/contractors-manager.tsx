"use client";

import { useRef, useState } from "react";
import { DemoBadge } from "@/components/demo-badge";

type Contractor = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  trade_type: string | null;
  licences: string[] | null;
  hourly_rate: number | null;
  role: string | null;
  abn: string | null;
  business_name: string | null;
  is_demo?: boolean | null;
};

type Props = {
  contractors: Contractor[];
  createContractorAction: (formData: FormData) => Promise<void>;
  updateContractorAction: (formData: FormData) => Promise<void>;
  deleteContractorAction: (formData: FormData) => Promise<void>;
};

const LICENCE_CATEGORIES: Array<{ label: string; items: string[] }> = [
  {
    label: "Safety & General",
    items: ["White Card (CPCCOHS1001A)", "Working at Heights", "First Aid Certificate", "Traffic Controller (Basic)", "Traffic Controller (Advanced)", "Confined Space Entry"]
  },
  {
    label: "Electrical",
    items: ["Electrical Licence (A-Grade)", "Electrical Licence (Restricted)", "Electrical Contractor", "Solar PV (Grid Connect)", "Solar PV (Off Grid)", "Air Conditioning & Refrigeration", "Communications Cabling (Cabler Registration)"]
  },
  {
    label: "Plumbing",
    items: ["Plumbing & Drainage Licence", "Plumbing Contractor", "Gas Fitting Licence", "Gas Fitting (Restricted)", "Irrigation & Water", "Roofing & Drainage (Plumbing)"]
  },
  {
    label: "Building & Construction",
    items: ["Builder's Licence (Unlimited)", "Builder's Licence (Low Rise)", "Bricklaying & Blocklaying", "Carpentry & Joinery", "Concreting", "Demolition (Unrestricted)", "Flooring & Floor Covering", "Glazing", "Painting (Cert III)", "Plastering", "Tiling (Wall & Floor)", "Waterproofing"]
  },
  {
    label: "HVAC & Refrigeration",
    items: ["Refrigerant Handling (ARC)", "HVAC Installation", "Mechanical Services", "Ventilation & Air Movement"]
  },
  {
    label: "High Risk Work",
    items: ["Scaffolding (Basic)", "Scaffolding (Intermediate)", "Scaffolding (Advanced)", "Rigging (Basic)", "Rigging (Advanced)", "Dogging Licence", "Forklift Licence", "Elevated Work Platform — Boom", "Elevated Work Platform — Scissor"]
  },
  {
    label: "Specialist",
    items: ["Asbestos Removal (Class A)", "Asbestos Removal (Class B)", "Pest Management Licence", "Fire Protection — Installation", "Security Installation Licence", "Arborist (Cert III)", "Welder (AS/NZS 2980)"]
  }
];

function LicenceSelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = LICENCE_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => !selected.includes(item) && item.toLowerCase().includes(search.toLowerCase()))
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="sm:col-span-2">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Licences &amp; Certifications
      </label>
      {selected.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((lic) => (
            <span key={lic} className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs text-[var(--text-primary)]">
              {lic}
              <button type="button" onClick={() => onChange(selected.filter((x) => x !== lic))} className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">×</button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="relative">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search licences to add…"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
        {open && filtered.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl">
            {filtered.map((cat) => (
              <div key={cat.label}>
                <p className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{cat.label}</p>
                {cat.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onChange([...selected, item]); setSearch(""); inputRef.current?.focus(); }}
                    className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const TEAM_TABS = [
  { id: "employees",   label: "Employees",   href: "/dashboard/owner/team?tab=employees" },
  { id: "contractors", label: "Contractors", href: "/dashboard/contractors" },
  { id: "timesheets",  label: "Timesheets",  href: "/dashboard/owner/team?tab=timesheets" },
] as const;

export default function ContractorsManager({ contractors, createContractorAction, updateContractorAction, deleteContractorAction }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedLicences, setSelectedLicences] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Contractor | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [values, setValues] = useState({
    id: "", full_name: "", email: "", phone: "", trade_type: "",
    hourly_rate: "", abn: "", business_name: ""
  });

  function startAdd() {
    setEditing(false);
    setValues({ id: "", full_name: "", email: "", phone: "", trade_type: "", hourly_rate: "", abn: "", business_name: "" });
    setSelectedLicences([]);
    setOpen(true);
  }

  function startEdit(c: Contractor) {
    setEditing(true);
    setValues({
      id: c.id,
      full_name: c.full_name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      trade_type: c.trade_type ?? "",
      hourly_rate: String(c.hourly_rate ?? ""),
      abn: c.abn ?? "",
      business_name: c.business_name ?? ""
    });
    setSelectedLicences(c.licences ?? []);
    setOpen(true);
  }

  const action = async (formData: FormData) => {
    formData.set("licences", JSON.stringify(selectedLicences));
    try {
      if (editing) await updateContractorAction(formData);
      else await createContractorAction(formData);
      setToast({ type: "success", message: editing ? "Contractor updated" : "Contractor added" });
      setOpen(false);
    } catch (error) {
      setToast({ type: "error", message: "Unable to save contractor" });
      console.error(error);
    }
  };

  const handleDelete = async (contractor: Contractor) => {
    const fd = new FormData();
    fd.set("id", contractor.id);
    try {
      await deleteContractorAction(fd);
      setToast({ type: "success", message: `${contractor.full_name ?? "Contractor"} removed` });
      setConfirmDelete(null);
    } catch {
      setToast({ type: "error", message: "Could not remove contractor" });
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab bar — mirrors Team page tabs */}
      <div className="mb-2 border-b border-[var(--border)]">
        <h1 className="mb-3 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Team
        </h1>
        <div className="flex gap-1 overflow-x-auto">
          {TEAM_TABS.map((t) => (
            <a
              key={t.id}
              href={t.href}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                t.id === "contractors"
                  ? "border-[#3B82F6] text-[#3B82F6]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </a>
          ))}
        </div>
      </div>

      {toast ? (
        <div className={`rounded-md px-4 py-3 text-sm font-medium ${toast.type === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100" : "border border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"}`}>
          {toast.message}
        </div>
      ) : null}

      <button onClick={startAdd} className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]">
        Add Contractor
      </button>

      <article className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Business</th>
              <th className="px-2 py-2">ABN</th>
              <th className="px-2 py-2">Trade</th>
              <th className="px-2 py-2">Rate</th>
              <th className="px-2 py-2">Licences</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contractors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-10 text-center text-sm text-[var(--text-muted)]">
                  No contractors yet. Add your first subcontractor above.
                </td>
              </tr>
            ) : (
              contractors.map((c) => {
                const demo = Boolean(c.is_demo);
                const licences = c.licences ?? [];
                return (
                  <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-primary)]">
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[var(--text-primary)]">{c.full_name ?? "-"}</span>
                        {demo ? <DemoBadge /> : null}
                      </div>
                      {c.email ? <p className="text-xs text-[var(--text-muted)]">{c.email}</p> : null}
                      {c.phone ? <p className="text-xs text-[var(--text-muted)]">{c.phone}</p> : null}
                    </td>
                    <td className="px-2 py-2 text-[var(--text-secondary)]">{c.business_name ?? "—"}</td>
                    <td className="px-2 py-2 font-mono text-xs text-[var(--text-secondary)]">{c.abn ?? "—"}</td>
                    <td className="px-2 py-2 text-[var(--text-secondary)]">{c.trade_type ?? "—"}</td>
                    <td className="px-2 py-2 text-[var(--text-secondary)]">{c.hourly_rate != null ? `$${c.hourly_rate}/hr` : "—"}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {licences.slice(0, 2).map((lic) => (
                          <span key={lic} className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                            {lic}
                          </span>
                        ))}
                        {licences.length > 2 ? (
                          <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                            +{licences.length - 2} more
                          </span>
                        ) : null}
                        {licences.length === 0 ? <span className="text-xs text-[var(--text-muted)]">—</span> : null}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      {!demo ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(c)}
                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Demo</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </article>

      {/* Confirm delete modal */}
      {confirmDelete ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-white p-6 shadow-2xl dark:bg-[#1e2433]">
            <h3 className="mb-2 text-base font-semibold text-[var(--text-primary)]">Remove Contractor?</h3>
            <p className="mb-5 text-sm text-[var(--text-secondary)]">
              Remove <strong className="text-[var(--text-primary)]">{confirmDelete.full_name}</strong> from your contractors list? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]">
                Cancel
              </button>
              <button type="button" onClick={() => handleDelete(confirmDelete)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add/Edit drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50 md:flex-row md:justify-end">
          <div className="relative ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--border)] bg-white p-6 shadow-2xl dark:bg-[#1e2433]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {editing ? "Edit Contractor" : "Add Contractor"}
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]">
                Cancel
              </button>
            </div>
            <form action={action} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={values.id} />

              {/* Personal details */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Full Name</label>
                <input name="full_name" value={values.full_name} onChange={(e) => setValues((p) => ({ ...p, full_name: e.target.value }))} placeholder="Full name" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Email</label>
                <input type="email" name="email" value={values.email} onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Phone</label>
                <input type="tel" name="phone" value={values.phone} onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))} placeholder="04xx xxx xxx" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Trade / Speciality</label>
                <input name="trade_type" value={values.trade_type} onChange={(e) => setValues((p) => ({ ...p, trade_type: e.target.value }))} placeholder="e.g. Electrician" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]" />
              </div>

              {/* Business details */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Business / Trading Name</label>
                <input name="business_name" value={values.business_name} onChange={(e) => setValues((p) => ({ ...p, business_name: e.target.value }))} placeholder="ABC Electrical Pty Ltd" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">ABN</label>
                <input name="abn" value={values.abn} onChange={(e) => setValues((p) => ({ ...p, abn: e.target.value }))} placeholder="12 345 678 901" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Day Rate / Hourly Rate ($)</label>
                <input type="number" min={0} step="0.01" name="hourly_rate" value={values.hourly_rate} onChange={(e) => setValues((p) => ({ ...p, hourly_rate: e.target.value }))} placeholder="e.g. 80" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]" />
              </div>

              <LicenceSelect selected={selectedLicences} onChange={setSelectedLicences} />

              <div className="sm:col-span-2 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]">
                  {editing ? "Save Changes" : "Add Contractor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
