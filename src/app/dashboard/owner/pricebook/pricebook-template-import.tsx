"use client";

import { useState } from "react";
import { BookOpen, ChevronRight, Check, Loader2, X } from "lucide-react";

const TRADES = [
  { value: "plumbing",      label: "Plumbing",          items: 15, emoji: "🔧" },
  { value: "electrical",    label: "Electrical",         items: 14, emoji: "⚡" },
  { value: "cleaning",      label: "Cleaning",           items: 11, emoji: "🧹" },
  { value: "landscaping",   label: "Landscaping",        items: 14, emoji: "🌿" },
  { value: "hvac",          label: "HVAC / Air Con",     items: 10, emoji: "❄️" },
  { value: "pest_control",  label: "Pest Control",       items: 10, emoji: "🐛" },
  { value: "handyman",      label: "Handyman",           items: 11, emoji: "🛠️" },
  { value: "building",      label: "Building / Carpentry", items: 12, emoji: "🏗️" },
  { value: "painting",      label: "Painting",           items: 11, emoji: "🎨" },
  { value: "tiling",        label: "Tiling",             items: 10, emoji: "⬜" },
  { value: "concreting",    label: "Concreting",         items: 10, emoji: "🪨" },
  { value: "roofing",       label: "Roofing",            items: 12, emoji: "🏠" },
];

type Step = "select" | "confirm" | "done";

interface Props {
  onImported?: (count: number) => void;
}

export function PricebookTemplateImport({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setStep("select");
    setSelected(null);
    setResult(null);
    setError(null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function chooseTrade(trade: string) {
    setSelected(trade);
    setStep("confirm");
  }

  async function doImport() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pricebook/import-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed");
      setResult(json);
      setStep("done");
      onImported?.(json.imported);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  const selectedTrade = TRADES.find((t) => t.value === selected);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <BookOpen size={15} aria-hidden />
        Trade templates
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Import trade template">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} aria-hidden />
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {step === "select" && "Choose your trade"}
                {step === "confirm" && `Import ${selectedTrade?.label ?? ""} template`}
                {step === "done" && "Import complete"}
              </h2>
              <button type="button" onClick={close} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-primary)] transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {step === "select" && (
                <>
                  <p className="mb-4 text-sm text-[var(--text-secondary)]">
                    Pick your trade to add a curated starter pricebook. Existing items with the same name will be skipped.
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {TRADES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => chooseTrade(t.value)}
                        className="flex flex-col items-start gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-left transition hover:border-[var(--accent-color)] hover:bg-[color-mix(in_srgb,var(--accent-color)_6%,transparent)]"
                      >
                        <span className="text-xl" aria-hidden>{t.emoji}</span>
                        <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{t.label}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{t.items} items</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === "confirm" && selectedTrade && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                    <p className="text-2xl mb-2" aria-hidden>{selectedTrade.emoji}</p>
                    <p className="font-semibold text-[var(--text-primary)]">{selectedTrade.label}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {selectedTrade.items} items will be added to your pricebook.
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      Items with the same name as existing entries will be skipped.
                    </p>
                  </div>

                  {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setStep("select")}
                      disabled={loading}
                      className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={doImport}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-color)] hover:opacity-90 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                      {loading ? "Importing…" : "Import"}
                    </button>
                  </div>
                </div>
              )}

              {step === "done" && result && (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                    <Check size={24} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {result.imported} item{result.imported !== 1 ? "s" : ""} added
                    </p>
                    {result.skipped > 0 && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {result.skipped} skipped (already exist)
                      </p>
                    )}
                    {result.message && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">{result.message}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg bg-[var(--accent-color)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
