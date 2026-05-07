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
  Video,
  FolderOpen,
  ImageIcon,
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

type MediaFile = {
  id: string;
  name: string;
  size: number;
  type: "photo" | "video";
  dataUrl: string | null;
  badge: "none" | "Before" | "After" | "Result";
};

type PreviewLayout = "facebook_feed" | "instagram_feed" | "instagram_story";

type ColourOverlay = "none" | "blue" | "purple" | "orange" | "dark";

interface FormData {
  businessName: string;
  tradeType: string;
  phone: string;
  suburb: string;
  bizState: string;
  differentiator: string;
  goal: CampaignGoal | "";
  targetSuburb: string;
  targetRadius: number;
  mediaFiles: MediaFile[];
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

// ─── Static data ──────────────────────────────────────────────────────────────

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

const COPY_BADGES: { label: string; color: string; bg: string }[] = [
  { label: "Strong offer", color: "#10B981", bg: "rgb(16 185 129 / 0.15)" },
  { label: "Brand awareness", color: "#60A5FA", bg: "rgb(96 165 250 / 0.15)" },
  { label: "Social proof", color: "#F59E0B", bg: "rgb(245 158 11 / 0.15)" },
];

const MARKETING_ANGLES = ["direct response", "social proof", "problem-solution"] as const;

// Australian suburbs list (top ~200 across all states)
const AU_SUBURBS = [
  "Adelaide SA", "Norwood SA", "Glenelg SA", "Unley SA", "Prospect SA",
  "Burnside SA", "Mitcham SA", "Marion SA", "Tea Tree Gully SA", "Playford SA",
  "Gawler SA", "Mount Barker SA", "Victor Harbor SA", "Murray Bridge SA", "Port Augusta SA",
  "Sydney NSW", "Parramatta NSW", "Bondi NSW", "Surry Hills NSW", "Newtown NSW",
  "Manly NSW", "Chatswood NSW", "Penrith NSW", "Blacktown NSW", "Liverpool NSW",
  "Campbelltown NSW", "Wollongong NSW", "Newcastle NSW", "Maitland NSW", "Cessnock NSW",
  "Orange NSW", "Dubbo NSW", "Wagga Wagga NSW", "Albury NSW", "Bathurst NSW",
  "Melbourne VIC", "St Kilda VIC", "Fitzroy VIC", "Richmond VIC", "Prahran VIC",
  "Geelong VIC", "Ballarat VIC", "Bendigo VIC", "Frankston VIC", "Dandenong VIC",
  "Footscray VIC", "Moonee Ponds VIC", "Brunswick VIC", "Northcote VIC", "Preston VIC",
  "Sunshine VIC", "Werribee VIC", "Craigieburn VIC", "Berwick VIC", "Pakenham VIC",
  "Shepparton VIC", "Wodonga VIC", "Warnambool VIC", "Traralgon VIC", "Mildura VIC",
  "Brisbane QLD", "Gold Coast QLD", "Sunshine Coast QLD", "Ipswich QLD", "Toowoomba QLD",
  "Cairns QLD", "Townsville QLD", "Rockhampton QLD", "Mackay QLD", "Bundaberg QLD",
  "Hervey Bay QLD", "Gladstone QLD", "Mount Isa QLD", "Redcliffe QLD", "Logan QLD",
  "Redland Bay QLD", "Springfield QLD", "Caboolture QLD", "Nambour QLD", "Noosa QLD",
  "Perth WA", "Fremantle WA", "Joondalup WA", "Rockingham WA", "Mandurah WA",
  "Bunbury WA", "Geraldton WA", "Albany WA", "Kalgoorlie WA", "Broome WA",
  "Armadale WA", "Midland WA", "Baldivis WA", "Butler WA", "Cannington WA",
  "Ellenbrook WA", "Morley WA", "Bassendean WA", "Subiaco WA", "Cottesloe WA",
  "Hobart TAS", "Launceston TAS", "Devonport TAS", "Burnie TAS",
  "Glenorchy TAS", "Clarence TAS", "Sorell TAS", "New Norfolk TAS",
  "Darwin NT", "Alice Springs NT", "Palmerston NT",
  "Canberra ACT", "Belconnen ACT", "Tuggeranong ACT", "Woden ACT",
  "Gungahlin ACT", "Queanbeyan ACT",
  "Toowong QLD", "Fortitude Valley QLD", "Chermside QLD", "Carindale QLD",
  "Indooroopilly QLD", "Kenmore QLD", "Eight Mile Plains QLD", "Capalaba QLD",
  "Strathpine QLD", "North Lakes QLD",
  "Box Hill VIC", "Glen Waverley VIC", "Ringwood VIC", "Nunawading VIC",
  "Doncaster VIC", "Templestowe VIC", "Eltham VIC", "Diamond Creek VIC",
  "Heidelberg VIC", "Greensborough VIC",
  "Cronulla NSW", "Hurstville NSW", "Kogarah NSW", "Rockdale NSW",
  "Bankstown NSW", "Auburn NSW", "Granville NSW", "Merrylands NSW",
  "Epping NSW", "Hornsby NSW", "Pymble NSW", "Gordon NSW",
  "Castle Hill NSW", "Baulkham Hills NSW", "Rouse Hill NSW", "Kellyville NSW",
  "Dee Why NSW", "Brookvale NSW", "Mona Vale NSW", "Narrabeen NSW",
  "Neutral Bay NSW", "Cremorne NSW", "Mosman NSW", "Kirribilli NSW",
  "Strathfield NSW", "Burwood NSW", "Ashfield NSW", "Leichhardt NSW",
  "Glebe NSW", "Ultimo NSW", "Pyrmont NSW", "Woolloomooloo NSW",
  "Zetland NSW", "Mascot NSW", "Botany NSW", "Maroubra NSW",
  "Randwick NSW", "Coogee NSW", "Bronte NSW", "Waverley NSW",
  "Balmain NSW", "Rozelle NSW", "Annandale NSW", "Petersham NSW",
  "Marrickville NSW", "St Peters NSW", "Sydenham NSW", "Tempe NSW",
  "Southbank VIC", "Docklands VIC", "South Yarra VIC", "Toorak VIC",
  "Hawthorn VIC", "Camberwell VIC", "Canterbury VIC", "Malvern VIC",
  "Caulfield VIC", "Carnegie VIC", "Bentleigh VIC", "McKinnon VIC",
  "Moorabbin VIC", "Cheltenham VIC", "Mentone VIC", "Mordialloc VIC",
  "Chadstone VIC", "Oakleigh VIC", "Clayton VIC", "Springvale VIC",
  "Broadmeadows VIC", "Coburg VIC", "Reservoir VIC", "Thomastown VIC",
  "Bundoora VIC", "Lalor VIC", "Epping VIC", "South Morang VIC",
  "Whittlesea VIC", "Mernda VIC",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

// ─── Input style helper ───────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(139,92,246,0.08)",
  border: "1px solid rgba(139,92,246,0.3)",
  color: "#e2e8f0",
};

const INPUT_CLASS =
  "w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/70";

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
  const [angleIdx, setAngleIdx] = useState(0);
  const [editingCopyId, setEditingCopyId] = useState<string | null>(null);

