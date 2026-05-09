"use client";

import { useState, useMemo, useRef, useEffect } from "react";

export type ComplianceDoc = {
  id: string;
  name: string;
  doc_type: string;
  template_key: string | null;
  status: string;
  signed_at: string | null;
  expiry_date: string | null;
  job_id: string | null;
  created_at: string;
  state?: string | null;
  notes?: string | null;
};

interface Props {
  initialDocs: ComplianceDoc[];
}

// ─── 24 templates ─────────────────────────────────────────────────────────────
const TEMPLATES = [
  // SWMS
  { key: "swms_general",      label: "SWMS — General Construction",        category: "SWMS",     description: "Safe Work Method Statement for general construction activities. Covers hazard identification, risk controls, PPE requirements.", states: ["ALL"] },
  { key: "swms_height",       label: "SWMS — Working at Heights",           category: "SWMS",     description: "For work above 2m. Includes ladder, scaffold, EWP and harness controls. Required by WHS Regs 2011.", states: ["ALL"] },
  { key: "swms_electrical",   label: "SWMS — Electrical Work",              category: "SWMS",     description: "Safe Work Method Statement for electrical installation, testing & maintenance. Includes isolation procedures.", states: ["ALL"] },
  { key: "swms_excavation",   label: "SWMS — Excavation & Trenching",       category: "SWMS",     description: "Covers excavation deeper than 1.5m. Battering, benching, shoring requirements and underground services.", states: ["ALL"] },
  { key: "swms_confined",     label: "SWMS — Confined Space Entry",         category: "SWMS",     description: "High-risk confined space entry permits, atmospheric testing, standby person requirements.", states: ["ALL"] },
  { key: "swms_demolition",   label: "SWMS — Demolition Works",             category: "SWMS",     description: "Demolition SWMS covering asbestos identification, structural stability and disposal requirements.", states: ["ALL"] },
  { key: "swms_hvac",         label: "SWMS — HVAC Installation",            category: "SWMS",     description: "HVAC installation and commissioning work — includes refrigerant handling, electrical connection.", states: ["ALL"] },
  // JSA
  { key: "jsa_plumbing",      label: "JSA — Plumbing & Drainage",           category: "JSA",      description: "Job Safety Analysis for plumbing including pipe work, drainage, hot water systems.", states: ["ALL"] },
  { key: "jsa_roofing",       label: "JSA — Roofing & Guttering",           category: "JSA",      description: "Job Safety Analysis for roof restoration, guttering, fascia and soffit work.", states: ["ALL"] },
  { key: "jsa_painting",      label: "JSA — Painting & Decorating",         category: "JSA",      description: "Covers interior/exterior painting including lead paint identification and solvent handling.", states: ["ALL"] },
  { key: "jsa_flooring",      label: "JSA — Flooring & Tiling",             category: "JSA",      description: "Job Safety Analysis for floor laying, tiling, adhesive use and slab cutting.", states: ["ALL"] },
  // Records
  { key: "cert_induction",    label: "Site Induction Record",                category: "Record",   description: "Worker site induction record including safety briefing sign-off and emergency procedure acknowledgement.", states: ["ALL"] },
  { key: "cert_toolbox",      label: "Toolbox Talk Register",                category: "Record",   description: "Toolbox talk attendance register with topic, presenter and attendee signatures.", states: ["ALL"] },
  { key: "cert_plant",        label: "Plant & Equipment Register",           category: "Record",   description: "Register of plant and equipment, inspection dates, service records and operator certifications.", states: ["ALL"] },
  { key: "cert_chemical",     label: "Hazardous Chemicals Register",         category: "Record",   description: "SDS register for hazardous chemicals on site. Includes storage, handling and disposal requirements.", states: ["ALL"] },
  { key: "cert_training",     label: "Worker Training Records",              category: "Record",   description: "Record of inductions, tickets, white cards, licences and refresher training for all workers.", states: ["ALL"] },
  // Incident
  { key: "incident_report",   label: "Incident / Near-Miss Report",          category: "Incident", description: "Workplace incident, injury or near-miss report. Required to be submitted to SafeWork within 48 hours for serious incidents.", states: ["ALL"] },
  { key: "injury_mgmt",       label: "Injury Management Plan",               category: "Incident", description: "Return-to-work plan and injury management register. Required by insurers in most states.", states: ["ALL"] },
  // State-specific
  { key: "vic_cpd",           label: "VIC — CPD Training Record",            category: "State",    description: "Victorian Building Authority CPD hours tracker for licence renewal.", states: ["VIC"] },
  { key: "qld_bss",           label: "QLD — BSS Maintenance Record",         category: "State",    description: "Queensland Building and Safety Standards maintenance compliance record.", states: ["QLD"] },
  { key: "nsw_owner_builder", label: "NSW — Owner-Builder Permit Log",       category: "State",    description: "NSW Fair Trading owner-builder permit works log and progress record.", states: ["NSW"] },
  { key: "wa_contractor_reg", label: "WA — Contractor Registration Log",     category: "State",    description: "Western Australia Building Services Board contractor registration evidence record.", states: ["WA"] },
  { key: "sa_plumbing_cert",  label: "SA — Plumbing Certificate of Work",    category: "State",    description: "South Australia plumbing certificate of compliance record.", states: ["SA"] },
  // Environmental
  { key: "env_waste",         label: "Waste Disposal Manifest",              category: "Environ",  description: "Controlled waste transport and disposal record required under environmental protection legislation.", states: ["ALL"] },
  { key: "env_spill",         label: "Spill Response Record",                category: "Environ",  description: "Chemical or hazardous material spill response record including containment actions taken.", states: ["ALL"] },
] as const;

