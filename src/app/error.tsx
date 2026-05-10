"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-secondary)" }}>
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Something went wrong</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          An unexpected error occurred. Our team has been notified.
          {error.digest ? ` (ref: ${error.digest})` : ""}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--accent-color)" }}
          >
            Try again
          </button>
          <Link
            href="/dashboard/owner"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border"
            style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
