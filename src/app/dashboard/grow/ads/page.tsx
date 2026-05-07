"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  ChevronLeft,
  Target,
  Megaphone,
  TrendingUp,
  Gift,
  Sparkles,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  Facebook,
  Instagram,
  X,
  Copy,
  Trash2,
} from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignGoal =
  | "Lead Generation"
  | "Brand Awareness"
  | "Promotion"
  | "Seasonal Offer";

type AdCopy = {
  id: string;
  headline: string;
  primaryText: string;
  cta: string;
};

type PreviewLayout = "facebook_feed" | "instagram_feed" | "instagram_story";

interface FormData {
  businessName: string;
  tradeType: string;
  suburb: string;
  goal: CampaignGoal | "";
  targetSuburb: string;
  targetRadius: number;
  photos: string[];
  selectedCopy: AdCopy | null;
  previewLayout: PreviewLayout;
}

interface SavedCampaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  goal: string | null;
  headline: string | null;
}

// ─── Static seed data ─────────────────────────────────────────────────────────

const FALLBACK_COPY: AdCopy[] = [
  {
    id: "copy-1",
    headline: "Fast & Reliable Local Service",
    primaryText:
      "Same-day callouts across the Adelaide metro area. Licensed, insured and trusted by 500+ local homeowners. Get a free quote today.",
    cta: "Get Free Quote",
  },
  {
    id: "copy-2",
    headline: "Adelaide's Highest-Rated Tradies",
    primaryText:
      "⭐ 5-star rated on Google. We show up on time, do the job right first time, and clean up when we're done. Book online in 60 seconds.",
    cta: "Book Now",
  },
  {
    id: "copy-3",
    headline: "Save 20% This Month Only",
    primaryText:
      "Limited-time offer for new customers in your area. Quality workmanship at honest prices — no hidden call-out fees, no surprises.",
    cta: "Claim Offer",
  },
];

const TRADE_TYPES = [
  "Plumber",
  "Electrician",
  "Builder / Carpenter",
  "Cleaner",
  "Landscaper / Gardener",
  "Painter",
  "HVAC / Air Conditioning",
  "Pest Control",
  "Locksmith",
  "Other",
];

const GOALS: { value: CampaignGoal; description: string; Icon: LucideIcon }[] = [
  {
    value: "Lead Generation",
    description: "Capture contact details from people looking for your service.",
    Icon: Target,
  },
  {
    value: "Brand Awareness",
    description: "Get your business name in front of people in your area.",
    Icon: TrendingUp,
  },
  {
    value: "Promotion",
    description: "Highlight a special deal or discount to drive bookings fast.",
    Icon: Megaphone,
  },
  {
    value: "Seasonal Offer",
    description: "Run a time-limited campaign tied to a season or event.",
    Icon: Gift,
  },
];

const RADII = [5, 10, 20, 50];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all"
          style={{
            width: i + 1 === current ? "24px" : "8px",
            background: i + 1 <= current ? "#8B5CF6" : "rgb(139 92 246 / 0.2)",
          }}
        />
      ))}
      <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
        Step {current} of {total}
      </span>
    </div>
  );
}

// ─── Nav buttons ─────────────────────────────────────────────────────────────

