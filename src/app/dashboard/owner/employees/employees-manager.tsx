"use client";

import { useRef, useState, useTransition } from "react";
import { DemoBadge } from "@/components/demo-badge";
import { UpgradePromptModal } from "@/components/dashboard/upgrade-prompt-modal";
import { InviteModal } from "@/components/dashboard/invite-modal";
import { useRouter } from "next/navigation";

type Employee = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  trade_type: string | null;
  licences: string[] | null;
  hourly_rate: number | null;
  role: string | null;
  is_demo?: boolean | null;
};

type PendingInvitation = {
  id: string;
  invited_email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
};

type Props = {
  employees: Employee[];
  createEmployeeAction: (formData: FormData) => Promise<void>;
  updateEmployeeAction: (formData: FormData) => Promise<void>;
  userPlan?: string;
  pendingInvitations?: PendingInvitation[];
};

const LICENCE_CATEGORIES: Array<{ label: string; items: string[] }> = [
  {
    label: "Safety & General",
    items: [
      "White Card (CPCCOHS1001A)",
      "Working at Heights",
      "First Aid Certificate",
      "Traffic Controller (Basic)",
      "Traffic Controller (Advanced)",
      "Manual Handling",
      "Confined Space Entry",
    ]
  },
  {
    label: "Electrical",
    items: [
      "Electrical Licence (A-Grade)",
      "Electrical Licence (Restricted)",
      "Electrical Contractor",
      "Solar PV (Grid Connect)",
      "Solar PV (Off Grid)",
      "Air Conditioning & Refrigeration",
      "Communications Cabling (Cabler Registration)",
      "Data & Telecommunications",
    ]
  },
  {
    label: "Plumbing",
    items: [
      "Plumbing & Drainage Licence",
      "Plumbing Contractor",
      "Gas Fitting Licence",
      "Gas Fitting (Restricted)",
      "Irrigation & Water",
      "Roofing & Drainage (Plumbing)",
    ]
  },
  {
    label: "Building & Construction",
    items: [
      "Builder's Licence (Unlimited)",
      "Builder's Licence (Low Rise)",
      "Owner Builder Permit",
      "Bricklaying & Blocklaying",
      "Carpentry & Joinery",
      "Concreting",
      "Demolition (Unrestricted)",
      "Demolition (Restricted)",
      "Flooring & Floor Covering",
      "Glazing",
      "Insulation",
      "Painting (Cert III)",
      "Plastering",
      "Rendering & Texture Coating",
      "Tiling (Wall & Floor)",
      "Waterproofing",
    ]
  },
  {
    label: "HVAC & Refrigeration",
    items: [
      "Refrigerant Handling (ARC)",
      "HVAC Installation",
      "Mechanical Services",
      "Ventilation & Air Movement",
    ]
  },
  {
    label: "High Risk Work",
    items: [
      "Scaffolding (Basic)",
      "Scaffolding (Intermediate)",
      "Scaffolding (Advanced)",
      "Rigging (Basic)",
      "Rigging (Intermediate)",
      "Rigging (Advanced)",
      "Dogging Licence",
      "Crane Operation (Non-slewing)",
      "Crane Operation (Slewing)",
      "Forklift Licence",
      "Elevated Work Platform — Boom",
      "Elevated Work Platform — Scissor",
      "Explosive Power Tool",
    ]
  },
  {
    label: "Specialist",
    items: [
      "Asbestos Removal (Class A)",
      "Asbestos Removal (Class B)",
      "Pest Management Licence",
      "Fire Protection — Installation",
      "Fire System Maintenance",
      "Security Installation Licence",
      "Pool & Spa Inspection",
      "Arborist (Cert III)",
      "Welder (AS/NZS 2980)",
    ]
  }
];

