import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Lock, Zap, TrendingUp, Briefcase, type LucideIcon } from "lucide-react";

type ProductDef = {
  id: string;
  name: string;
  tagline: string;
  features: string[];
  price: string;
  href: string;
  active: boolean;
  badge?: string;
  Icon: LucideIcon;
};

const PRODUCTS: ProductDef[] = [
  {
    id: "core",
    name: "SERVLO Core",
    tagline: "Run your service business end-to-end",
    features: [
      "Jobs & scheduling",
      "Client management",
      "Invoices & quotes",
      "Team timesheets",
      "Purchase orders",
      "Business dashboard",
    ],
    price: "From $49/mo",
    href: "/dashboard/owner",
    active: true,
    Icon: Briefcase,
  },
  {
    id: "grow",
    name: "SERVLO Grow",
    tagline: "AI-powered marketing for service businesses",
    features: [
      "AI ad creation",
      "Social media content",
      "Google review automation",
      "Referral tracking",
      "Campaign analytics",
    ],
    price: "From $59/mo",
    href: "/dashboard/grow",
    active: false,
    badge: "Launching soon",
    Icon: TrendingUp,
  },
  {
    id: "leads",
    name: "SERVLO Leads",
    tagline: "Buy qualified leads in your industry",
    features: [
      "Browse leads marketplace",
      "Industry-filtered leads",
      "Lead pipeline tracking",
      "Pay per lead model",
      "Quality guaranteed",
    ],
    price: "From $12/lead",
    href: "/dashboard/leads",
    active: false,
    badge: "Launching soon",
    Icon: Zap,
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "employee") redirect("/dashboard/employee");
  if (profile?.role === "client") redirect("/dashboard/client");

  // For owners: redirect directly to the owner dashboard if they already have a business set up.
  // Only show the platform selector to brand-new users who haven't completed onboarding yet.
  if (profile?.role === "owner") {
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (business) redirect("/dashboard/owner");
  }

  // Fall-through: brand-new user with no business yet — show platform selector
  return (
    <div className="dashboard-theme min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent-color)" }}>
              Platform
            </span>
          </div>
          <h1 className="text-3xl font-bold md:text-4xl" style={{ color: "var(--text-primary)" }}>
            SERVLO Platform
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-muted)" }}>
            Three products, one platform — manage, grow, and fill your pipeline.
          </p>
        </div>

        {/* Product cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {PRODUCTS.map((p) => {
            const { Icon } = p;
            return (
              <article
                key={p.id}
                className="relative flex flex-col rounded-xl border p-6"
                style={{
                  background: "var(--bg-card)",
                  borderColor: p.active ? "var(--accent-color)" : "var(--border)",
                  boxShadow: p.active ? "0 0 0 1px var(--accent-color)" : undefined,
                  opacity: p.active ? 1 : 0.85,
                }}
              >
                {p.badge && (
                  <span className="absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-amber-400/30"
                    style={{ background: "rgb(245 158 11 / 0.15)", color: "rgb(251 191 36)" }}>
                    {p.badge}
                  </span>
                )}

                <div className="mb-4 flex items-center gap-3">
                  {!p.active && <Lock size={14} style={{ color: "var(--text-muted)" }} />}
                  {p.active && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: "color-mix(in srgb, var(--accent-color) 15%, transparent)" }}>
                      <Icon size={16} className="text-[--accent-color]" style={{ color: "var(--accent-color)" }} />
                    </span>
                  )}
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {p.name}
                  </h2>
                </div>

                <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
                  {p.tagline}
                </p>

                <ul className="flex-1 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span
                        className="mt-0.5 shrink-0"
                        aria-hidden
                        style={{ color: p.active ? "var(--accent-color)" : "var(--text-muted)" }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <p className="mt-5 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {p.price}
                </p>

                {p.active ? (
                  <Link
                    href={p.href as any}
                    className="mt-4 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "var(--accent-color)" }}
                  >
                    Open Core →
                  </Link>
                ) : (
                  <Link
                    href={p.href as any}
                    className="mt-4 block rounded-lg border px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    View Details
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

