import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Hammer, FilePlus, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const COLOR = "#F97316";
const COLOR_LIGHT = "#FDBA74";
const COLOR_BG = "rgb(249 115 22 / 0.12)";
const COLOR_BORDER = "rgb(249 115 22 / 0.3)";

export default async function HireDashboardPage() {
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
        <div>
          <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
            SERVLO Hire is launching Q1 2027. You&apos;re on the early access list.
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            The trade job board built for Australian service businesses.
          </p>
        </div>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Hire Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      {/* Hero */}
      <div
        className="flex flex-col items-center justify-center rounded-xl border py-16 text-center"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: COLOR_BG }}
        >
          <Hammer size={32} style={{ color: COLOR }} />
        </span>
        <h1 className="mt-4 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Trade Job Board
        </h1>
        <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
          Post jobs, find qualified tradies, and build your on-call team — launching Q1 2027.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/hire/post"
          className="group flex flex-col gap-4 rounded-xl border p-6 transition-colors no-underline"
          style={{
            background: COLOR_BG,
            borderColor: COLOR_BORDER,
          }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "rgb(249 115 22 / 0.2)" }}
          >
            <FilePlus size={22} style={{ color: COLOR }} />
          </span>
          <div>
            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Post a Job
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              List a role and get matched with verified tradies in your area.
            </p>
          </div>
          <span className="mt-auto text-sm font-semibold" style={{ color: COLOR }}>
            Create listing →
          </span>
        </Link>

        <Link
          href="/dashboard/hire/browse"
          className="group flex flex-col gap-4 rounded-xl border p-6 transition-colors no-underline"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: COLOR_BG }}
          >
            <Search size={22} style={{ color: COLOR }} />
          </span>
          <div>
            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Browse Tradies
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Search verified tradies by trade type, suburb and availability.
            </p>
          </div>
          <span className="mt-auto text-sm font-semibold" style={{ color: COLOR }}>
            Search tradies →
          </span>
        </Link>
      </div>
    </section>
  );
}
