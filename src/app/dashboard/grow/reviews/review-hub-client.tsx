"use client";

import React, { useRef, useState } from "react";
import { Star, Wifi, Copy, CheckCheck, ChevronDown, ChevronUp, X, Send, CheckSquare } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

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

interface CompletedJob {
  id: string;
  title: string;
  client_name: string | null;
  client_email: string | null;
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

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  businessName,
}: {
  review: DemoReview;
  businessName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [responded, setResponded] = useState(false);

  const handleGenerateResponse = async () => {
    if (draft) {
      setExpanded((e) => !e);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/grow/generate-review-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: review.text,
          businessName,
          trade: "trade services",
        }),
      });
      const data = (await res.json()) as { response?: string };
      setDraft(data.response ?? "Thank you for your review!");
      setExpanded(true);
    } catch {
      setDraft("Thank you so much for your kind review! We really appreciate your feedback and look forward to helping you again in the future!");
      setExpanded(true);
    } finally {
      setLoading(false);
    }
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

  const handleMarkResponded = async () => {
    setResponded(true);
    // Optimistic — save to grow_review_responses
    const sb = createSupabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("grow_review_responses").insert({
      owner_id: user.id,
      reviewer_name: review.name,
      rating: review.rating,
      review_text: review.text,
      response_draft: draft,
      response_status: "responded",
    });
  };

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{
        background: responded ? "rgb(16 185 129 / 0.05)" : "var(--bg-card)",
        borderColor: responded ? "rgb(16 185 129 / 0.4)" : "var(--border)",
      }}
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
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {review.name}
              </p>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                style={{ background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" }}
              >
                DEMO
              </span>
              {responded && (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                  style={{ background: "rgb(16 185 129 / 0.15)", color: "#10B981" }}
                >
                  RESPONDED
                </span>
              )}
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
        onClick={handleGenerateResponse}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
        style={{ background: "rgb(139 92 246 / 0.15)", color: "#A78BFA" }}
      >
        {loading ? (
          <><Spinner /> Generating AI response…</>
        ) : draft ? (
          <>{expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {expanded ? "Hide response" : "Show response"}</>
        ) : (
          "Generate AI response"
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
              onClick={handleMarkResponded}
              disabled={responded}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
              style={{
                background: responded ? "rgb(16 185 129 / 0.15)" : "var(--bg-secondary)",
                borderColor: responded ? "#10B981" : "var(--border)",
                color: responded ? "#10B981" : "var(--text-secondary)",
              }}
            >
              <CheckSquare size={12} />
              {responded ? "Marked as responded" : "Mark as responded"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Request review modal ─────────────────────────────────────────────────────

function RequestReviewModal({
  onClose,
  businessName,
}: {
  onClose: () => void;
  businessName: string;
}) {
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const load = async () => {
      setLoadingJobs(true);
      const sb = createSupabaseBrowser();
      const { data } = await sb
        .from("jobs")
        .select("id, title, client_id, clients(full_name, email)")
        .eq("status", "completed")
        .eq("is_demo", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) {
        setJobs(
          data.map((j) => {
            const raw = j as {
              id: string;
              title: string;
              clients?: { full_name?: string; email?: string } | null;
            };
            return {
              id: raw.id,
              title: raw.title,
              client_name: raw.clients?.full_name ?? null,
              client_email: raw.clients?.email ?? null,
            };
          })
        );
      }
      setLoadingJobs(false);
    };
    void load();
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const handleSend = async () => {
    if (!selectedJob?.client_email) return;
    setSending(true);
    try {
      await fetch("/api/grow/send-review-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: selectedJob.client_name ?? "there",
          clientEmail: selectedJob.client_email,
          businessName,
          jobTitle: selectedJob.title,
        }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (!modalRef.current?.contains(e.target as Node)) onClose(); }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl dark:bg-[#1a2235]"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Request a Review
          </h2>
          <button type="button" onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCheck size={36} style={{ color: "#10B981" }} />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Review request sent!</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {selectedJob?.client_name ?? "Your client"} will receive an email asking them to leave a review.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-lg px-5 py-2 text-sm font-semibold text-white"
              style={{ background: "#8B5CF6" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Select a completed job and we&apos;ll send the client a friendly email asking for a Google review.
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Completed job
              </label>
              {loadingJobs ? (
                <div className="flex items-center gap-2 py-2" style={{ color: "var(--text-muted)" }}>
                  <Spinner /> Loading jobs…
                </div>
              ) : jobs.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No completed jobs found.</p>
              ) : (
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full rounded-lg border bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 dark:bg-[#161d2e]"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  <option value="">Select a job…</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}{j.client_name ? ` — ${j.client_name}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedJob && (
              <div
                className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1 dark:bg-[#161d2e]"
                style={{ borderColor: "var(--border)" }}
              >
                <p style={{ color: "var(--text-secondary)" }}>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>Client: </span>
                  {selectedJob.client_name ?? "Unknown"}
                </p>
                <p style={{ color: "var(--text-secondary)" }}>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>Email: </span>
                  {selectedJob.client_email ?? (
                    <span style={{ color: "#EF4444" }}>No email on record</span>
                  )}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={!selectedJobId || !selectedJob?.client_email || sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: "#8B5CF6" }}
            >
              {sending ? <><Spinner /> Sending…</> : <><Send size={14} /> Send review request</>}
            </button>

            {selectedJob && !selectedJob.client_email && (
              <p className="text-center text-xs" style={{ color: "#EF4444" }}>
                This client has no email address. Add one in the Clients page first.
              </p>
            )}
          </div>
        )}
      </div>
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
  const [showRequestModal, setShowRequestModal] = useState(false);

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
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Review Hub
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Manage your Google reviews for{" "}
            <span style={{ color: "#A78BFA" }}>{businessName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "#8B5CF6" }}
          >
            Request review from client
          </button>
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
            style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
          >
            Coming soon
          </span>
        </div>
      </div>

      {/* Connection banner */}
      <div
        className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: "rgb(139 92 246 / 0.08)", borderColor: "rgb(139 92 246 / 0.35)" }}
      >
        <div className="flex items-center gap-2.5">
          <Wifi size={18} style={{ color: "#8B5CF6" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Connect your Google Business Profile to start managing reviews automatically.
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
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Demo reviews */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
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
            <ReviewCard key={review.id} review={review} businessName={businessName} />
          ))}
        </div>
      </div>

      {/* Saved responses from DB (if any) */}
      {savedResponses.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Your Saved Responses ({savedResponses.length})
          </h2>
          <div className="space-y-3">
            {savedResponses.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border p-4"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <StarRating rating={r.rating ?? 5} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {r.reviewer_name ?? "Anonymous"}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                    style={{ background: "rgb(16 185 129 / 0.15)", color: "#10B981" }}
                  >
                    {r.response_status}
                  </span>
                </div>
                {r.review_text && (
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
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

      {/* Request review modal */}
      {showRequestModal && (
        <RequestReviewModal
          onClose={() => setShowRequestModal(false)}
          businessName={businessName}
        />
      )}

      {/* Google integration coming soon dialog */}
      <dialog
        ref={dialogRef}
        className="rounded-2xl border bg-white p-6 shadow-2xl backdrop:bg-black/60 dark:bg-[#1a2235]"
        style={{
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
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Google Business Profile
          </h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Google Business Profile integration is coming with the full SERVLO Grow launch in Q3 2026. We&apos;ll notify you when it&apos;s ready.
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
