"use client";

import { useState, useRef } from "react";

type LineItem = {
  name: string;
  description?: string;
  sku?: string;
  unit_price: number;
  cost_price?: number;
  unit?: string;
  category?: string;
  type: "product" | "service";
  track_stock?: boolean;
  stock_qty?: number;
  low_stock_threshold?: number;
  active?: boolean;
};

type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

interface Props {
  onImported?: () => void;
}

const SAMPLE_CSV = `name,description,sku,type,unit_price,cost_price,unit,category,track_stock,stock_qty,low_stock_threshold
Labour - Electrician,,LAB-ELEC,service,145,0,hour,Labour,false,,,
Labour - Plumber,,LAB-PLUMB,service,135,0,hour,Labour,false,,,
15A GPO Double Socket,,ELE-GPO-D15,product,38.50,14.20,each,Electrical,true,50,10
LED Downlight 10W,,ELE-DL10,product,22.00,8.50,each,Electrical,true,100,20
25mm CPVC Pipe (per m),,PLM-CPVC25,product,12.80,4.90,metre,Plumbing,true,200,50
Call-out Fee - Standard,,SVC-CALL,service,99,0,each,Labour,false,,,
Emergency After-Hours Fee,,SVC-EMER,service,180,0,each,Labour,false,,,
Switchboard Upgrade - 3 Phase,,SVC-SB3P,service,1850,0,each,Electrical,false,,,`;

function parseCsv(text: string): { rows: LineItem[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row"] };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
  const rows: LineItem[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ""; });

    if (!row.name?.trim()) { errors.push(`Row ${i + 1}: name is required`); continue; }

    const price = parseFloat(row.unit_price);
    if (isNaN(price) || price < 0) { errors.push(`Row ${i + 1}: invalid unit_price "${row.unit_price}"`); continue; }

    const type = row.type === "product" ? "product" : "service";

    rows.push({
      name: row.name.trim(),
      description: row.description?.trim() || undefined,
      sku: row.sku?.trim() || undefined,
      type,
      unit_price: price,
      cost_price: row.cost_price ? parseFloat(row.cost_price) || 0 : 0,
      unit: row.unit?.trim() || (type === "service" ? "hour" : "each"),
      category: row.category?.trim() || undefined,
      track_stock: type === "product" && (row.track_stock?.toLowerCase() === "true" || row.track_stock === "1"),
      stock_qty: row.stock_qty ? parseInt(row.stock_qty) || 0 : 0,
      low_stock_threshold: row.low_stock_threshold ? parseInt(row.low_stock_threshold) || 5 : 5,
      active: row.active?.toLowerCase() !== "false",
    });
  }

  return { rows, errors };
}

export function PricebookImport({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [rawCsv, setRawCsv] = useState("");
  const [preview, setPreview] = useState<LineItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  function handleCsvChange(text: string) {
    setRawCsv(text);
    setResult(null);
    if (!text.trim()) { setPreview([]); setParseErrors([]); return; }
    const { rows, errors } = parseCsv(text);
    setPreview(rows);
    setParseErrors(errors);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleCsvChange(ev.target?.result as string);
    reader.readAsText(file);
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/pricebook/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: preview }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed");
      setResult({ imported: json.imported ?? preview.length, skipped: json.skipped ?? 0, errors: json.errors ?? [] });
      showToast(`${json.imported ?? preview.length} items imported successfully`);
      onImported?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import failed", false);
    } finally {
      setImporting(false);
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pricebook_template.csv";
    a.click(); URL.revokeObjectURL(url);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
      >
        ↑ Import CSV
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Import pricebook items">
        <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#1e2433] shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Import Pricebook Items</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">Paste CSV data or upload a file</p>
            </div>
            <button onClick={() => { setOpen(false); setRawCsv(""); setPreview([]); setParseErrors([]); setResult(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-2xl leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Sample download */}
            <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-4">
              <div className="text-2xl">📄</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">Need a template?</p>
                <p className="text-xs text-[var(--text-muted)]">Download a sample CSV with all supported columns</p>
              </div>
              <button onClick={downloadSample} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card)] flex-shrink-0">
                Download Sample
              </button>
            </div>

            {/* Upload or paste */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Upload CSV File</label>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-[var(--border)] py-6 flex flex-col items-center gap-2 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                >
                  <span className="text-3xl">📁</span>
                  <span className="text-sm text-[var(--text-muted)]">Click to browse</span>
                  <span className="text-xs text-[var(--text-muted)]">.csv files only</span>
                </button>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Paste CSV Data</label>
                <textarea
                  value={rawCsv}
                  onChange={(e) => handleCsvChange(e.target.value)}
                  rows={6}
                  placeholder={`name,type,unit_price\nLabour - Electrician,service,145\n...`}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 space-y-1">
                <p className="text-sm font-semibold text-red-400">{parseErrors.length} row{parseErrors.length > 1 ? "s" : ""} could not be parsed:</p>
                {parseErrors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-red-300">• {e}</p>
                ))}
                {parseErrors.length > 5 && <p className="text-xs text-red-400">…and {parseErrors.length - 5} more</p>}
              </div>
            )}

            {/* Preview table */}
            {preview.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Preview — {preview.length} item{preview.length > 1 ? "s" : ""} ready to import</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-xs">
                      <thead className="bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-0">
                        <tr>
                          {["Name", "Type", "SKU", "Unit Price", "Category", "Unit"].map((h) => (
                            <th key={h} className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((item, i) => (
                          <tr key={i} className="border-b border-[var(--border)] last:border-0">
                            <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{item.name}</td>
                            <td className="px-3 py-2">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${item.type === "product" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"}`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[var(--text-muted)] font-mono">{item.sku ?? "—"}</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">
                              {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(item.unit_price)}
                            </td>
                            <td className="px-3 py-2 text-[var(--text-muted)]">{item.category ?? "—"}</td>
                            <td className="px-3 py-2 text-[var(--text-muted)]">{item.unit ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Import result */}
            {result && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-300">✓ Import complete</p>
                <p className="text-xs text-emerald-400 mt-1">{result.imported} item{result.imported !== 1 ? "s" : ""} imported{result.skipped > 0 ? `, ${result.skipped} skipped` : ""}</p>
                {result.errors.length > 0 && result.errors.slice(0, 3).map((e, i) => (
                  <p key={i} className="text-xs text-amber-400 mt-0.5">• {e}</p>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border)] flex-shrink-0">
            <button
              onClick={() => { setOpen(false); setRawCsv(""); setPreview([]); setParseErrors([]); setResult(null); }}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
            >
              {result ? "Close" : "Cancel"}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={preview.length === 0 || importing}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {importing ? `Importing ${preview.length} items…` : `Import ${preview.length} Item${preview.length !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div role="alert" aria-live="polite"
          className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium text-white ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
