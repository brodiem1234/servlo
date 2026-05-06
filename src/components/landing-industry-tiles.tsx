"use client";

import { useCallback, useState } from "react";
import type { LandingIndustrySlug } from "@/lib/industries";
import { LANDING_INDUSTRY_ORDER } from "@/lib/industries";
import { LANDING_INDUSTRY_COPY } from "@/lib/industry-marketing";
import { ClipboardList, HardHat, HeartPulse, Megaphone, PartyPopper, Sparkles, type LucideIcon } from "lucide-react";

const ICONS: Record<LandingIndustrySlug, LucideIcon> = {
  trades: HardHat,
  cleaning: Sparkles,
  events: PartyPopper,
  marketing: Megaphone,
  health: HeartPulse,
  field_services: ClipboardList
};

export function LandingIndustryTiles() {
  const [active, setActive] = useState<LandingIndustrySlug>("trades");

  const focus = useCallback((slug: LandingIndustrySlug) => {
    setActive(slug);
    document.getElementById(`industry-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {LANDING_INDUSTRY_ORDER.map((slug) => {
        const copy = LANDING_INDUSTRY_COPY[slug];
        const Icon = ICONS[slug];
        const isActive = active === slug;
        return (
          <button
            key={slug}
            type="button"
            onClick={() => focus(slug)}
            className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left shadow-sm transition hover:border-[#0db8c8]/60 hover:shadow-md dark:hover:border-cyan-400/50 ${
              isActive
                ? "border-[#0db8c8] bg-[#e6f9fb] ring-2 ring-[#0db8c8]/30 dark:border-cyan-400 dark:bg-[#10283a] dark:ring-cyan-400/25"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111827]"
            }`}
          >
            <Icon className="h-7 w-7 shrink-0 text-[#0db8c8] dark:text-cyan-400" strokeWidth={1.75} aria-hidden />
            <span className="text-base font-bold text-[#1e3a5f] dark:text-white">{copy.headline}</span>
            <span className="text-xs leading-snug text-[#64748b] dark:text-slate-400">{copy.tileHint}</span>
          </button>
        );
      })}
    </div>
  );
}
