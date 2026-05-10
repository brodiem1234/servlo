"use client";

import React, { useState, useOptimistic, useCallback } from "react";
import {
  CalendarDays,
  List,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { SocialPost, SocialStats } from "./page";

// ── helpers ────────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const last = new Date(year, month + 1, 0);
  for (let d = new Date(year, month, 1); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

/** Returns Mon=0 offset for the first day of the month */
function monthStartOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isValidUrl(s: string) {
  try { new URL(s); return true; } catch { return false; }
}

// ── style maps ─────────────────────────────────────────────────────────────────

const PLATFORM_BADGE: Record<string, React.CSSProperties> = {
  facebook:         { background: "rgb(24 119 242 / 0.15)",  color: "#1877F2" },
  instagram:        { background: "rgb(225 48 108 / 0.15)",  color: "#E1306C" },
  "google business":{ background: "rgb(234 67 53 / 0.15)",   color: "#EA4335" },
};

function platformBadgeStyle(platform: string): React.CSSProperties {
  return PLATFORM_BADGE[platform.toLowerCase()] ?? { background: "rgb(107 114 128 / 0.15)", color: "#9CA3AF" };
}

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  draft:     { background: "rgb(107 114 128 / 0.15)", color: "#9CA3AF" },
  scheduled: { background: "rgb(59 130 246 / 0.15)",  color: "#60A5FA" },
  published: { background: "rgb(16 185 129 / 0.15)",  color: "#10B981" },
  failed:    { background: "rgb(239 68 68 / 0.15)",   color: "#F87171" },
};

function statusBadgeStyle(status: string): React.CSSProperties {
  return STATUS_BADGE[status] ?? STATUS_BADGE.draft;
}

const PLATFORM_DOT: Record<string, string> = {
  facebook:          "#1877F2",
  instagram:         "#E1306C",
  "google business": "#EA4335",
};

function platformDotColor(platform: string) {
  return PLATFORM_DOT[platform.toLowerCase()] ?? "#8B5CF6";
}

// ── stat card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color: "#8B5CF6" }}>
        {value}
      </p>
    </div>
  );
}

