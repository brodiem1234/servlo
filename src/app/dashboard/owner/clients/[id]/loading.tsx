export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 px-4 py-5 md:px-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-52 rounded-md bg-slate-700/50" />
          <div className="h-4 w-64 rounded bg-slate-700/50" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-slate-700/50" />
      </div>

      {/* Client header card */}
      <div className="rounded-xl border border-[var(--border)] bg-slate-700/20 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="h-7 w-40 rounded-md bg-slate-700/50" />
              <div className="h-5 w-20 rounded-full bg-slate-700/50" />
              <div className="h-5 w-16 rounded-full bg-slate-700/50" />
            </div>
            <div className="h-4 w-32 rounded bg-slate-700/50" />
            <div className="h-4 w-48 rounded bg-slate-700/50" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 rounded-lg bg-slate-700/50" />
            <div className="h-9 w-20 rounded-lg bg-slate-700/50" />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-slate-700/20 p-1 w-fit">
        {[88, 56, 80, 72, 80].map((w, i) => (
          <div key={i} className="h-8 rounded bg-slate-700/50" style={{ width: w }} />
        ))}
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-slate-700/20 p-4">
            <div className="h-3 w-24 rounded bg-slate-700/50" />
            <div className="mt-3 h-7 w-28 rounded bg-slate-700/50" />
          </div>
        ))}
      </div>

      {/* Details card */}
      <div className="rounded-xl border border-[var(--border)] bg-slate-700/20 p-5">
        <div className="h-5 w-32 rounded bg-slate-700/50 mb-4" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 rounded bg-slate-700/50" />
              <div className="h-5 w-36 rounded bg-slate-700/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
