"use client";

import { useRef, useState } from "react";

type ReceiptItem = { description: string; amount: number };

type ReceiptResult = {
  vendor: string | null;
  date: string | null;
  total: number | null;
  gst: number | null;
  line_items: ReceiptItem[];
};

type Props = {
  onResult?: (result: ReceiptResult) => void;
  className?: string;
};

export function ReceiptScanner({ onResult, className }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setScanning(true);
    try {
      // Convert to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const mediaType = file.type || "image/jpeg";

      const res = await fetch("/api/ai/ocr-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64, media_type: mediaType }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? "Scan failed");
      }

      const data = await res.json() as ReceiptResult;
      setResult(data);
      onResult?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] p-8 text-center hover:border-[var(--accent-color)] transition-colors"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Receipt preview" className="max-h-32 max-w-full rounded object-contain" />
        ) : (
          <span className="text-3xl" aria-hidden>🧾</span>
        )}
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {scanning ? "Scanning receipt…" : "Drop receipt image or click to upload"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Supports JPEG, PNG, WebP</p>
        </div>
        {scanning && (
          <div className="h-1 w-32 overflow-hidden rounded-full bg-[var(--border)]">
            <div className="h-full animate-pulse rounded-full bg-[var(--accent-color)]" style={{ width: "70%" }} />
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {result.vendor ?? "Unknown vendor"}
              {result.date ? <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">{result.date}</span> : null}
            </p>
            {result.total != null ? (
              <p className="text-sm font-bold text-[var(--text-primary)]">${Number(result.total).toFixed(2)}</p>
            ) : null}
          </div>
          {result.line_items.length > 0 ? (
            <ul className="space-y-1">
              {result.line_items.map((item, i) => (
                <li key={i} className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>{item.description}</span>
                  <span>${Number(item.amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {result.gst != null ? (
            <p className="text-xs text-[var(--text-muted)]">GST: ${Number(result.gst).toFixed(2)}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