// ── toast ──────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: "success" | "error" }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg"
          style={{ background: t.type === "success" ? "#059669" : "#DC2626" }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── create post modal ──────────────────────────────────────────────────────────

interface CreatePostModalProps {
  onClose: () => void;
  onCreated: (post: SocialPost) => void;
  showToast: (message: string, type: "success" | "error") => void;
  businessName?: string;
  suburb?: string;
  bizState?: string;
}

const PLATFORMS = ["Facebook", "Instagram", "Google Business"] as const;
type PlatformType = (typeof PLATFORMS)[number];

function CreatePostModal({ onClose, onCreated, showToast, businessName, suburb, bizState }: CreatePostModalProps) {
  const [platform, setPlatform] = useState<PlatformType>("Facebook");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [generatingCaption, setGeneratingCaption] = useState(false);

  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const res = await fetch("/api/grow/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "recent_jobs",
          businessName: businessName ?? "our business",
          suburb: suburb ?? "your area",
          state: bizState ?? "Australia",
          platform,
        }),
      });
      const data = await res.json() as { captions?: string[] };
      const captions = data.captions ?? [];
      if (captions.length > 0) {
        setCaption(captions[0]!.slice(0, 500));
        showToast("Caption generated!", "success");
      }
    } catch {
      showToast("Could not generate caption", "error");
    } finally {
      setGeneratingCaption(false);
    }
  };

  const captionLen = caption.length;

  function validateImageUrl(val: string) {
    if (val && !isValidUrl(val)) {
      setUrlError("Please enter a valid URL (include https://)");
    } else {
      setUrlError("");
    }
  }

  async function handleSubmit(asDraft: boolean) {
    if (!caption.trim()) { showToast("Caption is required", "error"); return; }
    if (imageUrl && !isValidUrl(imageUrl)) { showToast("Image URL is invalid", "error"); return; }
    setSaving(true);
    try {
      const body: Record<string, string | null> = {
        platform,
        caption: caption.trim(),
        image_url: imageUrl || null,
        scheduled_at: asDraft ? null : (scheduledAt ? new Date(scheduledAt).toISOString() : null),
      };
      const res = await fetch("/api/grow/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { post?: SocialPost; error?: string };
      if (!res.ok || json.error) {
        showToast(json.error ?? "Failed to create post", "error");
        return;
      }
      if (json.post) onCreated(json.post);
      showToast(asDraft ? "Draft saved" : "Post scheduled", "success");
      onClose();
    } catch {
      showToast("Network error, please try again", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="w-full max-w-lg rounded-2xl shadow-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* header */}
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 id="create-post-title" className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Schedule Post
            </h2>
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* body */}
          <div className="space-y-5 px-5 py-5">
            {/* platform */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Platform
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((pl) => (
                  <button
                    key={pl}
                    type="button"
                    onClick={() => setPlatform(pl)}
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                    style={
                      platform === pl
                        ? { ...platformBadgeStyle(pl), borderColor: "transparent" }
                        : { borderColor: "var(--border)", color: "var(--text-muted)", background: "transparent" }
                    }
                  >
                    {pl}
                  </button>
                ))}
              </div>
            </div>

            {/* caption */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="caption" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Caption <span aria-hidden="true" style={{ color: "#F87171" }}>*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateCaption}
                    disabled={generatingCaption}
                    className="rounded px-2 py-0.5 text-xs font-medium disabled:opacity-50"
                    style={{ background: "rgb(99 102 241 / 0.12)", color: "#818CF8" }}
                  >
                    {generatingCaption ? "Generating…" : "✨ AI Generate"}
                  </button>
                  <span className="text-xs" style={{ color: captionLen > 480 ? "#F87171" : "var(--text-muted)" }}>
                    {captionLen}/500
                  </span>
                </div>
              </div>
              <textarea
                id="caption"
                required
                rows={5}
                maxLength={500}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your post caption…"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  resize: "vertical",
                }}
              />
            </div>

            {/* image url */}
            <div>
              <label htmlFor="image-url" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Image URL <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); validateImageUrl(e.target.value); }}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${urlError ? "#F87171" : "var(--border)"}`,
                  color: "var(--text-primary)",
                }}
              />
              {urlError && (
                <p className="mt-1 text-xs" style={{ color: "#F87171" }}>{urlError}</p>
              )}
            </div>

            {/* schedule */}
            <div>
              <label htmlFor="scheduled-at" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Schedule date &amp; time <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(leave blank to save as draft)</span>
              </label>
              <input
                id="scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  colorScheme: "dark",
                }}
              />
            </div>
          </div>

          {/* footer */}
          <div
            className="flex items-center justify-end gap-3 border-t px-5 py-4"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={() => void handleSubmit(true)}
              disabled={saving || !caption.trim()}
              className="rounded-xl border px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Save as draft
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit(false)}
              disabled={saving || !caption.trim()}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: "#8B5CF6" }}
            >
              {saving ? "Saving…" : scheduledAt ? "Schedule" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

type View = "list" | "calendar";

export default function SocialCalendarManager({
  posts: initialPosts,
  stats,
  businessName,
  suburb,
  state: bizState,
}: {
  posts: SocialPost[];
  stats: SocialStats;
  businessName?: string;
  suburb?: string;
  state?: string;
}) {
  const today = new Date();
  const [view, setView] = useState<View>("list");
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [posts, addPost] = useOptimistic(
    initialPosts,
    (state: SocialPost[], newPost: SocialPost) => [newPost, ...state],
  );
  // Soft-delete optimistic state
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const visiblePosts = posts.filter((p) => !deletedIds.has(p.id));

  // Calendar state
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  function handleCreated(post: SocialPost) {
    addPost(post);
  }

  async function handleDelete(id: string) {
    setDeletedIds((prev) => new Set([...prev, id]));
    try {
      const res = await fetch(`/api/grow/social/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted_at: new Date().toISOString() }),
      });
      if (!res.ok) {
        setDeletedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        showToast("Failed to delete post", "error");
      } else {
        showToast("Post deleted", "success");
      }
    } catch {
      setDeletedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      showToast("Network error", "error");
    }
  }

  // Calendar helpers
  const calDays = getDaysInMonth(calYear, calMonth);
  const calOffset = monthStartOffset(calYear, calMonth);
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  function postsOnDay(date: Date) {
    return visiblePosts.filter((p) => {
      const d = p.scheduled_at ?? p.published_at;
      if (!d) return false;
      const pd = new Date(d);
      return pd.getFullYear() === date.getFullYear() && pd.getMonth() === date.getMonth() && pd.getDate() === date.getDate();
    });
  }

  function prevCal() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
    setSelectedDay(null);
  }

  function nextCal() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const selectedDayPosts = selectedDay ? postsOnDay(selectedDay) : null;

  // Live stats that account for optimistic adds/deletes
  const livePosts = visiblePosts;
  const livePublished = livePosts.filter((p) => p.status === "published");
  const liveStats: SocialStats = {
    totalPosts: livePosts.length,
    scheduledCount: livePosts.filter((p) => p.status === "scheduled").length,
    publishedCount: livePublished.length,
    totalReach: livePublished.reduce((s, p) => s + (p.reach ?? 0), 0),
  };
  // Use server stats as floor (in case optimistic state hasn't propagated)
  const displayStats: SocialStats = {
    totalPosts: Math.max(stats.totalPosts, liveStats.totalPosts),
    scheduledCount: Math.max(stats.scheduledCount, liveStats.scheduledCount),
    publishedCount: Math.max(stats.publishedCount, liveStats.publishedCount),
    totalReach: Math.max(stats.totalReach, liveStats.totalReach),
  };

  const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <div className="space-y-6">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Social Calendar
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
              Plan, schedule and track your social media posts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* view toggle */}
            <div
              className="flex rounded-lg border p-0.5"
              style={{ borderColor: "var(--border)" }}
            >
              {(["list", "calendar"] as View[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-label={`${v} view`}
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all capitalize"
                  style={{
                    background: view === v ? "#8B5CF6" : "transparent",
                    color: view === v ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {v === "list" ? <List size={12} /> : <CalendarDays size={12} />}
                  {v.charAt(0).toUpperCase() + v.slice(1)} view
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "#8B5CF6" }}
            >
              <Plus size={14} aria-hidden="true" />
              Schedule Post
            </button>
          </div>
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Posts" value={displayStats.totalPosts} />
          <StatCard label="Scheduled" value={displayStats.scheduledCount} />
          <StatCard label="Published" value={displayStats.publishedCount} />
          <StatCard label="Total Reach" value={displayStats.totalReach.toLocaleString("en-AU")} />
        </div>

        {/* list view */}
        {view === "list" && (
          <div
            className="rounded-xl border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            {visiblePosts.length === 0 ? (
              <div className="py-16 text-center">
                <CalendarDays size={36} className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No posts yet. Schedule your first post to get started.
                </p>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="mt-3 text-sm font-semibold"
                  style={{ color: "#8B5CF6" }}
                >
                  Schedule a post →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full text-sm" aria-label="Social posts">
                  <thead>
                    <tr
                      className="border-b text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      <th className="px-4 py-3">Platform</th>
                      <th className="px-4 py-3">Caption</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 whitespace-nowrap">Scheduled / Published</th>
                      <th className="px-4 py-3">Engagement</th>
                      <th className="px-4 py-3">Reach</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePosts.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b last:border-0"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {/* platform */}
                        <td className="px-4 py-3">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                            style={platformBadgeStyle(p.platform)}
                          >
                            {p.platform}
                          </span>
                        </td>
                        {/* caption */}
                        <td
                          className="max-w-[220px] px-4 py-3 text-xs"
                          style={{ color: "var(--text-secondary)" }}
                          title={p.caption}
                        >
                          {truncate(p.caption, 60)}
                        </td>
                        {/* status */}
                        <td className="px-4 py-3">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                            style={statusBadgeStyle(p.status)}
                          >
                            {p.status}
                          </span>
                        </td>
                        {/* date */}
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                          {fmtDate(p.scheduled_at ?? p.published_at)}
                        </td>
                        {/* engagement */}
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                          {p.status === "published"
                            ? `♥ ${p.like_count ?? 0}  💬 ${p.comment_count ?? 0}`
                            : "—"}
                        </td>
                        {/* reach */}
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                          {p.status === "published" ? (p.reach ?? 0).toLocaleString("en-AU") : "—"}
                        </td>
                        {/* actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="Edit post (coming soon)"
                              title="Edit coming soon"
                              disabled
                              className="rounded p-1 opacity-30 cursor-not-allowed"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete post"
                              onClick={() => void handleDelete(p.id)}
                              className="rounded p-1 transition-colors hover:bg-red-500/10 hover:text-red-400"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* calendar view */}
        {view === "calendar" && (
          <div
            className="rounded-xl border"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            {/* nav */}
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                type="button"
                aria-label="Previous month"
                onClick={prevCal}
                className="rounded-lg border p-1.5 transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <ChevronLeft size={16} />
              </button>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {monthLabel}
              </p>
              <button
                type="button"
                aria-label="Next month"
                onClick={nextCal}
                className="rounded-lg border p-1.5 transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* day headers */}
            <div
              className="grid grid-cols-7 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              {DAYS_SHORT.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-semibold uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* day grid */}
            <div className="grid grid-cols-7" role="grid" aria-label="Calendar">
              {Array.from({ length: calOffset }, (_, i) => (
                <div
                  key={`blank-${i}`}
                  className="min-h-[44px] sm:min-h-[68px] border-b border-r"
                  style={{ borderColor: "var(--border)" }}
                />
              ))}
              {calDays.map((date, i) => {
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = selectedDay?.toDateString() === date.toDateString();
                const dayPosts = postsOnDay(date);
                const col = (i + calOffset) % 7;
                const isLastCol = col === 6;
                const totalCells = calDays.length + calOffset;
                const lastRowStart = Math.floor((totalCells - 1) / 7) * 7;
                const isLastRow = i + calOffset >= lastRowStart;
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    role="gridcell"
                    aria-label={`${date.toLocaleDateString("en-AU", { day: "numeric", month: "long" })}${dayPosts.length > 0 ? `, ${dayPosts.length} post${dayPosts.length > 1 ? "s" : ""}` : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDay(isSelected ? null : new Date(date))}
                    className={[
                      "relative min-h-[44px] sm:min-h-[68px] p-1 sm:p-1.5 text-left transition-colors",
                      isLastRow ? "" : "border-b",
                      isLastCol ? "" : "border-r",
                      isSelected ? "bg-purple-500/10" : "hover:bg-white/5",
                    ].join(" ")}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        background: isToday ? "#8B5CF6" : "transparent",
                        color: isToday ? "#fff" : "var(--text-muted)",
                      }}
                    >
                      {date.getDate()}
                    </span>
                    {dayPosts.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {dayPosts.slice(0, 4).map((p) => (
                          <span
                            key={p.id}
                            className="h-2 w-2 rounded-full"
                            style={{ background: platformDotColor(p.platform) }}
                            aria-hidden="true"
                          />
                        ))}
                        {dayPosts.length > 4 && (
                          <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                            +{dayPosts.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* selected day detail */}
            {selectedDay && (
              <div
                className="border-t px-4 py-4"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {selectedDay.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                  {" — "}
                  {(selectedDayPosts?.length ?? 0) === 0
                    ? "No posts"
                    : `${selectedDayPosts!.length} post${selectedDayPosts!.length !== 1 ? "s" : ""}`}
                </p>
                {selectedDayPosts && selectedDayPosts.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayPosts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-start gap-3 rounded-lg border p-3"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <span
                          className="mt-0.5 rounded-full px-2 py-0.5 text-xs font-semibold capitalize flex-shrink-0"
                          style={platformBadgeStyle(p.platform)}
                        >
                          {p.platform}
                        </span>
                        <p className="flex-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                          {truncate(p.caption, 120)}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize flex-shrink-0"
                          style={statusBadgeStyle(p.status)}
                        >
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="text-sm font-semibold"
                    style={{ color: "#8B5CF6" }}
                  >
                    Schedule a post for this day →
                  </button>
                )}
              </div>
            )}

            {/* platform legend */}
            <div
              className="border-t px-4 py-3 flex flex-wrap gap-4"
              style={{ borderColor: "var(--border)" }}
            >
              {Object.entries(PLATFORM_DOT).map(([pl, color]) => (
                <div key={pl} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{pl}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* create post modal */}
      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
          showToast={showToast}
          businessName={businessName}
          suburb={suburb}
          bizState={bizState}
        />
      )}

      {/* toasts */}
      <ToastContainer toasts={toasts} />
    </>
  );
}
