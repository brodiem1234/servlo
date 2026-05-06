"use client";

import dynamic from "next/dynamic";

export type MapJobPin = { id: string; title: string | null; addressLine: string };

const TodayJobsMapInner = dynamic(() => import("./today-jobs-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center text-sm text-[var(--text-muted)] md:h-[360px]">
      Loading map…
    </div>
  )
});

export default function TodayJobsMap({ jobs }: { jobs: MapJobPin[] }) {
  return <TodayJobsMapInner jobs={jobs} />;
}