function LicenceSelect({
  selected,
  onChange
}: {
  selected: string[];
  onChange: (updated: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCats = LICENCE_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !selected.includes(item) &&
        item.toLowerCase().includes(search.toLowerCase())
    )
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="sm:col-span-2">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Licences &amp; Certifications
      </label>

      {/* Selected badges */}
      {selected.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((lic) => (
            <span
              key={lic}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs text-[var(--text-primary)]"
            >
              {lic}
              <button
                type="button"
                onClick={() => onChange(selected.filter((x) => x !== lic))}
                className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {/* Searchable dropdown trigger */}
      <div className="relative">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true); }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => window.setTimeout(() => setDropdownOpen(false), 150)}
          placeholder="Search licences to add…"
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
        {dropdownOpen && filteredCats.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-xl">
            {filteredCats.map((cat) => (
              <div key={cat.label}>
                <p className="border-b border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {cat.label}
                </p>
                {cat.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange([...selected, item]);
                      setSearch("");
                      inputRef.current?.focus();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : dropdownOpen && search && filteredCats.length === 0 ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3 text-sm text-[var(--text-muted)] shadow-xl">
            No matching licences found.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function EmployeesManager({
  employees,
  createEmployeeAction,
  updateEmployeeAction,
  userPlan = 'free',
  pendingInvitations = [],
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedLicences, setSelectedLicences] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<PendingInvitation[]>(pendingInvitations);
  const [values, setValues] = useState({
    id: "",
    full_name: "",
    email: "",
    phone: "",
    trade_type: "",
    hourly_rate: ""
  });

  const canInvite = userPlan === 'team' || userPlan === 'business' || userPlan === 'enterprise';

  function startAdd() {
    setEditing(false);
    setValues({ id: "", full_name: "", email: "", phone: "", trade_type: "", hourly_rate: "" });
    setSelectedLicences([]);
    setOpen(true);
  }

  function handleInviteClick() {
    if (!canInvite) {
      setUpgradeOpen(true);
    } else {
      setInviteOpen(true);
    }
  }

  async function handleResendInvite(invitationId: string) {
    setActionLoading(invitationId + '-resend');
    try {
      const res = await fetch('/api/team/invite/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Invitation resent' });
        // Update expires_at locally
        setInvitations((prev) => prev.map((inv) =>
          inv.id === invitationId
            ? { ...inv, status: 'pending', expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
            : inv
        ));
      } else {
        setToast({ type: 'error', message: 'Failed to resend invitation' });
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelInvite(invitationId: string) {
    setActionLoading(invitationId + '-cancel');
    try {
      const res = await fetch('/api/team/invite/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      if (res.ok) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
        setToast({ type: 'success', message: 'Invitation cancelled' });
      } else {
        setToast({ type: 'error', message: 'Failed to cancel invitation' });
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCopyInviteLink(invitationId: string) {
    // We don't have the token on the client — just show a toast that they need to resend
    setToast({ type: 'success', message: 'Resend the invite to generate a fresh link' });
  }

  function startEdit(employee: Employee) {
    setEditing(true);
    setValues({
      id: employee.id,
      full_name: employee.full_name ?? "",
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      trade_type: employee.trade_type ?? "",
      hourly_rate: String(employee.hourly_rate ?? "")
    });
    setSelectedLicences(employee.licences ?? []);
    setOpen(true);
  }

  const action = async (formData: FormData) => {
    formData.set("licences", JSON.stringify(selectedLicences));
    try {
      if (editing) await updateEmployeeAction(formData);
      else await createEmployeeAction(formData);
      setToast({ type: "success", message: editing ? "Employee updated" : "Employee added" });
      setOpen(false);
    } catch (error) {
      setToast({ type: "error", message: "Unable to save employee" });
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <UpgradePromptModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        feature="Team members"
        currentPlan={userPlan === 'free' ? 'Free' : 'Solo'}
        currentPlanPrice={userPlan === 'free' ? 'Free' : '$39/mo'}
        currentPlanNote={userPlan === 'free' ? '5 jobs/mo, 1 user' : '1 user only'}
        requiredPlan="Team"
        requiredPlanPrice="$89/mo"
        requiredPlanNote="Unlimited team members"
        description="Add employees and contractors to your team. Assign them to jobs and track timesheets."
      />
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => {
          startTransition(() => router.refresh());
        }}
      />
      {toast ? (
        <div
          className={`rounded-md px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
              : "border border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={startAdd}
          className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Add Employee
        </button>
        <button
          onClick={handleInviteClick}
          className="rounded-md border border-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-[var(--accent-color)] hover:bg-[color-mix(in_srgb,var(--accent-color)_10%,transparent)]"
        >
          Invite team member
        </button>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Pending Invitations ({invitations.length})
          </h3>
          <div className="space-y-2">
            {invitations.map((inv) => {
              const isExpired = inv.status === 'expired' || new Date(inv.expires_at) < new Date();
              const sentDate = new Date(inv.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
              const expiresDate = new Date(inv.expires_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
              return (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{inv.invited_email}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {inv.role} · Sent {sentDate} · Expires {expiresDate}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isExpired
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {isExpired ? 'Expired' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleResendInvite(inv.id)}
                      disabled={actionLoading === inv.id + '-resend'}
                      className="rounded px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] disabled:opacity-50"
                    >
                      {actionLoading === inv.id + '-resend' ? '...' : 'Resend'}
                    </button>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      disabled={actionLoading === inv.id + '-cancel'}
                      className="rounded px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {actionLoading === inv.id + '-cancel' ? '...' : 'Cancel'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <article className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Phone</th>
              <th className="px-2 py-2">Trade</th>
              <th className="px-2 py-2">Rate</th>
              <th className="px-2 py-2">Licences</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-10 text-center text-sm text-[var(--text-muted)]">
                  No employees yet. Add your first team member above.
                </td>
              </tr>
            ) : (
              employees.map((employee) => {
                const demo = Boolean(employee.is_demo);
                const licences = employee.licences ?? [];
                return (
                  <tr key={employee.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-primary)]">
                    <td className="px-2 py-2 font-medium text-[var(--text-primary)]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{employee.full_name ?? "-"}</span>
                        {demo ? <DemoBadge /> : null}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[var(--text-secondary)]">{employee.email ?? "-"}</td>
                    <td className="px-2 py-2 text-[var(--text-secondary)]">{employee.phone ?? "-"}</td>
                    <td className="px-2 py-2 text-[var(--text-secondary)]">{employee.trade_type ?? employee.role ?? "-"}</td>
                    <td className="px-2 py-2 text-[var(--text-secondary)]">{employee.hourly_rate != null ? `$${employee.hourly_rate}/hr` : "-"}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {licences.slice(0, 3).map((lic) => (
                          <span
                            key={lic}
                            className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]"
                          >
                            {lic}
                          </span>
                        ))}
                        {licences.length > 3 ? (
                          <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                            +{licences.length - 3} more
                          </span>
                        ) : null}
                        {licences.length === 0 ? <span className="text-xs text-[var(--text-muted)]">—</span> : null}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      {!demo ? (
                        <button
                          type="button"
                          onClick={() => startEdit(employee)}
                          className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Demo — preview only</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </article>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/50 md:flex-row md:justify-end">
          <div className="relative ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {editing ? "Edit Employee" : "Add Employee"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
              >
                Cancel
              </button>
            </div>
            <form action={action} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={values.id} />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Full Name</label>
                <input
                  name="full_name"
                  value={values.full_name}
                  onChange={(e) => setValues((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Full name"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Email</label>
                <input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={values.phone}
                  onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="04xx xxx xxx"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Trade / Role</label>
                <input
                  name="trade_type"
                  value={values.trade_type}
                  onChange={(e) => setValues((p) => ({ ...p, trade_type: e.target.value }))}
                  placeholder="e.g. Electrician"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Hourly Rate ($)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  name="hourly_rate"
                  value={values.hourly_rate}
                  onChange={(e) => setValues((p) => ({ ...p, hourly_rate: e.target.value }))}
                  placeholder="e.g. 45"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                />
              </div>

              <LicenceSelect selected={selectedLicences} onChange={setSelectedLicences} />

              <div className="sm:col-span-2 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent-color)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  {editing ? "Save Changes" : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
