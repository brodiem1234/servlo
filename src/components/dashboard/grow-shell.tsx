"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Megaphone, Settings2, Share2, Star, Users2 } from "lucide-react";
import React, { useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { ProductSwitcher } from "./product-switcher";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { HelpButton } from "./help-button";
import { DarkModeToggle } from "@/components/dashboard/dark-mode-toggle";

const GROW_COLOR = "#8B5CF6";

type NavItem = { href: string; label: string; Icon: LucideIcon };

const GROW_NAV: NavItem[] = [
  { href: "/dashboard/grow", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/grow/ads", label: "AI Ad Creation", Icon: Megaphone },
  { href: "/dashboard/grow/social", label: "Social Content", Icon: Share2 },
  { href: "/dashboard/grow/reviews", label: "Google Reviews", Icon: Star },
  { href: "/dashboard/grow/referrals", label: "Referral Tracking", Icon: Users2 },
  { href: "/dashboard/owner/settings?from=grow", label: "Settings", Icon: Settings2 },
];

function isActive(pathname: string, href: string) {
  const hrefPath = href.split("?")[0];
  if (hrefPath === "/dashboard/grow") return pathname === "/dashboard/grow";
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

export default function GrowShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const handleSignOut = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }, [router]);

  return (
    <div
      data-product="grow"
      className="dark dashboard-theme min-h-screen"
      style={{
        background: "var(--product-main)",
        "--sidebar-active-bg": GROW_COLOR,
        "--sidebar-ring": GROW_COLOR,
      } as React.CSSProperties}
    >
      {/* Sidebar */}
      <aside
        className="owner-sidebar fixed left-0 top-0 z-40 hidden h-screen w-[256px] flex-col overflow-y-auto px-4 py-6 shadow-[inset_-1px_0_0_var(--sidebar-divider)] md:flex"
        style={{ background: "var(--product-sidebar)", color: "var(--sidebar-text)" }}
      >
        {/* Brand */}
        <div className="mb-4 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="SERVLO"
            width={120}
            height={120}
            style={{ height: "auto", maxWidth: "120px", filter: "var(--logo-filter)" }}
          />
          <div className="mt-3 h-[2px] w-full" style={{ background: "var(--product-accent)" }} aria-hidden />
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
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors border-l-4 border-transparent"
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
            className="rounded-lg px-3 py-2.5"
            style={{ background: "rgb(139 92 246 / 0.12)", border: "1px solid rgb(139 92 246 / 0.3)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "#C4B5FD" }}>
              Coming soon
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--sidebar-text-muted)" }}>
              SERVLO Grow launches Q3 2026
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-col md:pl-[256px]" style={{ background: "var(--product-main)" }}>
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
              className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD", border: "1px solid rgb(139 92 246 / 0.35)" }}
            >
              Coming soon
            </span>
          </p>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--product-accent)" }}
            >
              Sign Out
            </button>
          </div>
        </header>
        <main className="p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
      <HelpButton />
    </div>
  );
}
