"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  CalendarDays,
  List,
  Plus,
  X,
  Sparkles,
  Clock,
  ChevronDown,
  Lightbulb,
  ThumbsUp,
  MessageCircle,
  Share,
  Heart,
  Bookmark,
} from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "calendar" | "list";
type Platform = "Facebook" | "Instagram" | "TikTok";

interface ContentIdea {
  hookLine: string;
  caption: string;
  hashtags: string[];
}

interface SocialPost {
  id: string;
  platforms: string[];
  caption: string;
  scheduled_at: string;
  status: "scheduled" | "published" | "draft";
}

// ─── Seed posts (client-side demo) ───────────────────────────────────────────

const SEED_POSTS: SocialPost[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number): Date[] {
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(year, month, 1); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function getMonthStartOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  Facebook: "#1877F2",
  Instagram: "#E1306C",
  TikTok: "#010101",
};

function platformDot(platform: string) {
  return { bg: PLATFORM_COLORS[platform as Platform] ?? "#6B7280" };
}

const STATUS_CLASSES: Record<SocialPost["status"], React.CSSProperties> = {
  scheduled: { background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" },
  published: { background: "rgb(16 185 129 / 0.15)", color: "#10B981" },
  draft: { background: "rgb(107 114 128 / 0.15)", color: "#9CA3AF" },
};

// Caption type pills for the inline AI sub-menu
const CAPTION_PILLS = [
  { value: "recent_job", label: "Recent completed job" },
  { value: "trade_tip", label: "Trade tip" },
  { value: "promotion", label: "Promotion" },
  { value: "behind_scenes", label: "Behind the scenes" },
  { value: "testimonial_request", label: "Client testimonial request" },
  { value: "seasonal", label: "Seasonal content" },
] as const;

type CaptionPillValue = (typeof CAPTION_PILLS)[number]["value"];

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ size = 3 }: { size?: number }) {
  return (
    <svg className={`h-${size} w-${size} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Platform Preview ─────────────────────────────────────────────────────────

function PlatformPreview({
  platform,
  caption,
  imageUrl,
  businessName,
}: {
  platform: Platform;
  caption: string;
  imageUrl?: string;
  businessName: string;
}) {
  const initials = businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const truncated = caption.length > 160 ? caption.slice(0, 160) + "…" : caption;
  const hashtags = caption.match(/#\w+/g) ?? [];
  const captionWithoutHashtags = caption.replace(/#\w+/g, "").trim().slice(0, 140);

  if (platform === "Facebook") {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#242526] text-sm" style={{ maxWidth: 360, margin: "0 auto" }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "#1877F2" }}>
            {initials || "BZ"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight" style={{ color: "#1c1e21" }}>
              {businessName || "Your Business"}
            </p>
            <p className="text-[11px]" style={{ color: "#65676b" }}>Sponsored · <span style={{ color: "#1877F2" }}>🌐</span></p>
          </div>
        </div>
        {/* Caption */}
        <div className="px-3 pb-2">
          <p className="text-[13px] leading-snug line-clamp-3" style={{ color: "#1c1e21" }}>
            {captionWithoutHashtags || <span style={{ color: "#9ca3af" }}>Your caption will appear here…</span>}
          </p>
          {caption.length > 140 && <span className="text-[11px]" style={{ color: "#65676b" }}>…more</span>}
        </div>
        {/* Image placeholder */}
        <div className="mx-0" style={{ background: "#f0f2f5", height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" style={{ height: 160 }} />
          ) : (
            <p className="text-[11px]" style={{ color: "#9ca3af" }}>Image will appear here</p>
          )}
        </div>
        {/* Action bar */}
        <div className="flex items-center justify-around border-t px-3 py-1.5" style={{ borderColor: "#e4e6eb" }}>
          {[{ Icon: ThumbsUp, label: "Like" }, { Icon: MessageCircle, label: "Comment" }, { Icon: Share, label: "Share" }].map(({ Icon, label }) => (
            <button key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold" style={{ color: "#65676b" }}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (platform === "Instagram") {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-sm" style={{ maxWidth: 340, margin: "0 auto" }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
            {initials || "BZ"}
          </div>
          <p className="font-semibold text-xs" style={{ color: "#262626" }}>{businessName || "yourbusiness"}</p>
          <span className="ml-auto text-xs font-semibold" style={{ color: "#0095f6" }}>Follow</span>
        </div>
        {/* Image */}
        <div style={{ background: "#efefef", height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" style={{ height: 200 }} />
          ) : (
            <p className="text-xs" style={{ color: "#9ca3af" }}>Photo will appear here</p>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-3 px-3 pt-2 pb-1">
          <Heart size={20} style={{ color: "#262626" }} />
          <MessageCircle size={20} style={{ color: "#262626" }} />
          <Share size={20} style={{ color: "#262626" }} />
          <Bookmark size={20} className="ml-auto" style={{ color: "#262626" }} />
        </div>
        {/* Caption */}
        <div className="px-3 pb-3">
          <p className="text-xs leading-snug">
            <span className="font-semibold" style={{ color: "#262626" }}>{businessName?.toLowerCase().replace(/\s+/g, "") || "yourbusiness"} </span>
            <span style={{ color: "#262626" }}>{captionWithoutHashtags || <span style={{ color: "#9ca3af" }}>Your caption will appear here…</span>}</span>
          </p>
          {hashtags.length > 0 && (
            <p className="mt-1 text-xs" style={{ color: "#00376b" }}>{hashtags.slice(0, 6).join(" ")}</p>
          )}
        </div>
      </div>
    );
  }

  // TikTok
  return (
    <div className="rounded-xl overflow-hidden text-sm relative" style={{ maxWidth: 220, margin: "0 auto", background: "#010101", height: 380 }}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-center px-4" style={{ color: "#9ca3af" }}>Video / Photo preview</p>
        </div>
      )}
      {/* Right side icons */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
        {[Heart, MessageCircle, Bookmark, Share].map((Icon, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Icon size={18} color="white" />
            </div>
          </div>
        ))}
      </div>
      {/* Bottom text */}
      <div className="absolute bottom-0 left-0 right-12 p-3">
        <p className="font-bold text-xs text-white mb-1">@{businessName?.toLowerCase().replace(/\s+/g, "") || "yourbusiness"}</p>
        <p className="text-[11px] text-white leading-snug line-clamp-3">
          {truncated || <span style={{ color: "#9ca3af" }}>Your caption will appear here…</span>}
        </p>
        {hashtags.length > 0 && (
          <p className="mt-1 text-[10px]" style={{ color: "#fe2c55" }}>{hashtags.slice(0, 4).join(" ")}</p>
        )}
      </div>
      {/* Profile handle top-left */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "#fe2c55" }}>
          {initials || "BZ"}
        </div>
      </div>
    </div>
  );
}

// ─── Create Post Panel ─────────────────────────────────────────────────────────

function CreatePostPanel({
  open,
  onClose,
  initialCaption,
  initialHashtags,
  onPostSaved,
}: {
  open: boolean;
  onClose: () => void;
  initialCaption: string;
  initialHashtags: string[];
  onPostSaved: (post: SocialPost) => void;
}) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("Facebook");
  const [fCaption, setFCaption] = useState(initialCaption);
  const [fScheduledAt, setFScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [captionVariations, setCaptionVariations] = useState<string[]>([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>(initialHashtags);
  const [businessName, setBusinessNameState] = useState("Your Business");

  // Sync initialCaption when panel opens / prop changes
  const prevOpen = useRef(false);
  React.useEffect(() => {
    if (open && !prevOpen.current) {
      setFCaption(initialCaption);
      setHashtagSuggestions(initialHashtags);
      setCaptionVariations([]);
      setShowAiMenu(false);
      setFScheduledAt("");
    }
    prevOpen.current = open;
  }, [open, initialCaption, initialHashtags]);

  // Fetch business name once
  React.useEffect(() => {
    async function loadBiz() {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase
        .from("businesses")
        .select("business_name")
        .eq("owner_id", user.id)
        .single();
      if (biz?.business_name) setBusinessNameState(biz.business_name);
    }
    void loadBiz();
  }, []);

  const handleGenerateCaptions = async (pillValue: CaptionPillValue) => {
    setShowAiMenu(false);
    setGeneratingCaption(true);
    setCaptionVariations([]);
    try {
      // Fetch business context
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      let bizContext = { business_name: "our business", industries: [] as string[], suburb: "your area", state: "Australia" };
      if (user) {
        const { data: biz } = await supabase
          .from("businesses")
          .select("business_name, industries, suburb, state")
          .eq("owner_id", user.id)
          .single();
        if (biz) bizContext = { ...bizContext, ...biz };
      }

      const res = await fetch("/api/grow/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: pillValue,
          businessName: bizContext.business_name,
          trade: bizContext.industries?.[0] ?? "trade",
          suburb: bizContext.suburb,
          state: bizContext.state,
          platform: selectedPlatform,
        }),
      });
      const data = (await res.json()) as { captions?: string[] };
      const variations = data.captions ?? [];
      setCaptionVariations(variations);
      // Auto-generate hashtag suggestions based on trade + platform
      const trade = bizContext.industries?.[0] ?? "trade";
      const suburb = bizContext.suburb ?? "Adelaide";
      const baseHashtags = [
        `tradie`, `${trade}`, `${suburb.toLowerCase().replace(/\s+/, "")}`,
        `local${trade}`, `australian${trade}`, `licensed${trade}`,
        `${trade}life`, `tradiesofinstagram`, `smallbusiness`, `localservices`,
        `australiantradies`, `handywork`,
      ].filter(Boolean).slice(0, 12);
      setHashtagSuggestions(baseHashtags);
    } catch {
      setCaptionVariations([
        "Another job done right! Our team wrapped up a great project this week. Tap the link in bio to book your free quote. #AdelaideTradie",
        "Proud of the work we do every day. Whether big or small, every job gets our full attention. DM us to get started. #LocalTradies",
        "Happy clients, quality work — that's what we're about. Available 7 days across the metro. Call us today! #ServiceBusiness",
      ]);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const appendHashtag = (tag: string) => {
    const toAppend = tag.startsWith("#") ? tag : `#${tag}`;
    setFCaption((prev) => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed} ${toAppend}` : toAppend;
    });
  };

  const setQuickSchedule = (preset: "today_6pm" | "tomorrow_7am" | "sat_9am") => {
    const now = new Date();
    let target: Date;
    if (preset === "today_6pm") {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0);
    } else if (preset === "tomorrow_7am") {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 7, 0);
    } else {
      // This Saturday
      const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSat, 9, 0);
    }
    // Format for datetime-local: YYYY-MM-DDTHH:MM
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
    setFScheduledAt(formatted);
  };

  const handlePostNow = async () => {
    if (!fCaption || [selectedPlatform].length === 0) return;
    setSaving(true);
    const newPost: SocialPost = {
      id: `local-${Date.now()}`,
      platforms: [selectedPlatform],
      caption: fCaption,
      scheduled_at: new Date().toISOString(),
      status: "published",
    };
    try {
      await fetch("/api/grow/save-social-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: [selectedPlatform], caption: fCaption, scheduled_at: new Date().toISOString(), status: "published" }),
      });
    } catch { /* silent */ }
    onPostSaved(newPost);
    onClose();
    setSaving(false);
  };

  const handleSchedulePost = async () => {
    if (!fCaption || !fScheduledAt) return;
    setSaving(true);
    const newPost: SocialPost = {
      id: `local-${Date.now()}`,
      platforms: [selectedPlatform],
      caption: fCaption,
      scheduled_at: new Date(fScheduledAt).toISOString(),
      status: "scheduled",
    };
    try {
      await fetch("/api/grow/save-social-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: [selectedPlatform], caption: fCaption, scheduled_at: new Date(fScheduledAt).toISOString(), status: "scheduled" }),
      });
    } catch { /* silent */ }
    onPostSaved(newPost);
    onClose();
    setSaving(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-49"
        style={{ background: "rgba(0,0,0,0.6)", zIndex: 49 }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden shadow-2xl"
        style={{
          width: "min(900px, 100vw)",
          background: "#111927",
          zIndex: 50,
          borderLeft: "1px solid rgb(255 255 255 / 0.08)",
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "rgb(255 255 255 / 0.08)" }}
        >
          <h2 className="text-base font-bold text-white">Create Social Post</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — two halves */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: form */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5" style={{ borderRight: "1px solid rgb(255 255 255 / 0.08)" }}>
            {/* Platform selector */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Platform</p>
              <div className="flex flex-wrap gap-2">
                {(["Facebook", "Instagram", "TikTok"] as Platform[]).map((pl) => {
                  const selected = selectedPlatform === pl;
                  return (
                    <button
                      key={pl}
                      type="button"
                      onClick={() => setSelectedPlatform(pl)}
                      className="rounded-full px-4 py-1.5 text-sm font-semibold transition-all border"
                      style={{
                        background: selected ? PLATFORM_COLORS[pl] : "transparent",
                        color: selected ? (pl === "TikTok" ? "white" : "white") : "rgba(255,255,255,0.6)",
                        borderColor: selected ? PLATFORM_COLORS[pl] : "rgba(255,255,255,0.15)",
                      }}
                    >
                      {pl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Caption */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Caption</p>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{fCaption.length}/2200</span>
              </div>
              <textarea
                value={fCaption}
                onChange={(e) => setFCaption(e.target.value.slice(0, 2200))}
                rows={5}
                placeholder="Write your post caption…"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  background: "rgb(255 255 255 / 0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  resize: "vertical",
                }}
              />

              {/* AI caption generate — inline sub-menu */}
              <div className="relative mt-2">
                <button
                  type="button"
                  onClick={() => setShowAiMenu((v) => !v)}
                  disabled={generatingCaption}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
                  style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
                >
                  {generatingCaption ? (
                    <><Spinner size={3} /> Generating…</>
                  ) : (
                    <><Sparkles size={11} /> Generate caption with AI <ChevronDown size={11} /></>
                  )}
                </button>

                {showAiMenu && (
                  <div
                    className="mt-2 rounded-xl border p-3"
                    style={{ background: "rgb(255 255 255 / 0.04)", borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    <p className="mb-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>What&apos;s this post about?</p>
                    <div className="flex flex-wrap gap-2">
                      {CAPTION_PILLS.map((pill) => (
                        <button
                          key={pill.value}
                          type="button"
                          onClick={() => void handleGenerateCaptions(pill.value)}
                          className="rounded-full border px-3 py-1 text-xs font-medium transition-all hover:border-purple-400 hover:bg-purple-500/10"
                          style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Caption variation cards */}
              {captionVariations.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Click a variation to use it:</p>
                  {captionVariations.map((cap, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setFCaption(cap); setCaptionVariations([]); }}
                      className="w-full rounded-lg border p-3 text-left text-xs transition-all hover:border-purple-500/50"
                      style={{
                        background: fCaption === cap ? "rgb(139 92 246 / 0.15)" : "rgb(255 255 255 / 0.04)",
                        borderColor: fCaption === cap ? "#8B5CF6" : "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      <span className="line-clamp-3">{cap}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hashtag suggestions */}
            {hashtagSuggestions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Hashtag suggestions — click to add</p>
                <div className="flex flex-wrap gap-1.5">
                  {hashtagSuggestions.map((tag) => {
                    const full = tag.startsWith("#") ? tag : `#${tag}`;
                    const used = fCaption.includes(full);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => appendHashtag(tag)}
                        disabled={used}
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium transition-all disabled:opacity-40"
                        style={{
                          background: used ? "rgb(139 92 246 / 0.25)" : "rgb(139 92 246 / 0.12)",
                          color: used ? "#C4B5FD" : "#A78BFA",
                          border: "1px solid rgba(139, 92, 246, 0.3)",
                        }}
                      >
                        {full}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scheduling row */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                <Clock size={11} className="inline mr-1" />Schedule
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setQuickSchedule("today_6pm")}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all border hover:border-purple-500/50"
                  style={{ background: "rgb(255 255 255 / 0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                >
                  Today 6pm
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSchedule("tomorrow_7am")}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all border hover:border-purple-500/50"
                  style={{ background: "rgb(255 255 255 / 0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                >
                  Tomorrow 7am
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSchedule("sat_9am")}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all border hover:border-purple-500/50"
                  style={{ background: "rgb(255 255 255 / 0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                >
                  This Sat 9am
                </button>
              </div>
              <input
                type="datetime-local"
                value={fScheduledAt}
                onChange={(e) => setFScheduledAt(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  background: "rgb(255 255 255 / 0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  colorScheme: "dark",
                }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => void handlePostNow()}
                disabled={saving || !fCaption}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: "#8B5CF6" }}
              >
                {saving ? "Saving…" : "Post now"}
              </button>
              <button
                type="button"
                onClick={() => void handleSchedulePost()}
                disabled={saving || !fCaption || !fScheduledAt}
                className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all disabled:opacity-40 hover:bg-purple-500/10"
                style={{ borderColor: "#8B5CF6", color: "#A78BFA" }}
              >
                Schedule post
              </button>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="hidden sm:flex w-[360px] flex-shrink-0 flex-col overflow-y-auto px-5 py-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
              Preview — {selectedPlatform}
            </p>
            <PlatformPreview
              platform={selectedPlatform}
              caption={fCaption}
              businessName={businessName}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GrowSocialPage() {
  const today = new Date();
  const [view, setView] = useState<ViewMode>("calendar");
  const [posts, setPosts] = useState<SocialPost[]>(SEED_POSTS);
  const [showPanel, setShowPanel] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Panel initial state (set when clicking a content idea)
  const [panelInitialCaption, setPanelInitialCaption] = useState("");
  const [panelInitialHashtags, setPanelInitialHashtags] = useState<string[]>([]);

  // Content ideas panel
  const [showIdeasPanel, setShowIdeasPanel] = useState(false);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);

  const days = getDaysInMonth(currentYear, currentMonth);
  const offset = getMonthStartOffset(currentYear, currentMonth);

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else { setCurrentMonth((m) => m - 1); }
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else { setCurrentMonth((m) => m + 1); }
  };

  const postsForDay = (date: Date): SocialPost[] =>
    posts.filter((p) => {
      if (!p.scheduled_at) return false;
      const d = new Date(p.scheduled_at);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    });

  const openCreatePanel = useCallback((caption = "", hashtags: string[] = []) => {
    setPanelInitialCaption(caption);
    setPanelInitialHashtags(hashtags);
    setShowPanel(true);
  }, []);

  const handleGenerateContentIdeas = async () => {
    setIdeasLoading(true);
    setContentIdeas([]);
    try {
      // Fetch business context
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();

      let businessName = "our business";
      let tradeType = "trade";
      let suburb = "your area";
      let state = "Australia";

      if (user) {
        const { data: biz } = await supabase
          .from("businesses")
          .select("business_name, industries, suburb, state")
          .eq("owner_id", user.id)
          .single();
        if (biz) {
          businessName = biz.business_name ?? businessName;
          tradeType = (biz.industries as string[] | null)?.[0] ?? tradeType;
          suburb = biz.suburb ?? suburb;
          state = biz.state ?? state;
        }
      }

      // Australian season by month
      const month = new Date().getMonth();
      const season =
        month >= 2 && month <= 4 ? "autumn"
        : month >= 5 && month <= 7 ? "winter"
        : month >= 8 && month <= 10 ? "spring"
        : "summer";

      const days2 = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeek = days2[new Date().getDay()];

      const prompt = `You are a social media manager for an Australian trade business. Generate 5 specific, authentic social media post ideas that sound like a real tradesperson wrote them — casual, direct, relatable.

Business context:
- Business: ${businessName}
- Trade: ${tradeType}
- Location: ${suburb}, ${state}
- Season: ${season} in Australia
- Day: ${dayOfWeek}

Rules:
- Write in first person, casual Australian tone ("we" or "I")
- Include specific local references where possible
- Reference real trade scenarios tradies deal with daily
- Each idea MUST have: a hook line (the first sentence that grabs attention), the full caption draft (3-5 sentences), and 5 relevant hashtags
- Avoid corporate language, buzzwords, or anything that sounds AI-generated
- Good tone examples: "Had a call at 6am about a burst pipe in Norwood — another Monday sorted ✅" NOT "We are pleased to announce we completed another successful project"
- Include specific trade details (tools, materials, scenarios, seasons relevant to the trade)
- Reference the current ${season} season where relevant (e.g. for plumbers: "with ${season} storms coming, now's the time to check your gutters")

Return as JSON array with exactly 5 items, each with: { hookLine, caption, hashtags: string[] }`;

      // We call the existing API with the full prompt embedded
      const res = await fetch("/api/grow/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ideas",
          richPrompt: prompt,
          businessName,
          trade: tradeType,
          suburb,
          state,
          season,
          dayOfWeek,
        }),
      });
      const data = (await res.json()) as { ideas?: ContentIdea[]; captions?: string[] };

      if (data.ideas && data.ideas.length > 0) {
        setContentIdeas(data.ideas);
      } else if (data.captions && data.captions.length > 0) {
        // Fallback: wrap plain captions into idea format
        setContentIdeas(
          data.captions.slice(0, 5).map((caption) => ({
            hookLine: caption.split(".")[0] ?? caption.slice(0, 60),
            caption,
            hashtags: (caption.match(/#\w+/g) ?? []).map((h) => h.slice(1)).slice(0, 5),
          }))
        );
      } else {
        throw new Error("no ideas");
      }
    } catch {
      setContentIdeas([
        {
          hookLine: "Had a call at 6am about a burst pipe — another Monday sorted ✅",
          caption: "Had a call at 6am about a burst pipe in Norwood — another Monday sorted ✅ Quick response, clean fix, happy client. This is what we do. If you've got a plumbing emergency, give us a call any time.",
          hashtags: ["tradie", "plumber", "Adelaide", "emergency", "plumbing"],
        },
        {
          hookLine: "Before & after you didn't know you needed to see 👀",
          caption: "Before & after you didn't know you needed to see 👀 Replaced a 30-year-old hot water system this week — the old one was barely holding on. New unit installed, fully compliant, and the client has hot showers again. Job done.",
          hashtags: ["hotwater", "plumbing", "beforeandafter", "AdelaideTradie", "local"],
        },
        {
          hookLine: "With the cooler months here, your hot water is working overtime.",
          caption: "With the cooler months here, your hot water is working overtime. Now's a great time to get your system checked before it gives out in the middle of winter. We're booking inspections this week — DM us to lock in a time.",
          hashtags: ["winter", "hotwater", "maintenance", "Adelaide", "plumber"],
        },
      ]);
    } finally {
      setIdeasLoading(false);
    }
  };

  const handlePostSaved = (post: SocialPost) => {
    setPosts((prev) => [...prev, post]);
  };

  return (
    <>
      <section className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Social Content
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Schedule and manage your social media posts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex rounded-lg border p-0.5"
              style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
            >
              {(["calendar", "list"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all capitalize"
                  style={{
                    background: view === v ? "#8B5CF6" : "transparent",
                    color: view === v ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {v === "calendar" ? <CalendarDays size={12} /> : <List size={12} />}
                  {v}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => openCreatePanel()}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "#8B5CF6" }}
            >
              <Plus size={14} /> New Post
            </button>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
              style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
            >
              Coming soon
            </span>
          </div>
        </div>

        {/* AI Content Ideas Panel */}
        <div
          className="rounded-xl border"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <button
            type="button"
            onClick={() => {
              setShowIdeasPanel((v) => !v);
              if (!showIdeasPanel && contentIdeas.length === 0) {
                void handleGenerateContentIdeas();
              }
            }}
            className="flex w-full items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Lightbulb size={16} style={{ color: "#8B5CF6" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                AI content ideas for this week
              </span>
            </div>
            <div className="flex items-center gap-2">
              {ideasLoading && <Spinner />}
              <ChevronDown
                size={15}
                style={{
                  color: "var(--text-muted)",
                  transform: showIdeasPanel ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </div>
          </button>

          {showIdeasPanel && (
            <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: "var(--border)" }}>
              {ideasLoading ? (
                <div className="flex items-center gap-2 py-4" style={{ color: "var(--text-muted)" }}>
                  <Spinner /> <span className="text-sm">Generating content ideas…</span>
                </div>
              ) : contentIdeas.length === 0 ? (
                <div className="py-2 text-center">
                  <button
                    type="button"
                    onClick={() => void handleGenerateContentIdeas()}
                    className="flex items-center gap-1.5 mx-auto rounded-lg px-4 py-2 text-sm font-semibold"
                    style={{ background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" }}
                  >
                    <Sparkles size={13} /> Generate ideas
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Click an idea to open the post creator
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleGenerateContentIdeas()}
                      disabled={ideasLoading}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-opacity disabled:opacity-50"
                      style={{ background: "rgb(139 92 246 / 0.12)", color: "#A78BFA" }}
                    >
                      <Sparkles size={11} /> Refresh
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contentIdeas.map((idea, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => openCreatePanel(idea.caption, idea.hashtags)}
                        className="text-left rounded-xl border p-4 hover:border-purple-500/50 hover:bg-purple-950/30 transition-all"
                        style={{
                          borderColor: "rgba(139, 92, 246, 0.2)",
                          background: "rgba(139, 92, 246, 0.05)",
                        }}
                      >
                        <p className="font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>
                          &ldquo;{idea.hookLine}&rdquo;
                        </p>
                        <p className="text-xs line-clamp-3" style={{ color: "var(--text-muted)" }}>
                          {idea.caption}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {idea.hashtags.slice(0, 3).map((h) => (
                            <span
                              key={h}
                              className="text-[10px] rounded px-1.5 py-0.5"
                              style={{ color: "#A78BFA", background: "rgb(139 92 246 / 0.15)" }}
                            >
                              #{h}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px]" style={{ color: "#A78BFA" }}>
                          Click to use this idea →
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Calendar view */}
        {view === "calendar" && (
          <div className="rounded-xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                ‹ Prev
              </button>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {monthLabel}
              </p>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Next ›
              </button>
            </div>

            <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border)" }}>
              {DAYS_SHORT.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: offset }, (_, i) => (
                <div key={`offset-${i}`} className="border-b border-r min-h-[68px]" style={{ borderColor: "var(--border)" }} />
              ))}
              {days.map((date, i) => {
                const isToday = date.toDateString() === today.toDateString();
                const dayPosts = postsForDay(date);
                const isLastRow = Math.floor((i + offset) / 7) === Math.floor((days.length + offset - 1) / 7);
                return (
                  <div
                    key={date.toISOString()}
                    className={`relative min-h-[68px] border-r p-1.5 ${isLastRow ? "" : "border-b"}`}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold`}
                      style={{
                        background: isToday ? "#8B5CF6" : "transparent",
                        color: isToday ? "#fff" : "var(--text-muted)",
                      }}
                    >
                      {date.getDate()}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {dayPosts.map((p) =>
                        p.platforms.map((pl) => (
                          <span
                            key={`${p.id}-${pl}`}
                            className="h-2 w-2 rounded-full"
                            style={{ background: platformDot(pl).bg }}
                            title={pl}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {posts.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No posts scheduled this month.</p>
                <button
                  type="button"
                  onClick={() => openCreatePanel()}
                  className="mt-2 text-sm font-semibold"
                  style={{ color: "#8B5CF6" }}
                >
                  Create your first post →
                </button>
              </div>
            )}
          </div>
        )}

        {/* List view */}
        {view === "list" && (
          <div className="rounded-xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            {posts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No posts scheduled. Click &ldquo;New Post&rdquo; to create your first one.
                </p>
                <button
                  type="button"
                  onClick={() => openCreatePanel()}
                  className="mt-2 text-sm font-semibold"
                  style={{ color: "#8B5CF6" }}
                >
                  Create your first post →
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Caption</th>
                    <th className="px-4 py-3">Scheduled</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.platforms.map((pl) => (
                            <span
                              key={pl}
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ background: `${platformDot(pl).bg}22`, color: platformDot(pl).bg }}
                            >
                              {pl}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                        {p.caption}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {p.scheduled_at
                          ? new Date(p.scheduled_at).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize" style={STATUS_CLASSES[p.status]}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {/* Create Post Slide Panel */}
      <CreatePostPanel
        open={showPanel}
        onClose={() => setShowPanel(false)}
        initialCaption={panelInitialCaption}
        initialHashtags={panelInitialHashtags}
        onPostSaved={handlePostSaved}
      />
    </>
  );
}
