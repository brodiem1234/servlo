"use client";

import { useState } from "react";

interface SurveyFormProps {
  jobId: string;
  token: string;
}

const STAR_LABELS = ["Terrible", "Poor", "OK", "Good", "Excellent"];

export function SurveyForm({ jobId, token }: SurveyFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/surveys/satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          token,
          rating,
          feedback: feedback.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mb-4 text-5xl" aria-hidden="true">🙏</div>
        <h2 className="text-xl font-bold text-white">Thank you!</h2>
        <p className="mt-2 text-sm text-gray-400">
          Your feedback has been submitted and is greatly appreciated.
        </p>
      </div>
    );
  }

  const activeRating = hovered ?? rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Star rating */}
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-300">
          Rate your experience
        </label>
        <div
          className="flex items-center justify-center gap-2"
          role="group"
          aria-label="Star rating"
          onMouseLeave={() => setHovered(null)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star !== 1 ? "s" : ""}: ${STAR_LABELS[star - 1]}`}
              aria-pressed={rating === star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              className="text-4xl transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {activeRating !== null && star <= activeRating ? "⭐" : "☆"}
            </button>
          ))}
        </div>
        {activeRating && (
          <p className="mt-2 text-center text-sm text-gray-400">
            {STAR_LABELS[activeRating - 1]}
          </p>
        )}
      </div>

      {/* Feedback textarea */}
      <div>
        <label
          htmlFor="survey-feedback"
          className="mb-1.5 block text-sm font-medium text-gray-300"
        >
          Additional comments{" "}
          <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          id="survey-feedback"
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          maxLength={2000}
          placeholder="Tell us what went well or what could be improved..."
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!rating || submitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit feedback"}
      </button>
    </form>
  );
}
