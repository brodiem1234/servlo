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

  const tileBase =
    "group flex w-full flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm outline-none transition duration-200 ease-out will-change-transform dark:border-slate-700 dark:bg-[#111827]";

  const interactiveHover =
    "hover:-translate-y-[2px] hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/10 dark:hover:border-slate-600 dark:hover:shadow-black/40";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {LANDING_INDUSTRY_ORDER.map((slug) => {
        const copy = LANDING_INDUSTRY_COPY[slug];
        const Icon = ICONS[slug];
        const isActive = active === slug;
        return (
          <button
            key={slug}
            type="button"
            onClick={() => focus(slug)}
            data-reveal
            className={`reveal-item ${tileBase} border-l-[3px] ${interactiveHover} ${
              isActive
                ? "border-l-[var(--accent-color)] border-[color-mix(in_srgb,var(--accent-color)_28%,#e2e8f0)] bg-[color-mix(in_srgb,var(--accent-color)_11%,#ffffff)] shadow-md ring-1 ring-[color-mix(in_srgb,var(--accent-color)_22%,transparent)] dark:border-[color-mix(in_srgb,var(--accent-color)_35%,#334155)] dark:bg-[color-mix(in_srgb,var(--accent-color)_14%,#111827)] dark:ring-[color-mix(in_srgb,var(--accent-color)_25%,transparent)]"
                : "border-l-transparent"
            }`}
          >
            <Icon className="h-11 w-11 shrink-0 text-[var(--accent-color)] dark:text-cyan-400" strokeWidth={1.75} aria-hidden />
            <span className="text-[18px] font-bold leading-snug tracking-tight text-[#1e3a5f] dark:text-white">
              {copy.headline}
            </span>
            <span className="text-[13px] leading-relaxed text-[#64748b] opacity-60 dark:text-slate-300">{copy.tileHint}</span>
          </button>
        );
      })}
    </div>
  );
}