function NavButtons({
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-4">
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <ChevronLeft size={15} /> Back
        </button>
      ) : (
        <div />
      )}
      {step < totalSteps && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: "#8B5CF6" }}
        >
          {nextLabel} <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function GrowAdsPage() {
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adCopies, setAdCopies] = useState<AdCopy[]>([]);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState<FormData>({
    businessName: "",
    tradeType: "",
    suburb: "",
    goal: "",
    targetSuburb: "",
    targetRadius: 10,
    photos: [],
    selectedCopy: null,
    previewLayout: "facebook_feed",
  });

  const totalSteps = 7;
  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const back = () => setStep((s) => Math.max(s - 1, 1));
  const update = (patch: Partial<FormData>) =>
    setForm((f) => ({ ...f, ...patch }));

  // ── Load saved campaigns ──────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    const sb = createSupabaseBrowser();
    const { data } = await sb
      .from("grow_campaigns")
      .select("id, name, status, created_at, goal, headline")
      .order("created_at", { ascending: false });
    setSavedCampaigns((data as SavedCampaign[]) ?? []);
    setCampaignsLoading(false);
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  // ── Generate AI copy ──────────────────────────────────────────────────────
  const handleGenerateCopy = async () => {
    setGeneratingCopy(true);
    try {
      const res = await fetch("/api/grow/generate-ad-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          trade: form.tradeType,
          suburb: form.suburb,
          goal: form.goal,
        }),
      });
      const data = (await res.json()) as { variations: Array<{ headline: string; primaryText: string; cta: string }> };
      const variations = data.variations ?? [];
      setAdCopies(
        variations.map((v, i) => ({ id: `copy-${i + 1}`, ...v }))
      );
    } catch {
      setAdCopies(FALLBACK_COPY);
    } finally {
      setGeneratingCopy(false);
    }
  };

  // Auto-generate when entering step 5
  const goToStep5 = () => {
    setStep(5);
    if (adCopies.length === 0) {
      void handleGenerateCopy();
    }
  };

  // Regenerate a single copy card
  const handleRegenerate = async (id: string) => {
    setRegeneratingId(id);
    try {
      const res = await fetch("/api/grow/generate-ad-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          trade: form.tradeType,
          suburb: form.suburb,
          goal: form.goal,
        }),
      });
      const data = (await res.json()) as { variations: Array<{ headline: string; primaryText: string; cta: string }> };
      const variations = data.variations ?? [];
      const idx = adCopies.findIndex((c) => c.id === id);
      if (idx >= 0 && variations[idx]) {
        setAdCopies((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...variations[idx] } : c))
        );
      }
    } catch {
      // no-op
    } finally {
      setRegeneratingId(null);
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/grow/save-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.businessName || "Untitled Campaign",
          goal: form.goal,
          target_suburb: form.targetSuburb,
          target_radius: form.targetRadius,
          headline: form.selectedCopy?.headline ?? null,
          primary_text: form.selectedCopy?.primaryText ?? null,
          cta: form.selectedCopy?.cta ?? null,
          status: "draft",
        }),
      });
      if (res.ok) {
        setSaved(true);
        void loadCampaigns();
      }
    } catch {
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  // Duplicate campaign
  const handleDuplicate = async (campaign: SavedCampaign) => {
    const sb = createSupabaseBrowser();
    const { data: full } = await sb
      .from("grow_campaigns")
      .select("*")
      .eq("id", campaign.id)
      .single();
    if (!full) return;
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = full as Record<string, unknown>;
    void _id; void _ca; void _ua;
    await sb.from("grow_campaigns").insert({ ...rest, name: `${campaign.name} (copy)`, status: "draft" });
    void loadCampaigns();
  };

  // Delete campaign
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const sb = createSupabaseBrowser();
    await sb.from("grow_campaigns").delete().eq("id", id);
    setDeletingId(null);
    setDeleteConfirmId(null);
    void loadCampaigns();
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    borderColor: "var(--border)",
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            AI Ad Studio
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Create a high-converting ad in 7 easy steps.
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
          style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
        >
          Coming soon
        </span>
      </div>

      <div className="rounded-xl border p-6" style={cardStyle}>
        <StepIndicator current={step} total={totalSteps} />

        {/* ── Step 1: Business details ─────────────────────────────── */}
        {step === 1 && (
          <div className="mt-6 space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Your business details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Business name
                </label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => update({ businessName: e.target.value })}
                  placeholder="e.g. Adelaide Plumbing Co."
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Trade type
                </label>
                <select
                  value={form.tradeType}
                  onChange={(e) => update({ tradeType: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  <option value="">Select a trade type…</option>
                  {TRADE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Your suburb
                </label>
                <input
                  type="text"
                  value={form.suburb}
                  onChange={(e) => update({ suburb: e.target.value })}
                  placeholder="e.g. Norwood SA"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>
            <NavButtons step={step} totalSteps={totalSteps} onBack={back} onNext={next} nextDisabled={!form.businessName} />
          </div>
        )}

        {/* ── Step 2: Campaign goal ────────────────────────────────── */}
        {step === 2 && (
          <div className="mt-6 space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              What&apos;s your campaign goal?
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {GOALS.map(({ value, description, Icon }) => {
                const selected = form.goal === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ goal: value })}
                    className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all"
                    style={{
                      background: selected ? "rgb(139 92 246 / 0.15)" : "var(--bg-secondary)",
                      borderColor: selected ? "#8B5CF6" : "var(--border)",
                    }}
                  >
                    <Icon size={22} style={{ color: selected ? "#A78BFA" : "var(--text-muted)" }} />
                    <p className="font-semibold" style={{ color: selected ? "#C4B5FD" : "var(--text-primary)" }}>
                      {value}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{description}</p>
                  </button>
                );
              })}
            </div>
            <NavButtons step={step} totalSteps={totalSteps} onBack={back} onNext={next} nextDisabled={!form.goal} />
          </div>
        )}

        {/* ── Step 3: Target area ──────────────────────────────────── */}
        {step === 3 && (
          <div className="mt-6 space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Target area
            </h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Target suburb or postcode
              </label>
              <input
                type="text"
                value={form.targetSuburb}
                onChange={(e) => update({ targetSuburb: e.target.value })}
                placeholder="e.g. Adelaide CBD, 5000"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Coverage radius
              </p>
              <div className="flex flex-wrap gap-2">
                {RADII.map((r) => {
                  const active = form.targetRadius === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => update({ targetRadius: r })}
                      className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
                      style={{
                        background: active ? "#8B5CF6" : "var(--bg-secondary)",
                        borderColor: active ? "#8B5CF6" : "var(--border)",
                        color: active ? "#fff" : "var(--text-secondary)",
                      }}
                    >
                      {r} km
                    </button>
                  );
                })}
              </div>
            </div>
            <NavButtons step={step} totalSteps={totalSteps} onBack={back} onNext={next} nextDisabled={!form.targetSuburb} />
          </div>
        )}

        {/* ── Step 4: Photos ───────────────────────────────────────── */}
        {step === 4 && (
          <div className="mt-6 space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Add photos
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Upload up to 5 photos. Before/After shots perform best.
            </p>

            <button
              type="button"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (form.photos.length < 5) {
                  const names = Array.from(e.dataTransfer.files)
                    .slice(0, 5 - form.photos.length)
                    .map((f) => f.name);
                  update({ photos: [...form.photos, ...names] });
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-colors"
              style={{
                borderColor: dragOver ? "#8B5CF6" : "var(--border)",
                background: dragOver ? "rgb(139 92 246 / 0.08)" : "var(--bg-secondary)",
              }}
            >
              <CloudUpload size={32} style={{ color: dragOver ? "#8B5CF6" : "var(--text-muted)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Drop photos here or click to browse
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>PNG, JPG — max 5 photos</p>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                const names = files.slice(0, 5 - form.photos.length).map((f) => f.name);
                update({ photos: [...form.photos, ...names] });
              }}
            />

            {form.photos.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {form.photos.map((name, idx) => (
                  <div
                    key={idx}
                    className="relative flex h-20 w-20 flex-col items-center justify-center rounded-lg border text-center"
                    style={{ background: "rgb(139 92 246 / 0.1)", borderColor: "var(--border)" }}
                  >
                    <p className="max-w-[68px] truncate px-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {name}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        update({ photos: form.photos.filter((_, i) => i !== idx) });
                      }}
                      className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <X size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <NavButtons step={step} totalSteps={totalSteps} onBack={back} onNext={goToStep5} />
          </div>
        )}

        {/* ── Step 5: AI copy ──────────────────────────────────────── */}
        {step === 5 && (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={18} style={{ color: "#8B5CF6" }} />
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  AI-generated ad copy
                </h2>
              </div>
              <button
                type="button"
                onClick={handleGenerateCopy}
                disabled={generatingCopy}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
                style={{ background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" }}
              >
                {generatingCopy ? <><Spinner /> Generating…</> : <><RefreshCw size={11} /> Generate</>}
              </button>
            </div>

            {generatingCopy && adCopies.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8" style={{ color: "var(--text-muted)" }}>
                <Spinner /> <span className="text-sm">Generating ad copy…</span>
              </div>
            ) : (
              <>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Select the copy that best fits your campaign, or regenerate for fresh variations.
                </p>
                <div className="space-y-3">
                  {(adCopies.length ? adCopies : FALLBACK_COPY).map((copy) => {
                    const selected = form.selectedCopy?.id === copy.id;
                    const regenerating = regeneratingId === copy.id;
                    return (
                      <div
                        key={copy.id}
                        className="rounded-xl border p-4"
                        style={{
                          background: selected ? "rgb(139 92 246 / 0.12)" : "var(--bg-secondary)",
                          borderColor: selected ? "#8B5CF6" : "var(--border)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="text"
                              value={regenerating ? "Regenerating…" : copy.headline}
                              onChange={(e) =>
                                setAdCopies((prev) => prev.map((c) => c.id === copy.id ? { ...c, headline: e.target.value } : c))
                              }
                              disabled={regenerating}
                              className="w-full rounded border-0 bg-transparent text-sm font-bold outline-none"
                              style={{ color: regenerating ? "var(--text-muted)" : "var(--text-primary)" }}
                            />
                            <textarea
                              value={copy.primaryText}
                              onChange={(e) =>
                                setAdCopies((prev) => prev.map((c) => c.id === copy.id ? { ...c, primaryText: e.target.value } : c))
                              }
                              rows={3}
                              className="w-full rounded border-0 bg-transparent text-sm outline-none resize-none"
                              style={{ color: "var(--text-secondary)" }}
                            />
                            <p className="text-xs font-semibold" style={{ color: "#A78BFA" }}>
                              CTA: {copy.cta}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRegenerate(copy.id)}
                            disabled={regenerating}
                            className="shrink-0 rounded-lg border p-1.5 transition-opacity disabled:opacity-40"
                            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                            title="Regenerate this variation"
                          >
                            <RefreshCw size={13} className={regenerating ? "animate-spin" : ""} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => update({ selectedCopy: copy })}
                          className="mt-3 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
                          style={{
                            background: selected ? "#8B5CF6" : "rgb(139 92 246 / 0.15)",
                            color: selected ? "#fff" : "#A78BFA",
                          }}
                        >
                          {selected ? "✓ Selected" : "Use this copy"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <NavButtons step={step} totalSteps={totalSteps} onBack={back} onNext={next} nextDisabled={!form.selectedCopy} />
          </div>
        )}

        {/* ── Step 6: Ad preview ───────────────────────────────────── */}
        {step === 6 && (
          <div className="mt-6 space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Ad preview
            </h2>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "facebook_feed", label: "Facebook Feed", Icon: Facebook },
                  { key: "instagram_feed", label: "Instagram Feed", Icon: Instagram },
                  { key: "instagram_story", label: "Instagram Story", Icon: Instagram },
                ] as { key: PreviewLayout; label: string; Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }[]
              ).map(({ key, label, Icon }) => {
                const active = form.previewLayout === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update({ previewLayout: key })}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: active ? "#8B5CF6" : "var(--bg-secondary)",
                      borderColor: active ? "#8B5CF6" : "var(--border)",
                      color: active ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={12} /> {label}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              {form.previewLayout === "instagram_story" ? (
                <div
                  className="relative flex w-64 flex-col overflow-hidden rounded-2xl border"
                  style={{ height: "420px", background: "linear-gradient(160deg, #4c1d95 0%, #1a0533 100%)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-2 p-3">
                    <div className="h-7 w-7 rounded-full bg-purple-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">{form.businessName || "Your Business"}</p>
                      <p className="text-[10px] text-purple-200">Sponsored</p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                    <p className="text-xl font-bold leading-tight text-white">
                      {form.selectedCopy?.headline ?? "Your Headline Here"}
                    </p>
                    <p className="mt-2 text-xs text-purple-200">
                      {form.selectedCopy?.primaryText?.slice(0, 80) ?? "Your ad copy will appear here."}…
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="rounded-full bg-white py-2 text-center text-xs font-bold text-purple-900">
                      {form.selectedCopy?.cta ?? "Learn More"}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full max-w-sm overflow-hidden rounded-xl border"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#8B5CF6" }}>
                        {form.previewLayout === "facebook_feed" ? <Facebook size={14} color="#fff" /> : <Instagram size={14} color="#fff" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          {form.businessName || "Your Business"}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Sponsored</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex h-52 items-center justify-center" style={{ background: "rgb(139 92 246 / 0.15)" }}>
                    {form.photos.length > 0 ? (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Photo: {form.photos[0]}</p>
                    ) : (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Photo will appear here</p>
                    )}
                  </div>
                  <div className="space-y-1 px-3 py-2">
                    <div className="flex items-center justify-between rounded border px-3 py-1.5" style={{ background: "#8B5CF6", borderColor: "#8B5CF6" }}>
                      <span className="text-xs font-bold text-white">{form.selectedCopy?.cta ?? "Learn More"}</span>
                    </div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {form.selectedCopy?.headline ?? "Your Headline Here"}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {form.selectedCopy?.primaryText?.slice(0, 90) ?? "Your primary ad text will appear here."}…
                    </p>
                  </div>
                </div>
              )}
            </div>

            <NavButtons step={step} totalSteps={totalSteps} onBack={back} onNext={next} />
          </div>
        )}

        {/* ── Step 7: Publish ──────────────────────────────────────── */}
        {step === 7 && (
          <div className="mt-6 space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Publish your ad
            </h2>

            {saved ? (
              <div
                className="flex flex-col items-center gap-3 rounded-xl border py-10 text-center"
                style={{ background: "rgb(139 92 246 / 0.08)", borderColor: "#8B5CF6" }}
              >
                <CheckCircle2 size={40} style={{ color: "#8B5CF6" }} />
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  Campaign saved as draft!
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  You can publish it once Meta integration launches in Q3 2026.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className="rounded-xl border p-4 space-y-2 text-sm"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                >
                  <p style={{ color: "var(--text-secondary)" }}>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Campaign: </span>
                    {form.businessName || "Untitled"} · {form.goal || "No goal"}
                  </p>
                  <p style={{ color: "var(--text-secondary)" }}>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Target: </span>
                    {form.targetSuburb || "Not set"} · {form.targetRadius} km radius
                  </p>
                  <p style={{ color: "var(--text-secondary)" }}>
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Headline: </span>
                    {form.selectedCopy?.headline ?? "None selected"}
                  </p>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold opacity-40 cursor-not-allowed"
                    style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    <Facebook size={16} /> Connect Facebook & Publish
                  </button>
                  <p className="mt-1 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    Meta connection coming soon (Q3 2026)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: "#8B5CF6" }}
                >
                  {saving ? "Saving…" : "Save as Draft"}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={back}
                className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                <ChevronLeft size={15} /> Back
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Saved campaigns list ─────────────────────────────────────────────── */}
      <div className="rounded-xl border" style={cardStyle}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Saved Campaigns
          </h2>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {savedCampaigns.length} total
          </span>
        </div>

        {campaignsLoading ? (
          <div className="flex items-center justify-center gap-2 py-8" style={{ color: "var(--text-muted)" }}>
            <Spinner /> <span className="text-sm">Loading…</span>
          </div>
        ) : savedCampaigns.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No saved campaigns yet. Complete the wizard and save a draft.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr
                  className="border-b text-left text-xs font-semibold uppercase"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedCampaigns.map((c) => (
                  <tr key={c.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                      <p className="font-medium">{c.name}</p>
                      {c.goal && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.goal}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                        style={
                          c.status === "active"
                            ? { background: "rgb(16 185 129 / 0.15)", color: "#10B981" }
                            : { background: "rgb(107 114 128 / 0.15)", color: "#9CA3AF" }
                        }
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(c.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(c)}
                          className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                          title="Duplicate campaign"
                        >
                          <Copy size={11} /> Duplicate
                        </button>
                        {deleteConfirmId === c.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id)}
                              disabled={deletingId === c.id}
                              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                              style={{ background: "#EF4444" }}
                            >
                              {deletingId === c.id ? "…" : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded-lg border px-2.5 py-1 text-xs"
                              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(c.id)}
                            className="rounded-lg border p-1 transition-colors"
                            style={{ borderColor: "var(--border)", color: "#EF4444" }}
                            title="Delete campaign"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
