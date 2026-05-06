"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SuburbSuggestion } from "@/lib/suburb-suggestions";

type ClientRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status?: string | null;
  source?: string | null;
  company_name: string | null;
  abn: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  notes: string | null;
};

type Props = {
  open: boolean;
  /** null = create mode */
  client: ClientRecord | null;
  onClose: () => void;
  createClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  updateClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  onSaveSuccess?: (message: string) => void;
};

const defaultValues = {
  id: "",
  full_name: "",
  email: "",
  phone: "",
  status: "active",
  source: "other",
  company_name: "",
  abn: "",
  address: "",
  suburb: "",
  state: "",
  postcode: "",
  notes: ""
};

export default function ClientFormSheet({
  open,
  client,
  onClose,
  createClientAction,
  updateClientAction,
  onSaveSuccess
}: Props) {
  const router = useRouter();
  const editing = Boolean(client?.id);
  const [values, setValues] = useState(defaultValues);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [suburbQuery, setSuburbQuery] = useState("");
  const [suburbSuggestions, setSuburbSuggestions] = useState<SuburbSuggestion[]>([]);
  const [suburbOpen, setSuburbOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (client?.id) {
      setValues({
        id: client.id,
        full_name: client.full_name ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        status: client.status ?? "active",
        source: client.source ?? "other",
        company_name: client.company_name ?? "",
        abn: client.abn ?? "",
        address: client.address ?? "",
        suburb: client.suburb ?? "",
        state: client.state ?? "",
        postcode: client.postcode ?? "",
        notes: client.notes ?? ""
      });
      setSuburbQuery(client.suburb ?? "");
    } else {
      setValues(defaultValues);
      setSuburbQuery("");
    }
    setSuburbSuggestions([]);
    setSuburbOpen(false);
    setErrorBanner(null);
  }, [open, client]);

  useEffect(() => {
    if (!open || !suburbOpen) return;
    const q = suburbQuery.trim();
    if (q.length < 2) {
      setSuburbSuggestions([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/suburbs?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as SuburbSuggestion[];
        setSuburbSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuburbSuggestions([]);
      }
    }, 280);
    return () => window.clearTimeout(t);
  }, [suburbQuery, suburbOpen, open]);

  const pickSuburb = useCallback((s: SuburbSuggestion) => {
    setValues((prev) => ({
      ...prev,
      suburb: s.suburb,
      state: s.state || prev.state,
      postcode: s.postcode || prev.postcode
    }));
    setSuburbQuery(s.suburb);
    setSuburbOpen(false);
    setSuburbSuggestions([]);
  }, []);

  const action = async (formData: FormData) => {
    const result = editing ? await updateClientAction(formData) : await createClientAction(formData);
    if (result.ok) {
      const msg = editing ? "Client updated" : "Client added";
      onSaveSuccess?.(msg);
      onClose();
      router.refresh();
      return;
    }
    setErrorBanner(result.message ?? "Unable to save client");
  };

  const staticFields = useMemo(
    () =>
      [
        ["full_name", "Full Name"],
        ["email", "Email"],
        ["phone", "Phone"],
        ["company_name", "Company Name"],
        ["abn", "ABN"],
        ["address", "Address"],
        ["state", "State"],
        ["postcode", "Postcode"]
      ] as const,
    []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white p-5 shadow-xl dark:bg-[var(--bg-card)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{editing ? "Edit Client" : "Add Client"}</h2>
        {errorBanner ? (
          <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{errorBanner}</div>
        ) : null}
        <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={values.id} />
          {staticFields.map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">{label}</label>
              <input
                name={key}
                value={values[key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                className="h-10 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
              />
            </div>
          ))}
          <div className="relative sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Suburb</label>
            <input type="hidden" name="suburb" value={values.suburb} />
            <input
              autoComplete="off"
              value={suburbQuery}
              onChange={(e) => {
                const v = e.target.value;
                setSuburbQuery(v);
                setValues((prev) => ({ ...prev, suburb: v }));
                setSuburbOpen(true);
              }}
              onFocus={() => setSuburbOpen(true)}
              onBlur={() => window.setTimeout(() => setSuburbOpen(false), 180)}
              placeholder="Search suburb (Australia)"
              className="h-10 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
            />
            {suburbOpen && suburbSuggestions.length > 0 ? (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-[var(--border)] bg-[var(--bg-card)] shadow-lg">
                {suburbSuggestions.map((s, i) => (
                  <li key={`${s.label}-${i}`}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSuburb(s)}
                    >
                      <span className="font-medium">{s.suburb}</span>
                      {s.state || s.postcode ? (
                        <span className="block text-xs text-[var(--text-muted)]">
                          {s.state} {s.postcode}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-1 text-xs text-[var(--text-muted)]">Pick a suggestion to auto-fill state and postcode when available.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Client Status</label>
            <select
              name="status"
              value={values.status}
              onChange={(e) => setValues((prev) => ({ ...prev, status: e.target.value }))}
              className="h-10 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Source</label>
            <select
              name="source"
              value={values.source}
              onChange={(e) => setValues((prev) => ({ ...prev, source: e.target.value }))}
              className="h-10 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
            >
              <option value="referral">Referral</option>
              <option value="website">Website</option>
              <option value="walk-in">Walk-in</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Notes</label>
            <textarea
              name="notes"
              value={values.notes}
              onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
              className="min-h-24 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)]">
              Cancel
            </button>
            <button type="submit" className="rounded bg-[#0db8c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a9dab]">
              {editing ? "Save Changes" : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
