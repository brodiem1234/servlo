import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

const COLOR = "#F97316";
const COLOR_LIGHT = "#FDBA74";
const COLOR_BG = "rgb(249 115 22 / 0.12)";
const COLOR_BORDER = "rgb(249 115 22 / 0.3)";

const DEMO_TRADIES = [
  {
    name: "Marcus Webb",
    trade: "Electrician",
    suburb: "Surry Hills, NSW",
    rating: 4.9,
    reviews: 47,
    rate: "$95/hr",
    badge: "Licensed",
  },
  {
    name: "Anh Pham",
    trade: "Plumber",
    suburb: "Brunswick, VIC",
    rating: 4.8,
    reviews: 83,
    rate: "$105/hr",
    badge: "Licensed",
  },
  {
    name: "Dylan Cooper",
    trade: "Builder",
    suburb: "Fortitude Valley, QLD",
    rating: 4.7,
    reviews: 31,
    rate: "$130/hr",
    badge: "Insured",
  },
  {
    name: "Chloe Santos",
    trade: "Painter",
    suburb: "Fremantle, WA",
    rating: 5.0,
    reviews: 19,
    rate: "$75/hr",
    badge: "Top rated",
  },
  {
    name: "Ben Thornton",
    trade: "HVAC Technician",
    suburb: "Norwood, SA",
    rating: 4.6,
    reviews: 62,
    rate: "$110/hr",
    badge: "Licensed",
  },
  {
    name: "Rosa Ferreira",
    trade: "Landscaper",
    suburb: "Manly, NSW",
    rating: 4.9,
    reviews: 28,
    rate: "$80/hr",
    badge: "Insured",
  },
];

export default async function HireBrowsePage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <section className="space-y-6">
      {/* Launch banner */}
      <div
        className="flex items-center justify-between gap-4 rounded-xl px-5 py-4"
        style={{ background: COLOR_BG, border: `1px solid ${COLOR_BORDER}` }}
      >
        <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
          SERVLO Hire is launching Q1 2027. Tradie profiles shown are a preview.
        </p>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Hire Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Browse Tradies
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Find verified tradies matched to your trade and location.
        </p>
      </div>

      {/* Search bar — disabled */}
      <input
        type="search"
        placeholder="Search by trade, name or suburb..."
        disabled
        className="w-full rounded-xl border px-4 py-3 text-sm"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
          opacity: 0.5,
        }}
      />

      {/* Tradie cards grid with overlay */}
      <div className="relative">
        {/* Overlay */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${COLOR} 8%, rgba(0,0,0,0.6))` }}
        >
          <p className="text-base font-bold" style={{ color: COLOR_LIGHT }}>
            Tradie directory available at launch — Q1 2027
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Preview below shows what verified tradie profiles look like
          </p>
        </div>

        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          style={{ filter: "blur(1px)", opacity: 0.45, pointerEvents: "none" }}
        >
          {DEMO_TRADIES.map((tradie) => (
            <div
              key={tradie.name}
              className="flex flex-col gap-3 rounded-xl border p-5"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: COLOR }}
                >
                  {tradie.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {tradie.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {tradie.trade}
                  </p>
                </div>
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: COLOR_BG, color: COLOR_LIGHT }}
                >
                  {tradie.badge}
                </span>
              </div>

              {/* Details */}
              <div
                className="space-y-1 border-t pt-3"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Location
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    {tradie.suburb}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Rate
                  </span>
                  <span className="text-xs font-bold" style={{ color: COLOR }}>
                    {tradie.rate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Rating
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    <Star size={11} style={{ color: "#FBBF24", fill: "#FBBF24" }} />
                    {tradie.rating} ({tradie.reviews})
                  </span>
                </div>
              </div>

              <button
                disabled
                className="mt-1 w-full rounded-lg py-2 text-xs font-semibold text-white opacity-60"
                style={{ background: COLOR }}
              >
                View profile
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
