"use client";

import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { LayoutDashboard, Megaphone, Share2, Star, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductSwitcher } from "./product-switcher";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

type NavItem = { href: string; label: string; Icon: LucideIcon };

const GROW_NAV: NavItem[] = [
  { href: "/dashboard/grow", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/grow/ads", label: "AI Ad Creation", Icon: Megaphone },
  { href: "/dashboard/grow/social", label: "Social Content", Icon: Share2 },
  { href: "/dashboard/grow/reviews", label: "Google Reviews", Icon: Star },
  { href: "/dashboard/grow/referrals", label: "Referral Tracking", Icon: Users2 },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard/grow") return pathname === "/dashboard/grow";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function GrowShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="dashboard-theme min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside
        className="owner-sidebar fixed left-0 top-0 z-40 hidden h-screen w-[256px] flex-col overflow-y-auto px-4 py-6 shadow-[inset_-1px_0_0_var(--sidebar-divider)] md:flex"
        style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-text)" }}
      >
        {/* Brand */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span
              className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full p-0.5 shadow-inner ring-2 ring-[color-mix(in_srgb,var(--accent-color)_55%,white)]"
              style={{ background: "var(--accent-color)" }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
                style={{ color: "var(--accent-color)" }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-[26px] w-[26px]">
                  <text
                    x="12"
                    y="17"
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="700"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    fill="currentColor"
                  >
                    S
                  </text>
                </svg>
              </span>
            </span>
            <div>
              <p className="text-xl font-bold tracking-wide" style={{ color: "var(--sidebar-text)" }}>
                SERVLO
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--accent-color)" }}>
                Grow
              </p>
            </div>
          </div>
          <div className="mt-2 h-[2px] w-full" style={{ background: "var(--sidebar-ring)" }} aria-hidden />
        </div>

        {/* Product switcher */}
        <div className="mb-4">
          <ProductSwitcher activeProduct="grow" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0">
          <div className="flex flex-col gap-2">
            {GROW_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  data-active={active ? "true" : "false"}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
                  style={{ color: "var(--sidebar-text)" }}
                >
                  <item.Icon size={15} aria-hidden />
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>

        {/* Coming-soon notice */}
        <div className="mt-auto">
          <div
            className="rounded-lg px-3 py-2.5 ring-1 ring-amber-400/30"
            style={{ background: "rgb(245 158 11 / 0.1)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "rgb(251 191 36)" }}>
              Coming soon
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--sidebar-text-muted)" }}>
              SERVLO Grow launches Q3 2026
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-col md:pl-[256px]">
        <header
          className="flex items-center justify-between border-b px-4 py-3 md:px-6"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            SERVLO Grow
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-amber-400/30"
              style={{ background: "rgb(245 158 11 / 0.15)", color: "rgb(251 191 36)" }}
            >
              Coming soon
            </span>
          </p>
          <ThemeToggleButton />
        </header>
        <main className="p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
