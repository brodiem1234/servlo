"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

type BusinessBrand = {
  business_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  abn: string | null;
  accent_colour: string | null;
  logo_url: string | null;
  tagline: string | null;
  brand_voice: string | null;
};

type Props = {
  brand: BusinessBrand;
  saveAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
};

type Tone = "professional" | "friendly" | "authoritative";

const TONE_EXAMPLES: Record<Tone, string[]> = {
  professional: [
    "We deliver quality workmanship on every project, backed by a satisfaction guarantee.",
    "Our licensed technicians bring expertise and reliability to every job.",
    "Trust our team for timely, precise service that meets Australian standards.",
  ],
  friendly: [
    "Hey there! We're your local tradies — give us a ring and we'll sort it out!",
    "No job too big or small. We love helping our neighbours keep things running smoothly.",
    "We're the team your friends recommend. Come see why hundreds of locals trust us!",
  ],
  authoritative: [
    "Industry leaders delivering exceptional results. When precision matters, choose the experts.",
    "Unmatched technical expertise backed by years of experience in your area.",
    "The most trusted name in the trade. Our results speak for themselves.",
  ],
};

const PRESET_COLOURS = [
  { name: "SERVLO Blue", hex: "#3B82F6" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Orange", hex: "#F97316" },
  { name: "Slate", hex: "#475569" },
];

const TYPOGRAPHY_OPTIONS = [
  { id: "inter", label: "Inter", sample: "Clean & Modern", style: "font-sans" },
  { id: "serif", label: "Lora", sample: "Traditional & Trustworthy", style: "font-serif" },
  { id: "mono", label: "Mono", sample: "Technical & Precise", style: "font-mono" },
];

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-2xl ${ok ? "bg-emerald-600" : "bg-red-600"}`}
    >
      {msg}
    </div>
  );
}

export function BrandManager({ brand, saveAction }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [accentColour, setAccentColour] = useState(brand.accent_colour ?? "#3B82F6");
  const [tagline, setTagline] = useState(brand.tagline ?? "");
  const [brandVoice, setBrandVoice] = useState<Tone>((brand.brand_voice as Tone) ?? "professional");
  const [typography, setTypography] = useState("inter");
  const [previewTab, setPreviewTab] = useState<"invoice" | "email">("invoice");

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  function handleSave() {
    const fd = new FormData();
    fd.set("accent_colour", accentColour);
    fd.set("tagline", tagline);
    fd.set("brand_voice", brandVoice);
    startTransition(async () => {
      const result = await saveAction(fd);
      if (result.ok) {
        showToast("Brand settings saved", true);
        router.refresh();
      } else {
        showToast(result.error ?? "Failed to save", false);
      }
    });
  }

  const bizName = brand.business_name ?? "Your Business";
  const bizAddress = [brand.address, brand.suburb, brand.state].filter(Boolean).join(", ");

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Brand Kit</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage your brand assets, colours, and voice — reflected on all your documents.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: brand settings */}
        <div className="space-y-6">
          {/* Colour */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-4">Brand Colour</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              {PRESET_COLOURS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setAccentColour(c.hex)}
                  className="h-9 w-9 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c.hex,
                    borderColor: accentColour === c.hex ? c.hex : "transparent",
                    outline: accentColour === c.hex ? `2px solid ${c.hex}` : "none",
                    outlineOffset: "2px",
                  }}
                  aria-label={`Select ${c.name}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-[var(--text-muted)]">Custom colour</label>
              <input
                type="color"
                value={accentColour}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAccentColour(e.target.value)}
                className="h-8 w-14 cursor-pointer rounded border border-[var(--border)] p-0.5"
                aria-label="Custom colour picker"
              />
              <span className="font-mono text-sm text-[var(--text-secondary)]">{accentColour}</span>
            </div>
          </div>

          {/* Typography */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-4">Typography</h2>
            <div className="grid grid-cols-3 gap-2">
              {TYPOGRAPHY_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypography(t.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    typography === t.id
                      ? "border-[#8B5CF6] bg-[rgb(139_92_246/0.08)]"
                      : "border-[var(--border)] hover:border-[var(--accent-color)]"
                  }`}
                >
                  <p className={`text-lg font-semibold text-[var(--text-primary)] ${t.style}`}>Aa</p>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1">{t.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{t.sample}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tagline */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-4">Business Tagline</h2>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Fast, reliable, and always on time"
              maxLength={100}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg,var(--bg-secondary))] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/40"
            />
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">Appears on invoices, quotes, and your email footer.</p>
          </div>

          {/* Brand Voice */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-4">Brand Voice</h2>
            <div className="flex gap-2 mb-4">
              {(["professional", "friendly", "authoritative"] as Tone[]).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => setBrandVoice(tone)}
                  className="rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-all"
                  style={
                    brandVoice === tone
                      ? { background: "#8B5CF6", color: "#fff" }
                      : {
                          background: "var(--bg-secondary)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }
                  }
                >
                  {tone}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {TONE_EXAMPLES[brandVoice].map((phrase, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border-l-2 border-[#8B5CF6] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text-secondary)]"
                >
                  &ldquo;{phrase}&rdquo;
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Informs AI-generated copy for campaigns, review responses, and email templates.
            </p>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPreviewTab("invoice")}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                previewTab === "invoice"
                  ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Invoice Preview
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("email")}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                previewTab === "email"
                  ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Email Footer Preview
            </button>
          </div>

          {previewTab === "invoice" ? (
            <div
              className="rounded-xl border bg-white shadow-lg overflow-hidden"
              style={{ borderColor: accentColour + "33" }}
            >
              {/* Invoice header stripe */}
              <div className="h-1.5 w-full" style={{ background: accentColour }} />
              <div className="p-6">
                {/* Biz header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xl font-black text-slate-900" style={{ color: accentColour }}>
                      {bizName}
                    </p>
                    {tagline && (
                      <p className="text-xs text-slate-500 mt-0.5">{tagline}</p>
                    )}
                    {bizAddress && (
                      <p className="text-xs text-slate-400 mt-1">{bizAddress}</p>
                    )}
                    {brand.phone && (
                      <p className="text-xs text-slate-400">{brand.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">INVOICE</p>
                    <p className="text-xs text-slate-400">#INV-0001</p>
                    <p className="text-xs text-slate-400 mt-1">Due: 30 May 2026</p>
                  </div>
                </div>

                {/* Line items */}
                <div className="rounded-lg overflow-hidden border border-slate-100">
                  <div
                    className="flex text-xs font-semibold uppercase tracking-wide text-white px-3 py-2"
                    style={{ background: accentColour }}
                  >
                    <span className="flex-1">Description</span>
                    <span className="w-16 text-right">Qty</span>
                    <span className="w-20 text-right">Amount</span>
                  </div>
                  {[
                    { desc: "Labour — 2 hrs", qty: 1, amount: "$180.00" },
                    { desc: "Materials", qty: 1, amount: "$95.00" },
                  ].map((item) => (
                    <div key={item.desc} className="flex items-center px-3 py-2 text-xs text-slate-700 border-b border-slate-50">
                      <span className="flex-1">{item.desc}</span>
                      <span className="w-16 text-right">{item.qty}</span>
                      <span className="w-20 text-right font-mono">{item.amount}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 text-xs font-semibold">
                    <span className="text-slate-500">Total (incl. GST)</span>
                    <span className="font-bold text-slate-900 font-mono">$302.50</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400">
                    ABN: {brand.abn ?? "xx xxx xxx xxx"} · {brand.email ?? "hello@yourbusiness.com.au"}
                  </p>
                  <p
                    className="text-[10px] font-semibold"
                    style={{ color: accentColour }}
                  >
                    Thank you for your business
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Email footer preview */
            <div className="rounded-xl border bg-white shadow-lg overflow-hidden border-slate-100">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                <p className="text-xs text-slate-400">Email preview</p>
              </div>
              <div className="p-6 text-sm text-slate-700">
                <p>Hi Sarah,</p>
                <p className="mt-2">
                  Your invoice #INV-0001 for <strong>$302.50</strong> is due on 30 May 2026.
                </p>
                <p className="mt-2">
                  Please click the button below to pay online:
                </p>
                <div className="mt-4">
                  <a
                    className="inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: accentColour }}
                    href="#"
                  >
                    Pay Now
                  </a>
                </div>
              </div>
              <div
                className="px-6 py-4 border-t"
                style={{ borderColor: accentColour + "33", background: accentColour + "08" }}
              >
                <p className="font-bold text-sm" style={{ color: accentColour }}>{bizName}</p>
                {tagline && <p className="text-xs text-slate-500 mt-0.5">{tagline}</p>}
                <div className="flex gap-4 mt-1 text-xs text-slate-400">
                  {brand.phone && <span>📞 {brand.phone}</span>}
                  {brand.email && <span>✉ {brand.email}</span>}
                </div>
                <p className="text-[10px] text-slate-300 mt-2">
                  Powered by SERVLO · Unsubscribe
                </p>
              </div>
            </div>
          )}

          {/* Colour palette summary */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-3">Current Brand Palette</h3>
            <div className="flex gap-3">
              {[
                { label: "Primary", hex: accentColour },
                { label: "Dark", hex: "#1e293b" },
                { label: "Light", hex: "#f8fafc" },
              ].map(({ label, hex }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div
                    className="h-10 w-10 rounded-full border-2 border-white shadow"
                    style={{ background: hex }}
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
                  <p className="font-mono text-[10px] text-[var(--text-muted)]">{hex}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </section>
  );
}
