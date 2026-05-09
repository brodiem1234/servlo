"use client";

import { useState, useRef, useCallback } from "react";

type Quote = Record<string, unknown>;
type Business = Record<string, unknown>;
type LineItem = Record<string, unknown>;

interface Props {
  quote: Quote;
  business: Business;
  lineItems: LineItem[];
  token: string;
}

function formatAUD(val: unknown): string {
  const n = typeof val === "number" ? val : parseFloat(String(val ?? "0"));
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(isNaN(n) ? 0 : n);
}

function formatDate(val: unknown): string {
  if (!val) return "—";
  return new Date(val as string).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

export function PublicQuoteView({ quote, business, lineItems, token }: Props) {
  const [signing, setSigning] = useState(false);
  const [signName, setSignName] = useState("");
  const [signNameError, setSignNameError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Canvas signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const accent = (business.accent_colour as string | null) ?? "#6366F1";

  const statusAlreadySigned = String(quote.status ?? "").toLowerCase() === "accepted" || !!quote.signed_at;
  const isDeclined = String(quote.status ?? "").toLowerCase() === "declined";
  const isExpired = quote.expiry_date
    ? new Date(quote.expiry_date as string) < new Date()
    : false;

  const canInteract = !statusAlreadySigned && !isDeclined && !isExpired && !accepted && !declined;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Signature canvas ---
  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    lastRef.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(lastRef.current!.x, lastRef.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastRef.current = pos;
  }, []);

  const endDraw = useCallback(() => {
    drawingRef.current = false;
    lastRef.current = null;
  }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function isCanvasEmpty() {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return !data.some((b, i) => i % 4 === 3 && b > 0);
  }

  async function handleAccept() {
    if (!signName.trim()) {
      setSignNameError("Please enter your full name to sign");
      return;
    }
    setSignNameError("");
    if (isCanvasEmpty()) {
      showToast("Please draw your signature before accepting", false);
      return;
    }
    const canvas = canvasRef.current!;
    const signatureData = canvas.toDataURL("image/png");

    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signed_by_name: signName.trim(), signature_data: signatureData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to accept quote");
      setAccepted(true);
      setSigning(false);
      showToast("Quote accepted! The business has been notified.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error accepting quote", false);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline() {
    if (!confirm("Are you sure you want to decline this quote?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/sign`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to decline quote");
      setDeclined(true);
      showToast("Quote declined. The business has been notified.", true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error declining quote", false);
    } finally {
      setLoading(false);
    }
  }

  const subtotal = (lineItems as Array<{ quantity: unknown; unit_price: unknown }>)
    .reduce((s, item) => s + (parseFloat(String(item.quantity ?? 1)) * parseFloat(String(item.unit_price ?? 0))), 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 print:bg-white">
      {/* Header bar */}
      <div className="h-1.5 w-full" style={{ background: accent }} />

      <div className="max-w-3xl mx-auto px-4 py-10 print:py-4">
        {/* Business header */}
        <div className="flex items-start justify-between mb-8 print:mb-4">
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {String(business.business_name ?? "Your Business")}
            </div>
            {!!business.abn && (
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">ABN {String(business.abn)}</div>
            )}
            {!!business.phone && (
              <div className="text-sm text-slate-500 dark:text-slate-400">{String(business.phone)}</div>
            )}
            {!!business.email && (
              <div className="text-sm text-slate-500 dark:text-slate-400">{String(business.email)}</div>
            )}
          </div>
          <div className="text-right print:text-right">
            <div className="text-3xl font-bold" style={{ color: accent }}>QUOTE</div>
            <div className="text-slate-600 dark:text-slate-400 font-mono text-sm mt-1">
              {String(quote.quote_number ?? quote.id)}
            </div>
            {(quote.version as number) > 1 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Version {String(quote.version)}</div>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 print:mb-3">
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 print:border print:border-slate-300">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Prepared For</div>
            <div className="font-semibold text-slate-900 dark:text-slate-50">{String(quote.client_name ?? "Valued Client")}</div>
          </div>
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 print:border print:border-slate-300">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Date Issued</div>
            <div className="font-semibold text-slate-900 dark:text-slate-50">{formatDate(quote.created_at)}</div>
          </div>
          {!!quote.expiry_date && (
            <div className={`rounded-xl border p-4 print:border ${isExpired ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Valid Until</div>
              <div className={`font-semibold ${isExpired ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-50"}`}>
                {formatDate(quote.expiry_date)}
                {isExpired && " (Expired)"}
              </div>
            </div>
          )}
        </div>

        {/* Status banner */}
        {(accepted || statusAlreadySigned) && (
          <div className="mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3">
            <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-200">Quote Accepted</p>
              {!!quote.signed_by_name && (
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Signed by {String(quote.signed_by_name)} on {formatDate(quote.signed_at)}
                </p>
              )}
            </div>
          </div>
        )}
        {(declined || isDeclined) && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">Quote Declined</p>
              <p className="text-sm text-red-700 dark:text-red-300">This quote has been declined. Please contact the business if you&apos;d like to discuss.</p>
            </div>
          </div>
        )}
        {isExpired && !statusAlreadySigned && !declined && (
          <div className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4">
            <p className="font-semibold text-amber-800 dark:text-amber-200">Quote Expired</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">This quote has passed its expiry date. Please contact the business for an updated quote.</p>
          </div>
        )}

        {/* Line items */}
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 print:mb-3 print:border print:border-slate-300">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold">Description</th>
                <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold w-20">Qty</th>
                <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold w-28">Unit Price</th>
                <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-semibold w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">No line items</td>
                </tr>
              ) : (
                (lineItems as Array<{ description: unknown; quantity: unknown; unit_price: unknown; gst_applicable: unknown }>).map((item, i) => {
                  const qty = parseFloat(String(item.quantity ?? 1));
                  const price = parseFloat(String(item.unit_price ?? 0));
                  return (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                        {String(item.description ?? "")}
                        {!!item.gst_applicable && <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">(GST)</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{qty}</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{formatAUD(price)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">{formatAUD(qty * price)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Subtotal (ex. GST)</span>
              <span>{formatAUD(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>GST (10%)</span>
              <span>{formatAUD(gst)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 dark:text-slate-50 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Total</span>
              <span style={{ color: accent }}>{formatAUD(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {!!quote.notes && (
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 mb-6 print:mb-3 print:border print:border-slate-300">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Notes</div>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{String(quote.notes)}</p>
          </div>
        )}

        {/* Action buttons */}
        {canInteract && !signing && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6 print:hidden">
            <button
              onClick={() => setSigning(true)}
              className="flex-1 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ background: accent, "--tw-ring-color": accent } as React.CSSProperties}
            >
              ✓ Accept & Sign Quote
            </button>
            <button
              onClick={handleDecline}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
            >
              ✕ Decline
            </button>
            <button
              onClick={() => window.print()}
              className="py-3 px-4 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              aria-label="Print quote"
            >
              🖨
            </button>
          </div>
        )}

        {/* Signature panel */}
        {signing && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Sign quote"
            className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 p-6 mb-6 print:hidden"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">Accept &amp; Sign Quote</h2>

            {/* Name field */}
            <div className="mb-4">
              <label htmlFor="sign-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="sign-name"
                type="text"
                value={signName}
                onChange={(e) => { setSignName(e.target.value); setSignNameError(""); }}
                placeholder="e.g. Jane Smith"
                className={`w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 ${signNameError ? "border-red-400 dark:border-red-500 focus:ring-red-400" : "border-slate-300 dark:border-slate-600 focus:ring-indigo-400"}`}
                aria-describedby={signNameError ? "sign-name-error" : undefined}
                autoComplete="name"
              />
              {signNameError && (
                <p id="sign-name-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{signNameError}</p>
              )}
            </div>

            {/* Signature canvas */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Signature <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
                >
                  Clear
                </button>
              </div>
              <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={160}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                  className="w-full touch-none cursor-crosshair block"
                  aria-label="Signature drawing area"
                  role="img"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Draw your signature above using your mouse or finger</p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              By accepting this quote, you agree to the terms and conditions as stated. This constitutes a legally binding acceptance of the quoted services and pricing.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ background: accent }}
              >
                {loading ? "Signing…" : "Confirm Acceptance"}
              </button>
              <button
                onClick={() => { setSigning(false); setSignNameError(""); clearCanvas(); }}
                disabled={loading}
                className="py-2.5 px-4 rounded-xl font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-600 mt-8 print:mt-4">
          <p>This quote was prepared by {String(business.business_name ?? "the business")} and delivered securely via Servlo.</p>
          {!!quote.expiry_date && !isExpired && (
            <p className="mt-1">This quote is valid until {formatDate(quote.expiry_date)}.</p>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium text-white transition-all ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
