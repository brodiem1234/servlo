/** Skeleton shown while owner dashboard routes resolve data */
export default function OwnerRouteSkeleton() {
  return (
    <div className="animate-pulse space-y-6 px-4 py-5 md:px-6">
      <div className="space-y-2">
        <div className="h-8 w-48 max-w-[60%] rounded-md bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-72 max-w-[80%] rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-10 w-28 rounded-md bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-36 rounded-md bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-[92%] rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-[85%] rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-4 grid gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-full rounded bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
