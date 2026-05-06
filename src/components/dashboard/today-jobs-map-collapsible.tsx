"use client";

import { useEffect, useState } from "react";
import TodayJobsMap from "@/components/dashboard/today-jobs-map";
import type { MapJobPin } from "@/components/dashboard/today-jobs-map";

export default function TodayJobsMapCollapsible({ jobs }: { jobs: MapJobPin[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setOpen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Today&apos;s jobs map</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Pins use job addresses (OpenStreetMap).</p>
        </div>
        <span className="text-xs font-semibold text-[var(--accent-color)]">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div className="border-t border-[var(--border)] p-3">
          <TodayJobsMap jobs={jobs} />
        </div>
      ) : null}
    </article>
  );
}