  // Step 3 suburb autocomplete
  const [suburbInput, setSuburbInput] = useState("");
  const [suburbSuggestions, setSuburbSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Step 4 media
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showJobPhotosPlaceholder, setShowJobPhotosPlaceholder] = useState(false);
  const [loadingJobPhotos, setLoadingJobPhotos] = useState(false);

  // Step 6 preview controls
  const [previewDark, setPreviewDark] = useState(true);
  const [colourOverlay, setColourOverlay] = useState<ColourOverlay>("none");

  const [form, setForm] = useState<FormData>({
    businessName: "",
    tradeType: "",
    phone: "",
    suburb: "",
    bizState: "",
    differentiator: "",
    goal: "",
    targetSuburb: "",
    targetRadius: 10,
    mediaFiles: [],
    selectedCopy: null,
    previewLayout: "facebook_feed",
  });

  const totalSteps = 7;
  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const back = () => setStep((s) => Math.max(s - 1, 1));
  const update = (patch: Partial<FormData>) =>
    setForm((f) => ({ ...f, ...patch }));

  // ── Load business data on mount ───────────────────────────────────────────
  useEffect(() => {
    async function loadBiz() {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase
        .from("businesses")
        .select("business_name, phone, suburb, state, industries")
        .eq("owner_id", user.id)
        .single();
      if (biz) {
        const patch: Partial<FormData> = {};
        if (biz.business_name) patch.businessName = biz.business_name as string;
        if (biz.phone) patch.phone = biz.phone as string;
        if (biz.suburb) patch.suburb = biz.suburb as string;
        if (biz.state) patch.bizState = biz.state as string;
        if ((biz.industries as string[] | null)?.[0]) patch.tradeType = (biz.industries as string[])[0];
        if (Object.keys(patch).length > 0) setForm((f) => ({ ...f, ...patch }));
      }
    }
    void loadBiz();
  }, []);

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

