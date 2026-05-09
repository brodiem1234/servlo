"use client";

import { useState, useEffect, useRef } from "react";

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
};

interface Props {
  initialDocs: ComplianceDoc[];
}

const TEMPLATES = [
  { key: "swms_general", label: "SWMS — General Construction", type: "SWMS", description: "Safe Work Method Statement for general construction activities" },
  { key: "swms_height", label: "SWMS — Working at Heights", type: "SWMS", description: "Safe Work Method Statement for working at heights (>2m)" },
  { key: "swms_electrical", label: "SWMS — Electrical Work", type: "SWMS", description: "Safe Work Method Statement for electrical installation and maintenance" },
  { key: "swms_excavation", label: "SWMS — Excavation", type: "SWMS", description: "Safe Work Method Statement for excavation and trenching" },
  { key: "jsa_plumbing", label: "JSA — Plumbing", type: "JSA", description: "Job Safety Analysis for plumbing work" },
  { key: "jsa_hvac", label: "JSA — HVAC Installation", type: "JSA", description: "Job Safety Analysis for HVAC installation and maintenance" },
  { key: "jsa_roofing", label: "JSA — Roofing", type: "JSA", description: "Job Safety Analysis for roofing and guttering" },
  { key: "cert_induction", label: "Site Induction Record", type: "cert", description: "Worker site induction completion record" },
  { key: "cert_toolbox", label: "Toolbox Talk Record", type: "cert", description: "Toolbox talk attendance and topic record" },
  { key: "incident_report", label: "Incident Report", type: "incident", description: "Workplace incident / near-miss report form" },
];

function docTypeStyle(type: string) {
  switch (type) {
    case "SWMS":
      return "text-red-400 bg-red-500/10";
    case "JSA":
      return "text-orange-400 bg-orange-500/10";
    case "cert":
      return "text-blue-400 bg-blue-500/10";
    case "incident":
      return "text-amber-400 bg-amber-500/10";
    default:
      return "text-gray-400 bg-gray-500/10";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "complete":
      return "text-green-400 bg-green-500/10";
    case "expired":
      return "text-red-400 bg-red-500/10";
    default:
      return "text-gray-400 bg-gray-500/10";
  }
}

function templateIcon(type: string) {
  switch (type) {
    case "SWMS":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      );
    case "JSA":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
        </svg>
      );
    case "cert":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
      );
    case "incident":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10.5v3.75m-9.303 3.376C1.83 19.126 2.914 21 4.645 21h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 17.25h.007v.008H12v-.008Z" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );
  }
}

type ToastItem = { id: number; message: string; isError: boolean };

export default function ComplianceManager({ initialDocs }: Props) {
  const [docs, setDocs] = useState<ComplianceDoc[]>(initialDocs);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [creating, setCreating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const toastCounter = useRef(0);

  function addToast(message: string, isError = false) {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, isError }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  const docTypes = ["all", ...Array.from(new Set(TEMPLATES.map((t) => t.type)))];

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch =
      search.trim() === "" ||
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.doc_type.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || doc.doc_type === filterType;
    return matchesSearch && matchesType;
  });

  async function handleUseTemplate(template: (typeof TEMPLATES)[number]) {
    setCreating(template.key);
    try {
      const res = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: template.label, doc_type: template.type, template_key: template.key }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast(json.error ?? "Failed to create document", true);
      } else {
        setDocs((prev) => [json.doc, ...prev]);
        addToast(`"${template.label}" added to your documents`);
      }
    } catch {
      addToast("Network error — please try again", true);
    } finally {
      setCreating(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    // Optimistic update
    setDocs((prev) => prev.filter((d) => d.id !== id));
    try {
      const res = await fetch(`/api/compliance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted_at: new Date().toISOString() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        // Revert optimistic
        setDocs((prev) => {
          const original = initialDocs.find((d) => d.id === id);
          return original ? [original, ...prev] : prev;
        });
        addToast(json.error ?? "Failed to delete document", true);
      } else {
        addToast("Document deleted");
      }
    } catch {
      setDocs((prev) => {
        const original = initialDocs.find((d) => d.id === id);
        return original ? [original, ...prev] : prev;
      });
      addToast("Network error — please try again", true);
    } finally {
      setDeleting(null);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Compliance Documents
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Manage your SWMS, JSAs, induction records, and incident reports.
        </p>
      </div>

      {/* Template Library */}
      <section aria-labelledby="template-library-heading">
        <h2 id="template-library-heading" className="text-lg font-medium mb-4" style={{ color: "var(--text-primary)" }}>
          Template Library
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {TEMPLATES.map((template) => (
            <div
              key={template.key}
              className="rounded-xl p-4 flex flex-col gap-3 border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start gap-3">
                <span className={`rounded-lg p-2 ${docTypeStyle(template.type)}`}>
                  {templateIcon(template.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-primary)" }}>
                    {template.label}
                  </p>
                  <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${docTypeStyle(template.type)}`}>
                    {template.type}
                  </span>
                </div>
              </div>
              <p className="text-xs flex-1" style={{ color: "var(--text-muted)" }}>
                {template.description}
              </p>
              <button
                onClick={() => handleUseTemplate(template)}
                disabled={creating === template.key}
                aria-label={`Use template: ${template.label}`}
                className="mt-auto text-sm font-medium rounded-lg px-3 py-1.5 transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent-color)", color: "#fff" }}
              >
                {creating === template.key ? "Creating…" : "Use Template"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* My Documents */}
      <section aria-labelledby="my-documents-heading">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 id="my-documents-heading" className="text-lg font-medium flex-1" style={{ color: "var(--text-primary)" }}>
            My Documents
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="sr-only" htmlFor="doc-search">
              Search documents
            </label>
            <input
              id="doc-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="text-sm rounded-lg px-3 py-1.5 border w-full sm:w-48"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <label className="sr-only" htmlFor="doc-type-filter">
              Filter by type
            </label>
            <select
              id="doc-type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm rounded-lg px-3 py-1.5 border"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {docTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All types" : t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border py-16 gap-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ color: "var(--text-muted)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <div className="text-center">
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                {search || filterType !== "all" ? "No documents match your search" : "No documents yet"}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                {search || filterType !== "all"
                  ? "Try adjusting your search or filter"
                  : "Use a template above to create your first compliance document"}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table role="table" className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Name", "Type", "Status", "Signed", "Expiry", "Actions"].map((col) => (
                      <th
                        key={col}
                        scope="col"
                        className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      role="row"
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                        {doc.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${docTypeStyle(doc.doc_type)}`}>
                          {doc.doc_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                        {formatDate(doc.signed_at)}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                        {formatDate(doc.expiry_date)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleting === doc.id}
                          aria-label={`Delete document: ${doc.name}`}
                          className="text-xs px-2 py-1 rounded-lg border transition-opacity disabled:opacity-50 hover:bg-red-500/10"
                          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                        >
                          {deleting === doc.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y" style={{ borderColor: "var(--border)" }}>
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                      {doc.name}
                    </p>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                      aria-label={`Delete document: ${doc.name}`}
                      className="text-xs px-2 py-1 rounded-lg border flex-shrink-0 disabled:opacity-50"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      {deleting === doc.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${docTypeStyle(doc.doc_type)}`}>
                      {doc.doc_type}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span>Signed: {formatDate(doc.signed_at)}</span>
                    <span>Expires: {formatDate(doc.expiry_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Toast notifications */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto text-sm px-4 py-3 rounded-xl shadow-lg border max-w-xs ${
              toast.isError ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-green-500/30 bg-green-500/10 text-green-400"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
