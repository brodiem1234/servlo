"use client";

import React, { useRef, useState } from "react";
import { Star, Wifi, Copy, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedResponse {
  id: string;
  reviewer_name: string | null;
  rating: number | null;
  review_text: string | null;
  response_draft: string | null;
  response_status: string;
  created_at: string;
}

interface DemoReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  text: string;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_REVIEWS: DemoReview[] = [
  {
    id: "demo-1",
    name: "Sarah M.",
    rating: 5,
    date: "2026-05-01",
    text: "Absolutely brilliant service! Arrived on time, fixed our blocked drain in under an hour, and left everything spotless. Would highly recommend to anyone in Adelaide.",
  },
  {
    id: "demo-2",
    name: "James T.",
    rating: 5,
    date: "2026-04-28",
    text: "Called about a sparking power point — they came out same day. Very professional, explained everything clearly. Fair price too.",
  },
  {
    id: "demo-3",
    name: "Priya K.",
    rating: 4,
    date: "2026-04-20",
    text: "Good work overall. The team was friendly and got the job done. Minor delay on arrival but they called ahead.",
  },
  {
    id: "demo-4",
    name: "Michael R.",
    rating: 5,
    date: "2026-04-10",
    text: "Used them for a full bathroom reno. Excellent craftsmanship, very tidy, and finished on schedule. Will definitely use again.",
  },
  {
    id: "demo-5",
    name: "Lisa W.",
    rating: 3,
    date: "2026-03-28",
    text: "Work was good quality but communication could be better. Had to chase for updates. End result was fine though.",
  },
];

const SAMPLE_RESPONSES: Record<string, string> = {
  "demo-1":
    "Hi Sarah, thank you so much for your kind words! We're really glad we could sort out the blocked drain quickly and leave things tidy. It means a lot to know you'd recommend us to others in Adelaide. We look forward to helping you again any time!",
  "demo-2":
    "Thanks for the 5-star review, James! Same-day callouts for electrical issues are something we're really proud of — safety first. So glad we could explain everything clearly and sort it out for you at a fair price.",
  "demo-3":
    "Hi Priya, thank you for the honest feedback! We're glad the team were friendly and got the job done for you. We apologise for the delay — we always try to call ahead when that happens. We'll keep working on our punctuality. Hope to serve you again!",
  "demo-4":
    "Michael, what a fantastic review — thank you! A full bathroom renovation is a big job and we're really proud of the result. Staying tidy on site and finishing on schedule are things we take seriously. We'd love to help with any future projects!",
  "demo-5":
    "Hi Lisa, thank you for taking the time to leave honest feedback. We're glad you were happy with the quality of work. You're absolutely right that communication during the job could have been better — that's something we're actively improving. We appreciate you letting us know and hope we can do better for you next time.",
};

// ─── Star rating display ──────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={13}
          fill={i < rating ? "#F59E0B" : "none"}
          stroke={i < rating ? "#F59E0B" : "var(--text-muted)"}
        />
      ))}
    </span>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({
  review,
}: {
  review: DemoReview;
}) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleDraftResponse = async () => {
    if (draft) {
      setExpanded((e) => !e);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setDraft(
      SAMPLE_RESPONSES[review.id] ??
        `Hi ${review.name.split(" ")[0]}, thank you so much for taking the time to leave a review. We really appreciate your feedback and look forward to helping you again in the future!`
    );
    setExpanded(true);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: "#8B5CF6" }}
          >
            {review.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {review.name}
              </p>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                style={{ background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" }}
              >
                DEMO
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StarRating rating={review.rating} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {new Date(review.date).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {review.text}
      </p>

      <button
        type="button"
        onClick={handleDraftResponse}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
        style={{ background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" }}
      >
        {loading ? (
          <>
            <svg
              className="h-3 w-3 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Drafting response…
          </>
        ) : draft ? (
          <>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "Hide response" : "Show response"}
          </>
        ) : (
          "Draft Response"
        )}
      </button>

      {draft && expanded && (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
              resize: "vertical",
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: copied ? "rgb(16 185 129 / 0.15)" : "var(--bg-secondary)",
                borderColor: copied ? "#10B981" : "var(--border)",
                color: copied ? "#10B981" : "var(--text-secondary)",
              }}
            >
              {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy response"}
            </button>
            <button
              type="button"
              disabled
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-40 cursor-not-allowed"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-muted)",
              }}
              title="Coming with full Grow launch"
            >
              Approve (coming soon)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function ReviewHubClient({
  savedResponses,
  businessName,
}: {
  savedResponses: SavedResponse[];
  businessName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const STATS = [
    { label: "Average Rating", value: "4.6 ★" },
    { label: "Total Reviews", value: "5" },
    { label: "Reviews This Month", value: "2" },
    { label: "Response Rate", value: "60%" },
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Review Hub
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Manage your Google reviews for{" "}
            <span style={{ color: "#A78BFA" }}>{businessName}</span>.
          </p>
        </div>
        <span
          className="mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
          style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
        >
          Coming soon
        </span>
      </div>

      {/* Connection banner */}
      <div
        className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{
          background: "rgb(139 92 246 / 0.08)",
          borderColor: "rgb(139 92 246 / 0.35)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <Wifi size={18} style={{ color: "#8B5CF6" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Connect your Google Business Profile to start managing reviews
            automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "#8B5CF6" }}
        >
          Connect Google
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-xl border p-4"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </p>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Demo reviews */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2
            className="text-base font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Recent Reviews
          </h2>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
            style={{ background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" }}
          >
            DEMO DATA
          </span>
        </div>

        <div className="space-y-3">
          {DEMO_REVIEWS.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>

      {/* Saved responses from DB (if any) */}
      {savedResponses.length > 0 && (
        <div>
          <h2
            className="mb-3 text-base font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Your Saved Responses ({savedResponses.length})
          </h2>
          <div className="space-y-3">
            {savedResponses.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border p-4"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex items-center gap-2">
                  <StarRating rating={r.rating ?? 5} />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {r.reviewer_name ?? "Anonymous"}
                  </span>
                </div>
                {r.review_text && (
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {r.review_text}
                  </p>
                )}
                {r.response_draft && (
                  <p
                    className="mt-2 rounded-lg border-l-2 border-purple-500 pl-3 text-xs italic"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {r.response_draft}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Google integration coming soon dialog */}
      <dialog
        ref={dialogRef}
        className="rounded-2xl border p-6 shadow-2xl backdrop:bg-black/60"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
          maxWidth: "400px",
          width: "90vw",
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="space-y-4 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "rgb(139 92 246 / 0.15)" }}
          >
            <Star size={24} style={{ color: "#8B5CF6" }} />
          </div>
          <h3
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Google Business Profile
          </h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Google Business Profile integration is coming with the full SERVLO
            Grow launch in Q3 2026. We&apos;ll notify you when it&apos;s ready.
          </p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
            style={{ background: "#8B5CF6" }}
          >
            Got it
          </button>
        </div>
      </dialog>
    </section>
  );
}
