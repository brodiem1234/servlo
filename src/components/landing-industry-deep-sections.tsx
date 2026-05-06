import {
  ClipboardList,
  HardHat,
  HeartPulse,
  LayoutList,
  Megaphone,
  PartyPopper,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { Fragment } from "react";
import { LANDING_INDUSTRY_ORDER, type LandingIndustrySlug } from "@/lib/industries";
import { LANDING_INDUSTRY_COPY } from "@/lib/industry-marketing";

const ICONS: Record<LandingIndustrySlug, LucideIcon> = {
  trades: HardHat,
  cleaning: Sparkles,
  events: PartyPopper,
  marketing: Megaphone,
  health: HeartPulse,
  field_services: ClipboardList
};

/** Minimal decorative visuals — keep weight consistent across industries */
function IndustryVisual({ slug }: { slug: LandingIndustrySlug }) {
  const shell =
    "rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#0f172a]/95 dark:shadow-[0_20px_50px_-16px_rgba(0,0,0,0.55)]";

  if (slug === "trades") {
    return (
      <div className={shell}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today</p>
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#1a2639]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#1e3a5f] dark:text-white">Switchboard upgrade</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Norwood · In progress</p>
            </div>
            <span className="shrink-0 rounded-md bg-[color-mix(in_srgb,var(--accent-color)_18%,transparent)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-color)]">
              Job
            </span>
          </div>
          <div className="mt-2 flex gap-2 border-t border-slate-200/80 pt-2 dark:border-white/10">
            <span className="rounded bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm dark:bg-white/10 dark:text-slate-300">
              9:00–15:00
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Sam · Van 2</span>
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {["M", "T", "W", "T", "F"].map((d, i) => (
            <div
              key={`${d}-${i}`}
              className={`flex h-8 flex-1 items-center justify-center rounded-md text-[10px] font-semibold ${
                i === 2
                  ? "bg-[var(--accent-color)] text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slug === "cleaning") {
    return (
      <div className={shell}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Schedule</p>
          <LayoutList className="h-4 w-4 text-[var(--accent-color)]" aria-hidden />
        </div>
        <ul className="mt-3 space-y-2.5">
          {[
            { t: "09:00", l: "Residential · Kensington" },
            { t: "11:30", l: "Commercial · CBD tower" },
            { t: "14:00", l: "NDIS · Prospect" }
          ].map((row) => (
            <li
              key={row.l}
              className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/90 px-3 py-2 dark:border-white/[0.07] dark:bg-[#1a2639]/90"
            >
              <span className="w-11 shrink-0 text-[10px] font-bold tabular-nums text-[var(--accent-color)]">{row.t}</span>
              <span className="min-w-0 text-[11px] font-medium leading-snug text-[#334155] dark:text-slate-200">{row.l}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (slug === "events") {
    const steps = ["Bump-in", "Show", "Bump-out"];
    return (
      <div className={shell}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Run sheet</p>
        <div className="mt-5 flex w-full items-start justify-center gap-1 sm:gap-2">
          {steps.map((label, i) => (
            <Fragment key={label}>
              <div className="flex w-[4.25rem] shrink-0 flex-col items-center text-center sm:w-[4.75rem]">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold ${
                    i === 1
                      ? "bg-[var(--accent-color)] text-white shadow-md shadow-[color-mix(in_srgb,var(--accent-color)_35%,transparent)]"
                      : "border border-slate-200 bg-white text-slate-600 dark:border-white/15 dark:bg-[#1a2639] dark:text-slate-300"
                  }`}
                >
                  {i + 1}
                </div>
                <p className="mt-2 text-[10px] font-semibold leading-snug text-[#334155] dark:text-slate-300">{label}</p>
              </div>
              {i < steps.length - 1 ? (
                <div
                  className="mx-0.5 mt-[17px] hidden h-[3px] flex-1 rounded-full bg-slate-200 sm:mx-1 sm:block dark:bg-white/12"
                  aria-hidden
                />
              ) : null}
            </Fragment>
          ))}
        </div>
        <div className="mt-4 flex gap-1 sm:hidden" aria-hidden>
          <div className="h-1 flex-1 rounded-full bg-[var(--accent-color)]/35" />
          <div className="h-1 flex-1 rounded-full bg-[var(--accent-color)]" />
          <div className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-white/15" />
        </div>
      </div>
    );
  }

  if (slug === "marketing") {
    return (
      <div className={shell}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Deliverables</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { n: "Scope", c: "Draft" },
            { n: "Build", c: "Active" },
            { n: "Review", c: "Hold" }
          ].map((col) => (
            <div
              key={col.n}
              className="rounded-lg border border-slate-100 bg-slate-50/80 p-2 dark:border-white/[0.07] dark:bg-[#1a2639]/80"
            >
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{col.n}</p>
              <div className="mt-2 space-y-1.5">
                <div className="h-2 rounded bg-[color-mix(in_srgb,var(--accent-color)_35%,#e2e8f0)] dark:bg-[color-mix(in_srgb,var(--accent-color)_28%,transparent)]" />
                <div className="h-2 rounded bg-slate-200/90 dark:bg-white/10" />
              </div>
              <p className="mt-2 text-[9px] font-medium text-[var(--accent-color)]">{col.c}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slug === "health") {
    return (
      <div className={shell}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today · Practitioners</p>
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
          {[
            ["09:15", "Initial consult"],
            ["10:30", "Follow-up"],
            ["15:00", "Studio session"]
          ].map(([time, label]) => (
            <div key={label} className="contents">
              <span className="text-[10px] font-bold tabular-nums text-[var(--accent-color)]">{time}</span>
              <div className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-[11px] font-medium text-[#334155] shadow-sm dark:border-white/10 dark:bg-[#1a2639] dark:text-slate-200">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* field_services */
  return (
    <div className={shell}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Route · Inspections</p>
        <ClipboardList className="h-4 w-4 text-[var(--accent-color)]" aria-hidden />
      </div>
      <div className="mt-3 flex gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${
              n === 2 ? "bg-[var(--accent-color)] text-white" : "border border-dashed border-slate-300 text-slate-500 dark:border-white/20 dark:text-slate-400"
            }`}
          >
            {n}
          </div>
        ))}
      </div>
      <ul className="mt-3 space-y-2">
        {["Photo log attached", "Compliance PDF ready", "Quote drafted"].map((item) => (
          <li key={item} className="flex items-center gap-2 text-[11px] text-[#334155] dark:text-slate-300">
            <span className="text-[var(--accent-color)]" aria-hidden>
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingIndustryDeepSections() {
  return (
    <>
      {LANDING_INDUSTRY_ORDER.map((slug, index) => {
        const copy = LANDING_INDUSTRY_COPY[slug];
        const Icon = ICONS[slug];
        const isOddStripe = index % 2 === 0;

        return (
          <section
            key={slug}
            id={`industry-${slug}`}
            className={`scroll-mt-28 border-t py-20 md:py-28 ${
              isOddStripe
                ? "border-slate-200 bg-white dark:border-white/[0.06] dark:bg-[#151f2e]"
                : "border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-[#1e2a3a]"
            }`}
          >
            <div className="mx-auto max-w-7xl px-4 md:px-6">
              <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between md:gap-14 lg:gap-20">
                <div className="min-w-0 flex-1 md:max-w-2xl lg:max-w-[52%]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent-color)_14%,transparent)] text-[var(--accent-color)] ring-1 ring-[color-mix(in_srgb,var(--accent-color)_22%,transparent)] dark:bg-[color-mix(in_srgb,var(--accent-color)_12%,transparent)] dark:ring-[color-mix(in_srgb,var(--accent-color)_20%,transparent)]">
                      <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                    </span>
                    <p className="text-base font-bold uppercase tracking-[0.14em] text-[var(--accent-color)] md:text-lg">
                      {copy.headline}
                    </p>
                  </div>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#64748b] dark:text-slate-400 md:text-base">
                    {copy.tileHint}
                  </p>
                  <h3 className="mt-5 text-xl font-semibold leading-snug tracking-tight text-[#1e3a5f] dark:text-white md:text-2xl">
                    {copy.tagline}
                  </h3>
                  <ul className="mt-8 max-w-xl space-y-5 md:space-y-6">
                    {copy.bullets.map((b) => (
                      <li key={b} className="flex gap-4 text-sm leading-relaxed text-[#475569] dark:text-slate-300 md:text-base">
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent-color)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent-color)_10%,transparent)] text-sm font-bold text-[var(--accent-color)] dark:border-[color-mix(in_srgb,var(--accent-color)_35%,transparent)] dark:bg-[color-mix(in_srgb,var(--accent-color)_8%,transparent)]"
                          aria-hidden
                        >
                          ✓
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-full shrink-0 md:sticky md:top-28 md:w-[min(100%,320px)] lg:w-[340px]">
                  <IndustryVisual slug={slug} />
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
