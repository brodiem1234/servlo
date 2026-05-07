"use client";

import React, { useState, useRef } from "react";
import {
  CalendarDays,
  List,
  Plus,
  X,
  Sparkles,
  Clock,
  ChevronDown,
  Lightbulb,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "calendar" | "list";
type CaptionType = "recent_jobs" | "seasonal" | "promotion" | "testimonial";

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
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function getMonthStartOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function platformDot(platform: string) {
  if (platform === "Facebook") return { bg: "#1877F2" };
  if (platform === "Instagram") return { bg: "#8B5CF6" };
  return { bg: "#6B7280" };
}

const STATUS_CLASSES: Record<SocialPost["status"], React.CSSProperties> = {
  scheduled: { background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" },
  published: { background: "rgb(16 185 129 / 0.15)", color: "#10B981" },
  draft: { background: "rgb(107 114 128 / 0.15)", color: "#9CA3AF" },
};

const CAPTION_TYPES: { value: CaptionType; label: string }[] = [
  { value: "recent_jobs", label: "Recent jobs showcase" },
  { value: "seasonal", label: "Seasonal content" },
  { value: "promotion", label: "Special offer / promotion" },
  { value: "testimonial", label: "Customer testimonial" },
];

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GrowSocialPage() {
  const today = new Date();
  const [view, setView] = useState<ViewMode>("calendar");
  const [posts, setPosts] = useState<SocialPost[]>(SEED_POSTS);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [saving, setSaving] = useState(false);

  // Form state
  const [fPlatforms, setFPlatforms] = useState<string[]>(["Facebook"]);
  const [fCaption, setFCaption] = useState("");
  const [fScheduledAt, setFScheduledAt] = useState("");
  const [generatingCaption, setGeneratingCaption] = useState(false);

  // AI caption type selector
  const [showCaptionTypeMenu, setShowCaptionTypeMenu] = useState(false);
  const [captionVariations, setCaptionVariations] = useState<string[]>([]);
  const [showCaptionVariations, setShowCaptionVariations] = useState(false);

  // Content ideas panel
  const [showIdeasPanel, setShowIdeasPanel] = useState(false);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [contentIdeas, setContentIdeas] = useState<string[]>([]);

  const captionMenuRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const handleGenerateCaptionType = async (type: CaptionType) => {
    setShowCaptionTypeMenu(false);
    setGeneratingCaption(true);
    setShowCaptionVariations(false);
    setCaptionVariations([]);
    try {
      const res = await fetch("/api/grow/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = (await res.json()) as { captions?: string[] };
      setCaptionVariations(data.captions ?? []);
      setShowCaptionVariations(true);
    } catch {
      setCaptionVariations([
        "Another job done right! Our team wrapped up a great project this week. Tap the link in bio to book your free quote. #AdelaideTradie",
        "Proud of the work we do every day. Whether big or small, every job gets our full attention. DM us to get started. #LocalTradies",
        "Happy clients, quality work — that's what we're about. Available 7 days across the metro. Call us today! #ServiceBusiness",
      ]);
      setShowCaptionVariations(true);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleGenerateContentIdeas = async () => {
    setIdeasLoading(true);
    setContentIdeas([]);
    try {
      const res = await fetch("/api/grow/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "recent_jobs" }),
      });
      const data = (await res.json()) as { captions?: string[] };
      // Use first 5 captions (or repeat if fewer) as "ideas" (first ~80 chars as preview)
      const raw = data.captions ?? [];
      setContentIdeas(raw.slice(0, 5));
    } catch {
      setContentIdeas([
        "Share a before & after photo from a recent job. Before/after posts get 3x more engagement.",
        "Post a short video of your team arriving on site. Behind-the-scenes content builds trust.",
        "Share a 5-star review you received this week. Social proof drives new enquiries.",
      ]);
    } finally {
      setIdeasLoading(false);
    }
  };

  const togglePlatform = (p: string) => {
    setFPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const handleSchedule = async () => {
    if (!fCaption || !fScheduledAt || fPlatforms.length === 0) return;
    setSaving(true);

    const newPost: SocialPost = {
      id: `local-${Date.now()}`,
      platforms: fPlatforms,
      caption: fCaption,
      scheduled_at: fScheduledAt,
      status: "scheduled",
    };

    try {
      await fetch("/api/grow/save-social-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: fPlatforms, caption: fCaption, scheduled_at: fScheduledAt, status: "scheduled" }),
      });
    } catch {
      // Silent fail
    }

    setPosts((prev) => [...prev, newPost]);
    setFCaption("");
    setFScheduledAt("");
    setFPlatforms(["Facebook"]);
    setShowModal(false);
    setSaving(false);
  };

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Social Calendar
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
            onClick={() => setShowModal(true)}
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
                    Click an idea to pre-fill the post schedule form
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
                <div className="space-y-2">
                  {contentIdeas.map((idea, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setFCaption(idea);
                        setShowModal(true);
                      }}
                      className="w-full rounded-lg border p-3 text-left text-sm transition-all hover:opacity-80"
                      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    >
                      <span className="line-clamp-2">{idea}</span>
                      <span className="mt-1 block text-xs font-semibold" style={{ color: "#8B5CF6" }}>
                        Use this idea →
                      </span>
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
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "text-white" : ""}`}
                    style={{ background: isToday ? "#8B5CF6" : "transparent", color: isToday ? "#fff" : "var(--text-muted)" }}
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
                onClick={() => setShowModal(true)}
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
                onClick={() => setShowModal(true)}
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

      {/* Create Post modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (!modalRef.current?.contains(e.target as Node)) setShowModal(false); }}
        >
          <div
            ref={modalRef}
            className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-2xl dark:bg-[#1a2235]"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Create Social Post
              </h2>
              <button
                type="button"
                onClick={() => { setShowModal(false); setCaptionVariations([]); setShowCaptionVariations(false); }}
                className="rounded-lg p-1"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Platform selector */}
              <div>
                <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Platforms</p>
                <div className="flex gap-3">
                  {["Facebook", "Instagram"].map((pl) => {
                    const checked = fPlatforms.includes(pl);
                    return (
                      <label key={pl} className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={checked} onChange={() => togglePlatform(pl)} className="accent-purple-500" />
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{pl}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Caption */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Caption</p>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{fCaption.length}/2200</span>
                </div>
                <textarea
                  value={fCaption}
                  onChange={(e) => setFCaption(e.target.value.slice(0, 2200))}
                  rows={4}
                  placeholder="Write your post caption…"
                  className="w-full rounded-lg border bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-[#161d2e]"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)", resize: "vertical" }}
                />

                {/* AI caption generate dropdown */}
                <div className="relative mt-2" ref={captionMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowCaptionTypeMenu((v) => !v)}
                    disabled={generatingCaption}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
                    style={{ background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" }}
                  >
                    {generatingCaption ? (
                      <><Spinner /> Generating…</>
                    ) : (
                      <><Sparkles size={11} /> Generate caption with AI <ChevronDown size={11} /></>
                    )}
                  </button>
                  {showCaptionTypeMenu && (
                    <div
                      className="absolute left-0 top-full z-10 mt-1 w-56 rounded-xl border bg-white shadow-xl dark:bg-[#1a2235]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {CAPTION_TYPES.map((ct) => (
                        <button
                          key={ct.value}
                          type="button"
                          onClick={() => void handleGenerateCaptionType(ct.value)}
                          className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:opacity-80 first:rounded-t-xl last:rounded-b-xl"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {ct.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Caption variation cards */}
                {showCaptionVariations && captionVariations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      Click a variation to use it:
                    </p>
                    {captionVariations.map((cap, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setFCaption(cap); setShowCaptionVariations(false); }}
                        className="w-full rounded-lg border p-3 text-left text-xs transition-all hover:opacity-80"
                        style={{
                          background: fCaption === cap ? "rgb(139 92 246 / 0.12)" : "rgb(249 250 251)",
                          borderColor: fCaption === cap ? "#8B5CF6" : "var(--border)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span className="line-clamp-3">{cap}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Photo upload placeholder */}
              <div>
                <p className="mb-1.5 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Photo (optional)
                </p>
                <div
                  className="flex items-center justify-center rounded-lg border-2 border-dashed py-5 text-center"
                  style={{ borderColor: "var(--border)", background: "rgb(249 250 251)" }}
                >
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Photo upload coming with full Grow launch
                  </p>
                </div>
              </div>

              {/* Scheduled date/time */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  <Clock size={13} /> Schedule date &amp; time
                </label>
                <input
                  type="datetime-local"
                  value={fScheduledAt}
                  onChange={(e) => setFScheduledAt(e.target.value)}
                  className="w-full rounded-lg border bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-[#161d2e]"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSchedule}
                disabled={saving || !fCaption || !fScheduledAt || fPlatforms.length === 0}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: "#8B5CF6" }}
              >
                {saving ? "Scheduling…" : "Schedule Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
