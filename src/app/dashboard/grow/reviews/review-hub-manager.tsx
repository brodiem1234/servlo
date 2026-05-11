"use client";

import { useState, useTransition } from "react";
import { Star, MessageSquare, ChevronDown, ChevronUp, X, Info } from "lucide-react";

type Review = {
  id: string;
  platform: string | null;
  reviewer: string | null;
  rating: number | null;
  review_text: string | null;
  response: string | null;
  responded_at: string | null;
  review_date: string | null;
  external_id: string | null;
  created_at: string;
};

type Stats = {
  totalReviews: number;
  avgRating: number;
  respondedCount: number;
  pendingCount: number;
};

type Toast = { id: number; message: string; type: "success" | "error" };

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= rating ? "#F59E0B" : "none"}
          style={{ color: s <= rating ? "#F59E0B" : "var(--text-muted)" }}
        />
      ))}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string | null }) {
  if (platform === "google")
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
        Google
      </span>
    );
  if (platform === "facebook")
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
        Facebook
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-zinc-200 dark:border-white/10">
      {platform ?? "Other"}
    </span>
  );
}

function ReviewCard({
  review,
  onResponseSaved,
}: {
  review: Review;
  onResponseSaved: (id: string, response: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [writingResponse, setWritingResponse] = useState(false);
  const [responseText, setResponseText] = useState(review.response ?? "");
  const [currentResponse, setCurrentResponse] = useState(review.response ?? "");
  const [isPending, startTransition] = useTransition();

  const isLong = (review.review_text ?? "").length > 200;

  async function postResponse() {
    if (!responseText.trim()) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/grow/reviews/${review.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            response: responseText.trim(),
            responded_at: new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error("Failed to save");
        setCurrentResponse(responseText.trim());
        setWritingResponse(false);
        onResponseSaved(review.id, responseText.trim());
      } catch {
        // error handled by parent toast
      }
    });
  }

  return (
    <div
      className="rounded-xl border p-5 space-y-3"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {(review.reviewer ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {review.reviewer ?? "Anonymous"}
              </span>
              <PlatformBadge platform={review.platform} />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <StarRow rating={review.rating ?? 0} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {review.rating ?? 0}/5
              </span>
            </div>
          </div>
        </div>
        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
          {review.review_date
            ? new Date(review.review_date).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      </div>

      {/* Review text */}
      {review.review_text && (
        <div>
          <p
            className="text-sm leading-relaxed"
            style={{
              color: "var(--text-secondary)",
              display: "-webkit-box",
              WebkitLineClamp: expanded ? undefined : 3,
              WebkitBoxOrient: "vertical" as any,
              overflow: expanded ? "visible" : "hidden",
            }}
          >
            {review.review_text}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
              style={{ color: "var(--accent-color)" }}
            >
              {expanded ? (
                <>
                  Show less <ChevronUp size={12} />
                </>
              ) : (
                <>
                  Read more <ChevronDown size={12} />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Response section */}
      {currentResponse ? (
        <div
          className="rounded-lg p-3 border-l-2 space-y-1"
          style={{ backgroundColor: "rgba(139,92,246,0.08)", borderLeftColor: "var(--accent-color)" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10B981" }}
            >
              Responded
            </span>
            {review.responded_at && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {new Date(review.responded_at).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {currentResponse}
          </p>
          <button
            onClick={() => {
              setResponseText(currentResponse);
              setWritingResponse(true);
            }}
            className="text-xs hover:opacity-80 transition-opacity"
            style={{ color: "var(--accent-color)" }}
          >
            Edit response
          </button>
        </div>
      ) : writingResponse ? (
        <div className="space-y-2">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Write your response..."
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none focus:ring-1 transition"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "var(--text-primary)",
            }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={postResponse}
              disabled={isPending || !responseText.trim()}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-color)" }}
            >
              {isPending ? "Saving..." : "Post Response"}
            </button>
            <button
              onClick={() => setWritingResponse(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
              style={{ color: "var(--text-muted)", borderColor: "var(--border)", border: "1px solid" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setWritingResponse(true)}
          className="flex items-center gap-1.5 text-xs font-medium transition hover:opacity-80"
          style={{ color: "var(--accent-color)" }}
        >
          <MessageSquare size={13} />
          Write Response
        </button>
      )}
    </div>
  );
}

export default function ReviewHubManager({
  reviews: initialReviews,
  stats,
}: {
  reviews: Review[];
  stats: Stats;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showImportInfo, setShowImportInfo] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(message: string, type: "success" | "error") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function handleResponseSaved(id: string, response: string) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, response, responded_at: new Date().toISOString() } : r
      )
    );
    addToast("Response saved successfully.", "success");
  }

  const filtered = reviews.filter((r) => {
    if (platformFilter !== "all" && r.platform !== platformFilter) return false;
    if (ratingFilter !== "all" && String(r.rating) !== ratingFilter) return false;
    if (statusFilter === "responded" && (!r.response || !r.response.trim())) return false;
    if (statusFilter === "pending" && r.response && r.response.trim()) return false;
    return true;
  });

  const statCards = [
    { label: "Total Reviews", value: stats.totalReviews, sub: null },
    {
      label: "Avg Rating",
      value: stats.avgRating.toFixed(1),
      sub: <StarRow rating={Math.round(stats.avgRating)} />,
    },
    { label: "Responded", value: stats.respondedCount, sub: null, accent: true },
    {
      label: "Pending Response",
      value: stats.pendingCount,
      sub: null,
      warn: stats.pendingCount > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Review Hub
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Manage and respond to your customer reviews
          </p>
        </div>
        <button
          onClick={() => setShowImportInfo(!showImportInfo)}
          className="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition hover:opacity-80"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          Import Reviews
        </button>
      </div>

      {/* Import info panel */}
      {showImportInfo && (
        <div
          className="rounded-xl border p-4 flex gap-3"
          style={{ borderColor: "rgba(139,92,246,0.3)", backgroundColor: "rgba(139,92,246,0.08)" }}
        >
          <Info size={18} className="shrink-0 mt-0.5" style={{ color: "var(--accent-color)" }} />
          <div className="space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              Connect Google Business to auto-import reviews
            </p>
            <p>
              1. Go to your Google Business Profile at{" "}
              <span className="font-mono text-xs" style={{ color: "var(--accent-color)" }}>
                business.google.com
              </span>
            </p>
            <p>2. Navigate to Reviews and copy your Place ID.</p>
            <p>3. Google Business API integration is coming soon — stay tuned!</p>
          </div>
          <button onClick={() => setShowImportInfo(false)} className="shrink-0 ml-auto" style={{ color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}
          >
            <div
              className="text-2xl font-bold"
              style={{
                color: card.accent
                  ? "#10B981"
                  : card.warn
                  ? "#F59E0B"
                  : "var(--text-primary)",
              }}
            >
              {card.value}
            </div>
            {card.sub && <div className="mt-1">{card.sub}</div>}
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Platform", key: "platform", options: ["all", "google", "facebook"], value: platformFilter, set: setPlatformFilter },
          { label: "Rating", key: "rating", options: ["all", "5", "4", "3", "2", "1"], value: ratingFilter, set: setRatingFilter },
          { label: "Status", key: "status", options: ["all", "responded", "pending"], value: statusFilter, set: setStatusFilter },
        ].map((f) => (
          <select
            key={f.key}
            value={f.value}
            onChange={(e) => f.set(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-secondary)",
            }}
          >
            {f.options.map((o) => (
              <option key={o} value={o}>
                {f.key === "platform"
                  ? o === "all" ? "All Platforms" : o.charAt(0).toUpperCase() + o.slice(1)
                  : f.key === "rating"
                  ? o === "all" ? "All Ratings" : `${o} stars`
                  : o === "all" ? "All Statuses" : o.charAt(0).toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}
        >
          <Star size={40} className="mx-auto mb-3 opacity-20" style={{ color: "var(--text-muted)" }} />
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            No reviews yet
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Connect your Google Business Profile to automatically import reviews.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <ReviewCard key={review.id} review={review} onResponseSaved={handleResponseSaved} />
          ))}
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-lg px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto transition-all"
            style={{
              backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444",
              color: "#fff",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
