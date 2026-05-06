export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-900 ring-1 ring-violet-300 dark:bg-violet-950 dark:text-violet-100 dark:ring-violet-700 ${className}`}
    >
      Demo
    </span>
  );
}
