"use client";

import { useCallback, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

// ── Types ──────────────────────────────────────────────────────────────────

type ContactRow = {
  full_name: string;
  email: string | null;
  phone: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
};

type InvoiceRow = {
  contact_name: string;
  invoice_number: string;
  issue_date: string | null;
  due_date: string | null;
  description: string;
  quantity: number;
  unit_amount: number;
  tax_amount: number;
  total: number;
};

type ExportClient = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  client_type: string | null;
};

type ExportInvoice = {
  invoice_number: string | null;
  status: string | null;
  total: number | null;
  subtotal: number | null;
  gst: number | null;
  due_date: string | null;
  issue_date: string | null;
  notes: string | null;
  client_id: string | null;
};

// ── CSV helpers ────────────────────────────────────────────────────────────

function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

function csvRows(rows: string[][]): Array<Record<string, string>> {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.replace(/\s+/g, "").toLowerCase());
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cells[i] ?? "";
    });
    return obj;
  });
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      {children}
    </article>
  );
}

// ── Contacts importer ──────────────────────────────────────────────────────

function ContactsImporter({ ownerId }: { ownerId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ContactRow[] | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = csvRows(parseCsv(text));
      // Xero field names: ContactName, EmailAddress, Phone, Mobile, City/Town, State/Region, PostalCode
      const contacts: ContactRow[] = rows
        .map((r) => ({
          full_name: r["contactname"] || r["name"] || "",
          email: r["emailaddress"] || r["email"] || null,
          phone: r["phone"] || r["mobile"] || null,
          suburb: r["city/town"] || r["citytown"] || r["suburb"] || null,
          state: r["state/region"] || r["stateregion"] || r["state"] || null,
          postcode: r["postalcode"] || r["postcode"] || null,
        }))
        .filter((c) => c.full_name);
      setPreview(contacts);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(async () => {
    if (!preview?.length) return;
    setLoading(true);
    setStatus(null);
    try {
      const supabase = createSupabaseBrowser();
      const inserts = preview.map((c) => ({
        owner_id: ownerId,
        full_name: c.full_name,
        email: c.email || null,
        phone: c.phone || null,
        suburb: c.suburb || null,
        state: c.state || null,
        postcode: c.postcode || null,
        client_type: "customer",
        status: "active",
        is_demo: false,
      }));
      const { error } = await supabase
        .from("clients")
        .insert(inserts as any);
      if (error) throw new Error(error.message);
      setStatus({ ok: true, message: `Imported ${inserts.length} contacts successfully.` });
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : "Import failed." });
    } finally {
      setLoading(false);
    }
  }, [preview, ownerId]);

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-[var(--text-secondary)]">
        Upload a Xero Contacts CSV export. Columns used:{" "}
        <code className="rounded bg-[var(--bg-primary)] px-1 text-xs">ContactName, EmailAddress, Phone, Mobile, City/Town, State/Region, PostalCode</code>.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="block text-sm text-[var(--text-secondary)]"
      />
      {preview ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full min-w-[500px] text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <tr>
                  {["Name", "Email", "Phone", "Suburb", "State", "Postcode"].map((h) => (
                    <th key={h} className="px-2 py-1.5 text-left font-semibold text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((c, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td className="px-2 py-1.5 text-[var(--text-primary)]">{c.full_name}</td>
                    <td className="px-2 py-1.5 text-[var(--text-secondary)]">{c.email ?? "—"}</td>
                    <td className="px-2 py-1.5 text-[var(--text-secondary)]">{c.phone ?? "—"}</td>
                    <td className="px-2 py-1.5 text-[var(--text-secondary)]">{c.suburb ?? "—"}</td>
                    <td className="px-2 py-1.5 text-[var(--text-secondary)]">{c.state ?? "—"}</td>
                    <td className="px-2 py-1.5 text-[var(--text-secondary)]">{c.postcode ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Showing {Math.min(preview.length, 10)} of {preview.length} rows. All rows will be imported.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={handleImport}
            className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {loading ? "Importing…" : `Import ${preview.length} contacts`}
          </button>
        </>
      ) : null}
      {status ? (
        <p className={`text-sm ${status.ok ? "text-emerald-600" : "text-red-600"}`}>{status.message}</p>
      ) : null}
    </div>
  );
}

// ── Invoices importer ──────────────────────────────────────────────────────

function InvoicesImporter({ ownerId }: { ownerId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<InvoiceRow[] | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = csvRows(parseCsv(text));
      // Xero: ContactName, InvoiceNumber, InvoiceDate, DueDate, Description, Quantity, UnitAmount, TaxAmount, Currency
      const invoices: InvoiceRow[] = rows
        .map((r) => {
          const qty = parseFloat(r["quantity"] || "1") || 1;
          const unit = parseFloat(r["unitamount"] || "0") || 0;
          const tax = parseFloat(r["taxamount"] || "0") || 0;
          return {
            contact_name: r["contactname"] || r["contact"] || "",
            invoice_number: r["invoicenumber"] || r["reference"] || "",
            issue_date: r["invoicedate"] || r["issuedate"] || null,
            due_date: r["duedate"] || null,
            description: r["description"] || "Imported invoice",
            quantity: qty,
            unit_amount: unit,
            tax_amount: tax,
            total: qty * unit + tax,
          };
        })
        .filter((inv) => inv.contact_name);
      setPreview(invoices);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(async () => {
    if (!preview?.length) return;
    setLoading(true);
    setStatus(null);
    try {
      const supabase = createSupabaseBrowser();

      // Build a map of contact name → client id (case-insensitive)
      const { data: existingClients } = await supabase
        .from("clients")
        .select("id, full_name")
        .eq("owner_id", ownerId);
      const clientMap = new Map<string, string>(
        (existingClients ?? []).map((c: { id: string; full_name: string | null }) => [
          (c.full_name ?? "").toLowerCase().trim(),
          c.id,
        ])
      );

      let created = 0;
      let failed = 0;

      for (const inv of preview) {
        // Resolve or create client
        const key = inv.contact_name.toLowerCase().trim();
        let clientId = clientMap.get(key);
        if (!clientId) {
          const { data: newClient } = await supabase
            .from("clients")
            .insert({ owner_id: ownerId, full_name: inv.contact_name, client_type: "customer", is_demo: false })
            .select("id")
            .maybeSingle();
          if (newClient?.id) {
            clientId = newClient.id as string;
            clientMap.set(key, clientId);
          }
        }

        const subtotal = inv.quantity * inv.unit_amount;
        const gst = inv.tax_amount;
        const total = subtotal + gst;

        const { error } = await supabase.from("invoices").insert({
          owner_id: ownerId,
          client_id: clientId ?? null,
          invoice_number: inv.invoice_number || null,
          issue_date: inv.issue_date || null,
          due_date: inv.due_date || null,
          notes: inv.description || null,
          subtotal,
          gst,
          total,
          status: "draft",
          is_demo: false,
        } as any);

        if (error) {
          failed++;
        } else {
          created++;
        }
      }

      setStatus({ ok: failed === 0, message: `Imported ${created} invoice(s). ${failed > 0 ? `${failed} failed.` : ""}` });
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : "Import failed." });
    } finally {
      setLoading(false);
    }
  }, [preview, ownerId]);

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-[var(--text-secondary)]">
        Upload a Xero Invoices CSV export. Columns used:{" "}
        <code className="rounded bg-[var(--bg-primary)] px-1 text-xs">ContactName, InvoiceNumber, InvoiceDate, DueDate, Description, Quantity, UnitAmount, TaxAmount</code>.
        Unmatched contacts are auto-created.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="block text-sm text-[var(--text-secondary)]"
      />
      {preview ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full min-w-[600px] text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <tr>
                  {["Contact", "Invoice #", "Issue date", "Due date", "Total"].map((h) => (
                    <th key={h} className="px-2 py-1.5 text-left font-semibold text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((inv, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td className="px-2 py-1.5 text-[var(--text-primary)]">{inv.contact_name}</td>
                    <td className="px-2 py-1.5 text-[var(--text-secondary)]">{inv.invoice_number || "—"}</td>
                    <td className="px-2 py-1.5 text-[var(--text-secondary)]">{inv.issue_date || "—"}</td>
                    <td className="px-2 py-1.5 text-[var(--text-secondary)]">{inv.due_date || "—"}</td>
                    <td className="px-2 py-1.5 font-semibold text-[var(--text-primary)]">${inv.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Showing {Math.min(preview.length, 10)} of {preview.length} rows.
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={handleImport}
            className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {loading ? "Importing…" : `Import ${preview.length} invoices`}
          </button>
        </>
      ) : null}
      {status ? (
        <p className={`text-sm ${status.ok ? "text-emerald-600" : "text-red-600"}`}>{status.message}</p>
      ) : null}
    </div>
  );
}

// ── Export buttons ─────────────────────────────────────────────────────────

function ExportButtons({ ownerId }: { ownerId: string }) {
  const [loading, setLoading] = useState<"clients" | "invoices" | null>(null);

  const exportClients = useCallback(async () => {
    setLoading("clients");
    try {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase
        .from("clients")
        .select("id, full_name, email, phone, suburb, state, postcode, client_type")
        .eq("owner_id", ownerId)
        .eq("is_demo", false)
        .order("full_name");
      const rows = (data ?? []) as ExportClient[];
      const header = "ContactName,EmailAddress,Phone,Suburb,State,PostalCode,ClientType";
      const lines = rows.map((r) =>
        [
          JSON.stringify(r.full_name ?? ""),
          JSON.stringify(r.email ?? ""),
          JSON.stringify(r.phone ?? ""),
          JSON.stringify(r.suburb ?? ""),
          JSON.stringify(r.state ?? ""),
          JSON.stringify(r.postcode ?? ""),
          JSON.stringify(r.client_type ?? "customer"),
        ].join(",")
      );
      downloadCsv("servlo-clients.csv", [header, ...lines].join("\n"));
    } finally {
      setLoading(null);
    }
  }, [ownerId]);

  const exportInvoices = useCallback(async () => {
    setLoading("invoices");
    try {
      const supabase = createSupabaseBrowser();
      const [{ data: invData }, { data: clientData }] = await Promise.all([
        supabase
          .from("invoices")
          .select("invoice_number, status, total, subtotal, gst, due_date, issue_date, notes, client_id")
          .eq("owner_id", ownerId)
          .eq("is_demo", false)
          .order("due_date", { ascending: false }),
        supabase.from("clients").select("id, full_name").eq("owner_id", ownerId),
      ]);
      const clientNameById = new Map(
        (clientData ?? []).map((c: { id: string; full_name: string | null }) => [c.id, c.full_name ?? ""])
      );
      const rows = (invData ?? []) as ExportInvoice[];
      const header = "ContactName,InvoiceNumber,IssueDate,DueDate,Subtotal,GST,Total,Status,Notes";
      const lines = rows.map((r) =>
        [
          JSON.stringify(r.client_id ? clientNameById.get(r.client_id) ?? "" : ""),
          JSON.stringify(r.invoice_number ?? ""),
          JSON.stringify(r.issue_date ?? ""),
          JSON.stringify(r.due_date ?? ""),
          r.subtotal ?? 0,
          r.gst ?? 0,
          r.total ?? 0,
          JSON.stringify(r.status ?? ""),
          JSON.stringify(r.notes ?? ""),
        ].join(",")
      );
      downloadCsv("servlo-invoices.csv", [header, ...lines].join("\n"));
    } finally {
      setLoading(null);
    }
  }, [ownerId]);

  return (
    <div className="mt-3 flex flex-wrap gap-3">
      <button
        type="button"
        disabled={loading === "clients"}
        onClick={exportClients}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
      >
        {loading === "clients" ? "Exporting…" : "Export Clients CSV"}
      </button>
      <button
        type="button"
        disabled={loading === "invoices"}
        onClick={exportInvoices}
        className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
      >
        {loading === "invoices" ? "Exporting…" : "Export Invoices CSV"}
      </button>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export function XeroImportExport({ ownerId }: { ownerId: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Import Data</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Import your existing data from Xero. A preview of the rows to be imported will appear before you confirm.
        </p>
      </div>

      <Section title="Import Contacts from Xero">
        <ContactsImporter ownerId={ownerId} />
      </Section>

      <Section title="Import Invoices from Xero">
        <InvoicesImporter ownerId={ownerId} />
      </Section>

      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Export Data</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Export your SERVLO data as CSV files compatible with Xero and other accounting tools.
        </p>
      </div>

      <Section title="Export Data">
        <ExportButtons ownerId={ownerId} />
      </Section>
    </div>
  );
}
