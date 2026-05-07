import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const COLOR = "#0EA5E9";
const COLOR_LIGHT = "#7DD3FC";
const COLOR_BG = "rgb(14 165 233 / 0.12)";
const COLOR_BORDER = "rgb(14 165 233 / 0.3)";

const DEMO_VEHICLES = [
  {
    rego: "ABC 123",
    make: "Toyota HiLux",
    year: 2022,
    type: "Ute",
    driver: "Marcus Webb",
    status: "On job",
    odometer: "42,310 km",
  },
  {
    rego: "XYZ 789",
    make: "Ford Transit",
    year: 2021,
    type: "Van",
    driver: "Dylan Cooper",
    status: "Available",
    odometer: "78,450 km",
  },
  {
    rego: "DEF 456",
    make: "Isuzu D-Max",
    year: 2023,
    type: "Ute",
    driver: "Ben Thornton",
    status: "On job",
    odometer: "15,990 km",
  },
  {
    rego: "GHI 001",
    make: "Volkswagen Transporter",
    year: 2020,
    type: "Van",
    driver: "Unassigned",
    status: "In depot",
    odometer: "91,200 km",
  },
  {
    rego: "JKL 555",
    make: "Toyota LandCruiser",
    year: 2022,
    type: "SUV",
    driver: "Anh Pham",
    status: "Servicing",
    odometer: "38,770 km",
  },
];

export default async function FleetVehiclesPage() {
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
          SERVLO Fleet is launching Q2 2027. Vehicle records shown are a preview.
        </p>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Fleet Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Vehicles
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Manage every vehicle in your fleet.
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Coming soon overlay */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${COLOR} 8%, rgba(0,0,0,0.65))` }}
        >
          <p className="text-base font-bold" style={{ color: COLOR_LIGHT }}>
            Vehicle management available at launch — Q2 2027
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Preview below shows your vehicle registry
          </p>
        </div>

        <div className="p-5" style={{ filter: "blur(1px)", opacity: 0.5 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Rego", "Make & Model", "Type", "Driver", "Status", "Odometer"].map((h) => (
                    <th
                      key={h}
                      className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_VEHICLES.map((v, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-3 pr-4 font-mono text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {v.rego}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {v.make}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {v.year}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: "var(--text-muted)" }}>
                      {v.type}
                    </td>
                    <td className="py-3 pr-4 text-sm" style={{ color: "var(--text-primary)" }}>
                      {v.driver}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background:
                            v.status === "On job"
                              ? "rgb(14 165 233 / 0.15)"
                              : v.status === "Available"
                              ? "rgb(34 197 94 / 0.15)"
                              : v.status === "Servicing"
                              ? "rgb(234 179 8 / 0.15)"
                              : "rgb(255 255 255 / 0.08)",
                          color:
                            v.status === "On job"
                              ? COLOR_LIGHT
                              : v.status === "Available"
                              ? "#86EFAC"
                              : v.status === "Servicing"
                              ? "#FDE047"
                              : "var(--text-muted)",
                        }}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {v.odometer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
