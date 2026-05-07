"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Try refreshing, or contact support at{" "}
          <a href="mailto:hello@servlo.com.au" className="text-[var(--accent-color)] hover:underline">
            hello@servlo.com.au
          </a>
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">Error ID: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent-color)] px-5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] transition"
          >
            Refresh page
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border)] px-5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
