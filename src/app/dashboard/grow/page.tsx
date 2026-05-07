import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrendingUp, Megaphone, Share2, Star, Users2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GrowDashboardPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) redirect("/auth/login");

  const [
    { count: campaignsCount },
    { count: postsCount },
    { count: reviewsCount },
    { count: referralsCount },
  ] = await Promise.all([
    sb
      .from("grow_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    sb
      .from("grow_social_posts")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    sb
      .from("grow_review_responses")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    sb
      .from("grow_referrals")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
  ]);

  const allZero =
    !campaignsCount && !postsCount && !reviewsCount && !referralsCount;

  const STAT_CARDS = [
    {
      label: "Ads Created",
      value: campaignsCount ?? 0,
      Icon: Megaphone,
    },
    {
      label: "Social Posts",
      value: postsCount ?? 0,
      Icon: Share2,
    },
    {
      label: "Review Responses",
      value: reviewsCount ?? 0,
      Icon: Star,
    },
    {
      label: "Referrals",
      value: referralsCount ?? 0,
      Icon: Users2,
    },
  ];

  const QUICK_START = [
    {
      title: "Create your first ad",
      description:
        "Build a high-converting ad for Google, Facebook or Instagram in minutes.",
      href: "/dashboard/grow/ads",
      Icon: Megaphone,
    },
    {
      title: "Set up review responses",
      description:
        "Draft AI-powered responses to your Google reviews automatically.",
      href: "/dashboard/grow/reviews",
      Icon: Star,
    },
    {
      title: "Share your referral link",
      description:
        "Earn $50 for every new SERVLO subscriber you refer. Share your link today.",
      href: "/dashboard/grow/referrals",
      Icon: Users2,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Grow Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Your marketing performance at a glance.
          </p>
        </div>
        <span
          className="mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
          style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
        >
          Coming soon
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border p-5"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "rgb(139 92 246 / 0.15)" }}
              >
                <Icon size={15} style={{ color: "#8B5CF6" }} />
              </span>
            </div>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {value === 0 ? "No activity yet" : "Total records"}
            </p>
          </div>
        ))}
      </div>

      {/* Quick start — shown when everything is zero */}
      {allZero && (
        <div
          className="rounded-xl border p-6"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="mb-1 text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Quick start
          </h2>
          <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>
            Get started with SERVLO GROW — build your online presence in
            minutes.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {QUICK_START.map(({ title, description, href, Icon }) => (
              <Link
                key={href}
                href={href as any}
                className="group flex flex-col gap-3 rounded-xl border p-5 transition-colors hover:border-purple-500/50"
                style={{
                  background: "rgb(139 92 246 / 0.06)",
                  borderColor: "var(--border)",
                }}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: "rgb(139 92 246 / 0.18)" }}
                >
                  <Icon size={18} style={{ color: "#8B5CF6" }} />
                </span>
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {title}
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {description}
                  </p>
                </div>
                <span
                  className="mt-auto text-xs font-semibold"
                  style={{ color: "#8B5CF6" }}
                >
                  Get started →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Launch notice */}
      <div
        className="flex flex-col items-center justify-center rounded-xl border py-12 text-center"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgb(139 92 246 / 0.15)" }}
        >
          <TrendingUp size={32} style={{ color: "#8B5CF6" }} />
        </span>
        <h2
          className="mt-4 text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          SERVLO GROW launching Q3 2026
        </h2>
        <p
          className="mt-2 max-w-sm text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          AI-powered ads, social content, review automation and referral
          tracking — built for Australian service businesses.
        </p>
      </div>
    </section>
  );
}