type TemplateCategory = "SWMS" | "JSA" | "Record" | "Incident" | "State" | "Environ";

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  SWMS:     "bg-red-500/15 text-red-400 border-red-500/30",
  JSA:      "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Record:   "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Incident: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  State:    "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Environ:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat as TemplateCategory] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
}

const STATUS_STYLES: Record<string, string> = {
  complete: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  draft:    "bg-slate-500/15 text-slate-400 border-slate-500/30",
  expired:  "bg-red-500/15 text-red-400 border-red-500/30",
  active:   "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

function statusStyle(s: string): string { return STATUS_STYLES[s] ?? STATUS_STYLES.draft; }
function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
function isExpiringSoon(e: string | null | undefined): boolean {
  if (!e) return false;
  const d = new Date(e), w = new Date(); w.setDate(w.getDate() + 30);
  return d <= w && d >= new Date();
}
function isExpired(e: string | null | undefined): boolean {
  return !!e && new Date(e) < new Date();
}

const ALL_CATEGORIES: TemplateCategory[] = ["SWMS", "JSA", "Record", "Incident", "State", "Environ"];

export default function ComplianceManager({ initialDocs }: Props) {
  const [docs, setDocs] = useState<ComplianceDoc[]>(initialDocs);
  const [activeTab, setActiveTab] = useState<"documents" | "templates">("documents");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[number] | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [newDocName, setNewDocName] = useState("");
  const [newDocExpiry, setNewDocExpiry] = useState("");
  const [newDocJobId, setNewDocJobId] = useState("");
  const [newDocNotes, setNewDocNotes] = useState("");
  const [newDocState, setNewDocState] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    timerRef.current = setTimeout(() => setToast(null), 4000);
  };

  const expiringSoon = docs.filter((d) => d.status !== "expired" && isExpiringSoon(d.expiry_date));
  const expired = docs.filter((d) => isExpired(d.expiry_date));

  const filteredDocs = useMemo(() =>
    docs.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && d.doc_type !== categoryFilter) return false;
      if (search && !(d.name ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }), [docs, statusFilter, categoryFilter, search]);

  const filteredTemplates = useMemo(() =>
    TEMPLATES.filter((t) => {
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
      if (stateFilter !== "ALL" && !t.states.includes("ALL" as never) && !t.states.includes(stateFilter as never)) return false;
      if (search && !t.label.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }), [categoryFilter, stateFilter, search]);

  function openTemplate(tmpl: typeof TEMPLATES[number]) {
    setSelectedTemplate(tmpl);
    setCreating(true);
    setNewDocName(tmpl.label);
    setNewDocExpiry(""); setNewDocJobId(""); setNewDocNotes(""); setNewDocState("ALL");
  }

  async function handleCreate() {
    if (!selectedTemplate || !newDocName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDocName.trim(),
          doc_type: selectedTemplate.category,
          template_key: selectedTemplate.key,
          status: "draft",
          expiry_date: newDocExpiry || null,
          job_id: newDocJobId.trim() || null,
          notes: newDocNotes.trim() || null,
          state: newDocState,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      const newDoc: ComplianceDoc = json.document ?? {
        id: crypto.randomUUID(), name: newDocName.trim(),
        doc_type: selectedTemplate.category, template_key: selectedTemplate.key,
        status: "draft", signed_at: null, expiry_date: newDocExpiry || null,
        job_id: newDocJobId.trim() || null, created_at: new Date().toISOString(),
        state: newDocState, notes: newDocNotes.trim() || null,
      };
      setDocs((p) => [newDoc, ...p]);
      setSelectedTemplate(null); setCreating(false);
      setNewDocName(""); setNewDocExpiry(""); setNewDocJobId(""); setNewDocNotes("");
      showToast(`"${newDocName.trim()}" created`);
      setActiveTab("documents");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error creating document", false);
    } finally { setSaving(false); }
  }

  async function handleMarkComplete(doc: ComplianceDoc) {
    const prev = docs;
    setDocs((d) => d.map((x) => x.id === doc.id ? { ...x, status: "complete", signed_at: new Date().toISOString() } : x));
    try {
      const res = await fetch(`/api/compliance/${doc.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "complete", signed_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
      showToast(`"${doc.name}" marked complete`);
    } catch { setDocs(prev); showToast("Failed to update", false); }
  }

  async function handleDelete(doc: ComplianceDoc) {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    const prev = docs;
    setDocs((d) => d.filter((x) => x.id !== doc.id));
    try {
      const res = await fetch(`/api/compliance/${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(`"${doc.name}" deleted`);
    } catch { setDocs(prev); showToast("Failed to delete", false); }
  }

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {expiringSoon.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3" role="alert">
          <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-amber-300 text-sm">{expiringSoon.length} document{expiringSoon.length > 1 ? "s" : ""} expiring within 30 days</p>
            <p className="text-xs text-amber-400/80 mt-0.5">{expiringSoon.map((d) => d.name).join(", ")}</p>
          </div>
        </div>
      )}
      {expired.length > 0 && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-3" role="alert">
          <span className="text-red-400 text-lg flex-shrink-0">🚫</span>
          <div>
            <p className="font-semibold text-red-300 text-sm">{expired.length} document{expired.length > 1 ? "s" : ""} expired — renewal required</p>
            <p className="text-xs text-red-400/80 mt-0.5">{expired.map((d) => d.name).join(", ")}</p>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex gap-1">
          {(["documents", "templates"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-blue-500 text-blue-400" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
            >
              {tab === "documents" ? `My Documents (${docs.length})` : `Templates (${TEMPLATES.length})`}
            </button>
          ))}
        </div>
        {activeTab === "documents" && (
          <button onClick={() => setActiveTab("templates")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 mb-0.5">
            + New Document
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="search" placeholder={activeTab === "documents" ? "Search documents…" : "Search templates…"}
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search" />
        <div className="flex flex-wrap gap-1.5">
          {["ALL", ...ALL_CATEGORIES].map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter && cat !== "ALL" ? "ALL" : cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? cat === "ALL" ? "bg-blue-600 text-white border-blue-600" : `border ${categoryColor(cat)}`
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >{cat === "ALL" ? "All Types" : cat}</button>
          ))}
        </div>
        {activeTab === "documents" && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none">
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="complete">Complete</option>
            <option value="expired">Expired</option>
          </select>
        )}
        {activeTab === "templates" && (
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none">
            <option value="ALL">All States</option>
            {["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* ── DOCUMENTS ── */}
      {activeTab === "documents" && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm" aria-label="Compliance documents">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-card)]">
                <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Document Name</th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium hidden lg:table-cell">Expiry</th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium hidden lg:table-cell">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-[var(--text-secondary)] font-medium">No compliance documents yet</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Choose a template to get started</p>
                    <button onClick={() => setActiveTab("templates")}
                      className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      Browse Templates
                    </button>
                  </td>
                </tr>
              ) : filteredDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--text-primary)]">{doc.name}</div>
                    {doc.notes && <div className="text-xs text-[var(--text-muted)] truncate max-w-xs mt-0.5">{doc.notes}</div>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${categoryColor(doc.doc_type)}`}>{doc.doc_type}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${isExpired(doc.expiry_date) ? statusStyle("expired") : statusStyle(doc.status)}`}>
                      {isExpired(doc.expiry_date) ? "Expired" : doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {doc.expiry_date ? (
                      <span className={`text-xs ${isExpired(doc.expiry_date) ? "text-red-400 font-semibold" : isExpiringSoon(doc.expiry_date) ? "text-amber-400 font-semibold" : "text-[var(--text-muted)]"}`}>
                        {formatDate(doc.expiry_date)}{isExpiringSoon(doc.expiry_date) && !isExpired(doc.expiry_date) && " ⚠️"}
                      </span>
                    ) : <span className="text-xs text-[var(--text-muted)]">No expiry</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)] hidden lg:table-cell">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      {doc.status !== "complete" && (
                        <button onClick={() => handleMarkComplete(doc)}
                          className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                          ✓ Complete
                        </button>
                      )}
                      <button onClick={() => handleDelete(doc)}
                        className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label={`Delete ${doc.name}`}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {activeTab === "templates" && !creating && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((tmpl) => (
            <button key={tmpl.key} onClick={() => openTemplate(tmpl)}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Use template: ${tmpl.label}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${categoryColor(tmpl.category)}`}>{tmpl.category}</span>
                {!tmpl.states.includes("ALL" as never) && (
                  <span className="rounded bg-[var(--bg-primary)] border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">{tmpl.states.join(" / ")}</span>
                )}
              </div>
              <h3 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-blue-300 transition-colors leading-tight mb-1">{tmpl.label}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">{tmpl.description}</p>
              <div className="mt-3 flex items-center justify-end text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Use template →</div>
            </button>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-12 text-center text-[var(--text-muted)]">
              <p>No templates match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE FORM ── */}
      {creating && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Create compliance document">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1e2433] p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Create Document</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${categoryColor(selectedTemplate.category)}`}>{selectedTemplate.category}</span>
                  <span className="text-xs text-[var(--text-muted)]">{selectedTemplate.label}</span>
                </div>
              </div>
              <button onClick={() => { setSelectedTemplate(null); setCreating(false); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Document Name *</label>
                <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} autoFocus
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {selectedTemplate.category === "State" && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">State / Territory</label>
                  <select value={newDocState} onChange={(e) => setNewDocState(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">All / National</option>
                    {["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Expiry Date</label>
                  <input type="date" value={newDocExpiry} onChange={(e) => setNewDocExpiry(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Job Reference</label>
                  <input type="text" value={newDocJobId} onChange={(e) => setNewDocJobId(e.target.value)} placeholder="Optional"
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Notes</label>
                <textarea value={newDocNotes} onChange={(e) => setNewDocNotes(e.target.value)} rows={3}
                  placeholder="Hazards, specific controls, reference numbers…"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-3">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  <strong className="text-[var(--text-secondary)]">Template guidance:</strong> {selectedTemplate.description}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setSelectedTemplate(null); setCreating(false); }}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]">Cancel</button>
              <button onClick={handleCreate} disabled={!newDocName.trim() || saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Creating…" : "Create Document"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div role="alert" aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium text-white ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
