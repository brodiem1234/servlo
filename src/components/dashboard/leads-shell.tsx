"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import React from "react";
import { LayoutDashboard, ShoppingBag, ClipboardList, GitBranch } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductSwitcher } from "./product-switcher";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

const LEADS_COLOR = "#F59E0B";
const LEADS_BG = "#1a1005";
const LEADS_LOGO_FILTER =
  "brightness(0) saturate(100%) invert(1) sepia(1) saturate(4) hue-rotate(10deg)";

type NavItem = { href: string; label: string; Icon: LucideIcon };

const LEADS_NAV: NavItem[] = [
  { href: "/dashboard/leads", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/leads/browse", label: "Browse Leads", Icon: ShoppingBag },
  { href: "/dashboard/leads/my-leads", label: "My Leads", Icon: ClipboardList },
  { href: "/dashboard/leads/pipeline", label: "Lead Pipeline", Icon: GitBranch },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard/leads") return pathname === "/dashboard/leads";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function LeadsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className="dashboard-theme min-h-screen"
      style={{
        background: "var(--bg-primary)",
        "--sidebar-active-bg": LEADS_COLOR,
        "--sidebar-ring": LEADS_COLOR,
      } as React.CSSProperties}
    >
      {/* Sidebar */}
      <aside
        className="owner-sidebar fixed left-0 top-0 z-40 hidden h-screen w-[256px] flex-col overflow-y-auto px-4 py-6 shadow-[inset_-1px_0_0_var(--sidebar-divider)] md:flex"
        style={{ background: LEADS_BG, color: "var(--sidebar-text)" }}
      >
        {/* Brand */}
        <div className="mb-4">
          <Image
            src="/logo.png"
            alt="SERVLO"
            width={120}
            height={120}
            style={{ height: "auto", maxWidth: "120px", filter: LEADS_LOGO_FILTER }}
          />
          <div className="mt-3 h-[2px] w-full" style={{ background: "var(--sidebar-ring)" }} aria-hidden />
        </div>

        {/* Product switcher */}
        <div className="mb-4">
          <ProductSwitcher activeProduct="leads" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0">
          <div className="flex flex-col gap-2">
            {LEADS_NAV.map((item) => {
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
              SERVLO Leads launches Q4 2026
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
            SERVLO Leads
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
