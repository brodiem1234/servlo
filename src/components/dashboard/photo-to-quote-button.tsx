"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

type QuoteExtraction = {
  description: string;
  line_items: LineItem[];
  notes: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function PhotoToQuoteButton() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be under 10 MB.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch("/api/ai/photo-to-quote", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? "Quote extraction failed");
      }

      const data = await res.json() as QuoteExtraction;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote extraction failed");
    } finally {
      setLoading(false);
      // Reset file input so the same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const closeModal = () => {
    setResult(null);
    setError(null);
  };

  const lineTotal = (item: LineItem) => item.quantity * item.unit_price;
  const quoteTotal = result?.line_items.reduce((sum, item) => sum + lineTotal(item), 0) ?? 0;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {/* Trigger button */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin text-[var(--accent-color)]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Analysing…
          </>
        ) : (
          <>📷 Photo to Quote</>
        )}
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Result modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Quote from Photo</h2>
              <button
                onClick={closeModal}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-1">Description</p>
              <p className="text-sm text-[var(--text-secondary)]">{result.description}</p>
            </div>

            {/* Line items table */}
            {result.line_items.length > 0 && (
              <div className="mb-4 overflow-hidden rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                        Description
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                        Unit Price
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {result.line_items.map((item, i) => (
                      <tr key={i} className="bg-[var(--bg-card)]">
                        <td className="px-3 py-2 text-[var(--text-primary)]">{item.description}</td>
                        <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-[var(--text-secondary)]">
                          ${Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-[var(--text-primary)]">
                          ${lineTotal(item).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
                      <td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        Total
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-[var(--text-primary)]">
                        ${quoteTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Notes */}
            {result.notes && (
              <div className="mb-4 rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-1">Notes</p>
                <p className="text-sm text-[var(--text-secondary)]">{result.notes}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  closeModal();
                  router.push("/dashboard/owner/quotes");
                }}
                className="flex-1 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Use this Quote
              </button>
              <button
                onClick={closeModal}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
