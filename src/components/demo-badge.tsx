export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#64748b] ring-1 ring-[#cbd5e1] dark:bg-[#1e293b] dark:text-[#94a3b8] dark:ring-[#475569] ${className}`}
    >
      Demo
    </span>
  );
}