  // ── Suburb autocomplete ───────────────────────────────────────────────────
  useEffect(() => {
    if (suburbInput.length >= 3) {
      const q = suburbInput.toLowerCase();
      const matches = AU_SUBURBS.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
      setSuburbSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuburbSuggestions([]);
      setShowSuggestions(false);
    }
  }, [suburbInput]);

  const pickSuburb = (entry: string) => {
    setSuburbInput(entry);
    update({ targetSuburb: entry });
    // Also extract state abbreviation
    const parts = entry.split(" ");
    const stateCode = parts[parts.length - 1];
    if (stateCode && stateCode.length <= 3) update({ bizState: stateCode });
    setShowSuggestions(false);
  };

  // ── Media helpers ─────────────────────────────────────────────────────────
  const addMediaFiles = (files: File[]) => {
    const remaining = 10 - form.mediaFiles.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const id = `media-${Date.now()}-${Math.random()}`;
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm((f) => ({
          ...f,
          mediaFiles: [
            ...f.mediaFiles,
            {
              id,
              name: file.name,
              size: file.size,
              type: isVideo ? "video" : "photo",
              dataUrl: e.target?.result as string | null,
              badge: "none",
            },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleBadge = (id: string) => {
    setForm((f) => ({
      ...f,
      mediaFiles: f.mediaFiles.map((m) => {
        if (m.id !== id) return m;
        const cycle: MediaFile["badge"][] = ["none", "Before", "After", "Result"];
        const idx = cycle.indexOf(m.badge);
        return { ...m, badge: cycle[(idx + 1) % cycle.length] };
      }),
    }));
  };

  const removeMedia = (id: string) => {
    setForm((f) => ({ ...f, mediaFiles: f.mediaFiles.filter((m) => m.id !== id) }));
  };

  // ── Generate AI copy ──────────────────────────────────────────────────────
  const handleGenerateCopy = async (angle?: string) => {
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
          angle,
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

  const handleDifferentAngle = () => {
    const next = (angleIdx + 1) % MARKETING_ANGLES.length;
    setAngleIdx(next);
    void handleGenerateCopy(MARKETING_ANGLES[next]);
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

  // Preview helpers
  const firstImage = form.mediaFiles.find((m) => m.type === "photo" && m.dataUrl);
  const overlayColors: Record<ColourOverlay, string> = {
    none: "transparent",
    blue: "rgba(59,130,246,0.35)",
    purple: "rgba(139,92,246,0.35)",
    orange: "rgba(249,115,22,0.35)",
    dark: "rgba(0,0,0,0.45)",
  };

  const activeCopies = adCopies.length ? adCopies : FALLBACK_COPY;

  return (
    <>
      <title>SERVLO Grow — AI Ad Creation</title>
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              AI Ad Creation
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Create a high-converting ad in easy steps.
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

          {/* ── Step 1: Business details ────────────────────────────── */}
          {step === 1 && (
            <div className="mt-6 space-y-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Your business details
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Pre-filled from your account — edit as needed for this campaign.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Business name
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => update({ businessName: e.target.value })}
                    placeholder="e.g. Adelaide Plumbing Co."
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => update({ phone: e.target.value })}
                    placeholder="e.g. 0400 123 456"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Trade type
                  </label>
                  <select
                    value={form.tradeType}
                    onChange={(e) => update({ tradeType: e.target.value })}
                    className={INPUT_CLASS}
                    style={{ ...INPUT_STYLE, appearance: "auto" }}
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
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Specialty / differentiator <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.differentiator}
                    onChange={(e) => update({ differentiator: e.target.value })}
                    placeholder="What makes your business stand out? (optional)"
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>
              <NavButtons step={step} totalSteps={totalSteps} onBack={back} onNext={next} nextDisabled={!form.businessName} />
            </div>
          )}

          {/* ── Step 2: Campaign goal ──────────────────────────────── */}
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

          {/* ── Step 3: Target area ────────────────────────────────── */}
          {step === 3 && (
            <div className="mt-6 space-y-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Target area
              </h2>

              {/* Suburb autocomplete */}
              <div className="relative">
                <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Target suburb or area
                </label>
                <input
                  type="text"
                  value={suburbInput}
                  onChange={(e) => {
                    setSuburbInput(e.target.value);
                    update({ targetSuburb: e.target.value });
                  }}
                  onFocus={() => suburbSuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Start typing a suburb… (e.g. Norwood)"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
                {showSuggestions && (
                  <ul
                    className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border shadow-xl"
                    style={{ background: "var(--bg-card)", borderColor: "rgba(139,92,246,0.4)" }}
                  >
                    {suburbSuggestions.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onMouseDown={() => pickSuburb(s)}
                          className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-purple-500/10"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Targeting info box */}
              {form.targetSuburb && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "#C4B5FD" }}
                >
                  <span>📍</span>
                  <span>
                    Targeting <strong>{form.targetSuburb}</strong> — estimated{" "}
                    <strong>{form.targetRadius} km</strong> radius
                  </span>
                </div>
              )}

              {/* Radius */}
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

          {/* ── Step 4: Media upload ───────────────────────────────── */}
          {step === 4 && (
            <div className="mt-6 space-y-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Add media
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Upload up to 10 photos or videos. Before/After shots perform best.
              </p>

              {/* Drop zone */}
              <button
                type="button"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addMediaFiles(Array.from(e.dataTransfer.files));
                }}
                onClick={() => photoInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 transition-colors"
                style={{
                  borderColor: dragOver ? "#8B5CF6" : "var(--border)",
                  background: dragOver ? "rgb(139 92 246 / 0.08)" : "var(--bg-secondary)",
                }}
              >
                <CloudUpload size={32} style={{ color: dragOver ? "#8B5CF6" : "var(--text-muted)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Drop photos here or click to browse
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  PNG, JPG — max 10 photos
                </p>
              </button>

              {/* Upload action buttons */}
              <div className="flex flex-wrap gap-2">
                {/* Photo */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                  style={{ borderColor: "rgba(139,92,246,0.4)", color: "#A78BFA", background: "rgba(139,92,246,0.08)" }}
                >
                  <ImageIcon size={13} /> Upload photos
                </button>
                {/* Video */}
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                  style={{ borderColor: "rgba(139,92,246,0.4)", color: "#A78BFA", background: "rgba(139,92,246,0.08)" }}
                >
                  <Video size={13} /> Upload video
                </button>
                {/* Folder */}
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                  style={{ borderColor: "rgba(139,92,246,0.4)", color: "#A78BFA", background: "rgba(139,92,246,0.08)" }}
                >
                  <FolderOpen size={13} /> Upload folder
                </button>
                {/* Pull from jobs */}
                <button
                  type="button"
                  onClick={() => {
                    if (showJobPhotosPlaceholder) return;
                    setLoadingJobPhotos(true);
                    setTimeout(() => {
                      setLoadingJobPhotos(false);
                      setShowJobPhotosPlaceholder(true);
                    }, 1200);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                  style={{ borderColor: "rgba(139,92,246,0.4)", color: "#A78BFA", background: "rgba(139,92,246,0.08)" }}
                >
                  {loadingJobPhotos ? <><Spinner /> Loading…</> : "📋 Use photos from recent jobs"}
                </button>
              </div>

              {/* Job photos placeholder */}
              {showJobPhotosPlaceholder && (
                <div
                  className="rounded-lg p-4 text-sm"
                  style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", color: "var(--text-muted)" }}
                >
                  Connect to SERVLO Core to pull job photos — coming soon
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addMediaFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept=".mp4,.mov,.avi,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addMediaFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <input
                ref={folderInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                // @ts-expect-error webkitdirectory is not in standard typings
                webkitdirectory=""
                className="hidden"
                onChange={(e) => {
                  addMediaFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />

              {/* Video tip */}
              <div
                className="rounded-lg px-3 py-2.5 text-xs"
                style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "#C4B5FD" }}
              >
                🎬 Video ads perform 3× better on Facebook and Instagram
              </div>

              {/* File grid */}
              {form.mediaFiles.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {form.mediaFiles.map((mf) => (
                    <div
                      key={mf.id}
                      className="relative flex flex-col overflow-hidden rounded-xl border"
                      style={{ width: 120, background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)" }}
                    >
                      {/* Preview */}
                      {mf.type === "video" ? (
                        mf.dataUrl ? (
                          <video
                            src={mf.dataUrl}
                            className="h-20 w-full object-cover"
                            muted
                          />
                        ) : (
                          <div className="flex h-20 items-center justify-center">
                            <Video size={24} style={{ color: "#A78BFA" }} />
                          </div>
                        )
                      ) : mf.dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mf.dataUrl} alt={mf.name} className="h-20 w-full object-cover" />
                      ) : (
                        <div className="flex h-20 items-center justify-center">
                          <ImageIcon size={24} style={{ color: "#A78BFA" }} />
                        </div>
                      )}

                      {/* Badge toggle */}
                      {mf.type === "photo" && (
                        <button
                          type="button"
                          onClick={() => toggleBadge(mf.id)}
                          className="absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-bold"
                          style={
                            mf.badge === "none"
                              ? { background: "rgba(0,0,0,0.45)", color: "#aaa" }
                              : mf.badge === "Before"
                              ? { background: "rgba(245,158,11,0.85)", color: "#fff" }
                              : mf.badge === "After"
                              ? { background: "rgba(16,185,129,0.85)", color: "#fff" }
                              : { background: "rgba(139,92,246,0.85)", color: "#fff" }
                          }
                        >
                          {mf.badge === "none" ? "+ Tag" : mf.badge}
                        </button>
                      )}

                      {/* Type badge */}
                      <div className="absolute right-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                        style={{ background: mf.type === "video" ? "rgba(59,130,246,0.8)" : "rgba(139,92,246,0.7)", color: "#fff" }}>
                        {mf.type}
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeMedia(mf.id)}
                        className="absolute -right-0 -top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-red-500 text-white"
                        style={{ top: 0, right: 0, borderRadius: "0 4px 0 6px" }}
                      >
                        <X size={10} />
                      </button>

                      {/* Info */}
                      <div className="px-2 py-1.5">
                        <p className="truncate text-[10px]" style={{ color: "var(--text-muted)" }}>{mf.name}</p>
                        <p className="text-[9px]" style={{ color: "var(--text-muted)", opacity: 0.7 }}>{formatBytes(mf.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <NavButtons step={step} totalSteps={totalSteps} onBack={back} onNext={goToStep5} />
            </div>
          )}

          {/* ── Step 5: AI copy ────────────────────────────────────── */}
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
                  onClick={() => handleGenerateCopy()}
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
                    Select the copy that best fits your campaign. Click ✏️ to edit or 🔄 to regenerate a card.
                  </p>

                  {/* 3 cards side by side */}
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    {activeCopies.slice(0, 3).map((copy, cardIdx) => {
                      const selected = form.selectedCopy?.id === copy.id;
                      const regenerating = regeneratingId === copy.id;
                      const badge = COPY_BADGES[cardIdx % COPY_BADGES.length];
                      const isEditing = editingCopyId === copy.id;

                      return (
                        <div
                          key={copy.id}
                          className="relative flex flex-col rounded-xl overflow-hidden"
                          style={{
                            background: selected ? "rgb(139 92 246 / 0.12)" : "var(--bg-secondary)",
                            border: `1px solid ${selected ? "#8B5CF6" : "rgba(139,92,246,0.4)"}`,
                            borderLeft: "3px solid #8B5CF6",
                          }}
                        >
                          {/* Confidence badge */}
                          <div
                            className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </div>

                          {/* Card body */}
                          <div className="flex flex-1 flex-col gap-2 p-4 pt-8">
                            {/* Headline */}
                            {isEditing ? (
                              <input
                                type="text"
                                value={copy.headline}
                                onChange={(e) =>
                                  setAdCopies((prev) => prev.map((c) => c.id === copy.id ? { ...c, headline: e.target.value } : c))
                                }
                                className="w-full rounded border bg-transparent px-2 py-1 text-base font-bold outline-none"
                                style={{ color: "var(--text-primary)", borderColor: "rgba(139,92,246,0.4)" }}
                              />
                            ) : (
                              <p className="text-base font-bold leading-snug" style={{ color: regenerating ? "var(--text-muted)" : "var(--text-primary)" }}>
                                {regenerating ? "Regenerating…" : copy.headline}
                              </p>
                            )}

                            {/* Primary text */}
                            {isEditing ? (
                              <textarea
                                value={copy.primaryText}
                                onChange={(e) =>
                                  setAdCopies((prev) => prev.map((c) => c.id === copy.id ? { ...c, primaryText: e.target.value } : c))
                                }
                                rows={4}
                                className="w-full flex-1 rounded border bg-transparent px-2 py-1 text-sm outline-none resize-none"
                                style={{ color: "var(--text-secondary)", borderColor: "rgba(139,92,246,0.4)" }}
                              />
                            ) : (
                              <p className="flex-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                {copy.primaryText}
                              </p>
                            )}

                            {/* CTA preview */}
                            <div
                              className="mt-auto rounded-lg py-2 text-center text-xs font-bold"
                              style={{ background: "#8B5CF6", color: "#fff" }}
                            >
                              {copy.cta}
                            </div>
                          </div>

                          {/* Card footer */}
                          <div
                            className="flex items-center justify-between border-t px-3 py-2"
                            style={{ borderColor: "rgba(139,92,246,0.2)" }}
                          >
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingCopyId(isEditing ? null : copy.id)}
                                className="rounded px-2 py-1 text-xs font-medium transition-colors"
                                style={{ color: isEditing ? "#A78BFA" : "var(--text-muted)", background: isEditing ? "rgba(139,92,246,0.15)" : "transparent" }}
                              >
                                ✏️ {isEditing ? "Done" : "Edit"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRegenerate(copy.id)}
                                disabled={regenerating}
                                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-opacity disabled:opacity-40"
                                style={{ color: "var(--text-muted)" }}
                                title="Regenerate this variation"
                              >
                                <RefreshCw size={11} className={regenerating ? "animate-spin" : ""} /> 🔄
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => update({ selectedCopy: copy })}
                              className="rounded-lg px-3 py-1 text-xs font-semibold transition-all"
                              style={{
                                background: selected ? "#8B5CF6" : "rgb(139 92 246 / 0.15)",
                                color: selected ? "#fff" : "#A78BFA",
                              }}
                            >
                              {selected ? "✓ Selected" : "Use this"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Different angle button */}
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={handleDifferentAngle}
                      disabled={generatingCopy}
                      className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
                      style={{ borderColor: "rgba(139,92,246,0.4)", color: "#A78BFA", background: "rgba(139,92,246,0.07)" }}
                    >
                      {generatingCopy ? <><Spinner /> Generating…</> : <>Generate completely different angle →</>}
                    </button>
                  </div>
                </>
              )}

              <NavButtons step={step} totalSteps={totalSteps} onBack={back} onNext={next} nextDisabled={!form.selectedCopy} />
            </div>
          )}

          {/* ── Step 6: Ad preview ─────────────────────────────────── */}
          {step === 6 && (
            <div className="mt-6 space-y-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Ad preview
              </h2>

              {/* 3 simultaneous previews */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                {/* ── Facebook Feed ── */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Facebook size={14} style={{ color: "#60A5FA" }} />
                    <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Facebook Feed</p>
                  </div>
                  <div
                    className="overflow-hidden rounded-xl border"
                    style={{
                      background: previewDark ? "#1a1035" : "#f0f2f5",
                      borderColor: "var(--border)",
                      width: "100%",
                    }}
                  >
                    {/* Post header */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: "#8B5CF6" }}
                      >
                        {(form.businessName || "YB").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: previewDark ? "#e2e8f0" : "#1c1e21" }}>
                          {form.businessName || "Your Business"}
                        </p>
                        <p className="text-[10px]" style={{ color: previewDark ? "#94a3b8" : "#606770" }}>
                          Sponsored · <span style={{ color: "#60A5FA" }}>ⓘ</span>
                        </p>
                      </div>
                    </div>
                    {/* Image area */}
                    <div
                      className="relative flex aspect-square items-center justify-center overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)" }}
                    >
                      {firstImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={firstImage.dataUrl!} alt="Ad" className="h-full w-full object-cover" />
                      )}
                      {!firstImage && (
                        <p className="text-xs" style={{ color: "#a78bfa" }}>Photo will appear here</p>
                      )}
                      {colourOverlay !== "none" && (
                        <div className="absolute inset-0" style={{ background: overlayColors[colourOverlay] }} />
                      )}
                    </div>
                    {/* Post footer */}
                    <div className="space-y-1 px-3 py-2.5">
                      <div
                        className="rounded border py-1.5 text-center text-xs font-bold"
                        style={{ background: "#8B5CF6", borderColor: "#8B5CF6", color: "#fff" }}
                      >
                        {form.selectedCopy?.cta ?? "Learn More"}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: previewDark ? "#e2e8f0" : "#1c1e21" }}>
                        {form.selectedCopy?.headline ?? "Your Headline Here"}
                      </p>
                      <p className="text-[10px]" style={{ color: previewDark ? "#94a3b8" : "#606770" }}>
                        {(form.selectedCopy?.primaryText ?? "Your primary ad text will appear here.").slice(0, 80)}…
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Instagram Feed ── */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Instagram size={14} style={{ color: "#F472B6" }} />
                    <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Instagram Feed</p>
                  </div>
                  <div
                    className="overflow-hidden rounded-xl border"
                    style={{
                      background: previewDark ? "#1a1035" : "#fff",
                      borderColor: "var(--border)",
                      width: "100%",
                    }}
                  >
                    {/* IG header */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #f093fb, #f5576c, #fda085)" }}
                      >
                        {(form.businessName || "YB").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold" style={{ color: previewDark ? "#e2e8f0" : "#262626" }}>
                          {form.businessName || "your_business"}
                        </p>
                        <p className="text-[9px]" style={{ color: previewDark ? "#94a3b8" : "#8e8e8e" }}>Sponsored</p>
                      </div>
                      <span style={{ color: previewDark ? "#94a3b8" : "#8e8e8e", fontSize: 16 }}>⋯</span>
                    </div>
                    {/* Image dominant */}
                    <div
                      className="relative flex aspect-square items-center justify-center overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)" }}
                    >
                      {firstImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={firstImage.dataUrl!} alt="Ad" className="h-full w-full object-cover" />
                      )}
                      {!firstImage && (
                        <p className="text-xs" style={{ color: "#a78bfa" }}>Photo will appear here</p>
                      )}
                      {colourOverlay !== "none" && (
                        <div className="absolute inset-0" style={{ background: overlayColors[colourOverlay] }} />
                      )}
                    </div>
                    {/* IG footer */}
                    <div className="px-3 py-2 space-y-1">
                      <div className="flex gap-3 text-base">
                        <span>🤍</span><span>💬</span><span>↗️</span>
                      </div>
                      <p className="text-[11px] font-semibold" style={{ color: previewDark ? "#e2e8f0" : "#262626" }}>
                        {form.businessName || "your_business"}{" "}
                        <span className="font-normal" style={{ color: previewDark ? "#94a3b8" : "#262626" }}>
                          {(form.selectedCopy?.primaryText ?? "Your ad copy here.").slice(0, 60)}…
                        </span>
                      </p>
                      <div
                        className="mt-1 rounded py-1.5 text-center text-[11px] font-bold"
                        style={{ background: "#8B5CF6", color: "#fff" }}
                      >
                        {form.selectedCopy?.cta ?? "Learn More"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Instagram Story ── */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Instagram size={14} style={{ color: "#FB923C" }} />
                    <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Instagram Story</p>
                  </div>
                  <div className="flex justify-center">
                    <div
                      className="relative flex flex-col overflow-hidden rounded-2xl border"
                      style={{
                        width: 180,
                        height: 320,
                        background: "linear-gradient(160deg, #4c1d95 0%, #1a0533 100%)",
                        borderColor: "var(--border)",
                      }}
                    >
                      {/* Story bg image */}
                      {firstImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstImage.dataUrl!}
                          alt="Ad"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      {colourOverlay !== "none" && (
                        <div className="absolute inset-0" style={{ background: overlayColors[colourOverlay] }} />
                      )}
                      {/* Gradient overlay for readability */}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />

                      {/* Story header */}
                      <div className="relative z-10 flex items-center gap-1.5 p-2.5">
                        <div className="h-6 w-6 rounded-full bg-purple-400" />
                        <div>
                          <p className="text-[10px] font-semibold text-white">{form.businessName || "Your Business"}</p>
                          <p className="text-[8px] text-purple-200">Sponsored</p>
                        </div>
                      </div>

                      {/* Headline overlay */}
                      <div className="relative z-10 mt-auto px-3 pb-1 text-center">
                        <p className="text-sm font-bold leading-tight text-white drop-shadow">
                          {form.selectedCopy?.headline ?? "Your Headline Here"}
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="relative z-10 p-3 pt-1">
                        <div className="rounded-full bg-white py-1.5 text-center text-[10px] font-bold text-purple-900">
                          {form.selectedCopy?.cta ?? "Learn More"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview controls */}
              <div className="flex flex-wrap items-center gap-4 rounded-lg border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                {/* Dark/Light toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Background:</span>
                  <button
                    type="button"
                    onClick={() => setPreviewDark((v) => !v)}
                    className="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
                    style={{
                      background: previewDark ? "#1e1b4b" : "#f0f2f5",
                      borderColor: "rgba(139,92,246,0.4)",
                      color: previewDark ? "#a78bfa" : "#374151",
                    }}
                  >
                    {previewDark ? "🌙 Dark" : "☀️ Light"}
                  </button>
                </div>
                {/* Colour overlay */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Overlay:</span>
                  <div className="flex gap-1.5">
                    {(["none", "blue", "purple", "orange", "dark"] as ColourOverlay[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColourOverlay(c)}
                        className="h-5 w-5 rounded-full border-2 transition-all"
                        style={{
                          background:
                            c === "none" ? "transparent" :
                            c === "blue" ? "#3B82F6" :
                            c === "purple" ? "#8B5CF6" :
                            c === "orange" ? "#F97316" :
                            "#111",
                          borderColor: colourOverlay === c ? "#fff" : "transparent",
                          boxShadow: colourOverlay === c ? "0 0 0 1px #8B5CF6" : "none",
                        }}
                        title={c}
                      >
                        {c === "none" && <X size={10} style={{ margin: "auto", color: "#888" }} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estimated reach */}
              <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-950/30 p-3 text-sm text-blue-300">
                📊 Estimated reach: 2,400–8,100 people at $15/day{" "}
                <span className="text-xs opacity-60">(based on typical metro targeting)</span>
              </div>

              <NavButtons step={step} totalSteps={totalSteps} onBack={back} onNext={next} />
            </div>
          )}

          {/* ── Step 7: Publish ────────────────────────────────────── */}
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

        {/* ── Saved campaigns list ──────────────────────────────────────────── */}
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
    </>
  );
}
