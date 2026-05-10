"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import React, { useCallback, useState } from "react";
import {
  LayoutDashboard,
  ClipboardSignature,
  Wallet,
  RefreshCcw,
  Calculator,
  Menu,
  X as XIcon,
  Compass,
  HelpCircle,
  LayoutGrid,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductSwitcher } from "./product-switcher";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { HelpButton } from "./help-button";
import { DarkModeToggle } from "@/components/dashboard/dark-mode-toggle";
import { MobileSidebarOverlay } from "@/components/dashboard/mobile-sidebar";

const FINANCE_HUB_COLOR = "#06B6D4";

const MOBILE_APPS = [
  { label: "Core",        sub: "Business Mgmt",    href: "/dashboard/owner",       color: "#3B82F6" },
  { label: "Grow",        sub: "Marketing & Ads",  href: "/dashboard/grow",        color: "#7C3AED" },
  { label: "Leads",       sub: "Lead Marketplace", href: "/dashboard/leads",       color: "#F59E0B" },
  { label: "Answer",      sub: "AI Phone Agent",   href: "/dashboard/answer",      color: "#14B8A6" },
  { label: "Pay",         sub: "Payments",         href: "/dashboard/pay",         color: "#10B981" },
  { label: "Fleet",       sub: "Vehicles & Assets",href: "/dashboard/fleet",       color: "#F97316" },
  { label: "Finance Hub", sub: "Accounting & BAS", href: "/dashboard/finance-hub", color: "#06B6D4" },
  { label: "Hire",        sub: "Recruitment & HR", href: "/dashboard/hire",        color: "#EA580C" },
];

type NavItem = { href: string; label: string; Icon: LucideIcon };

const FINANCE_HUB_NAV: NavItem[] = [
  { href: "/dashboard/finance-hub", label: "Dashboard", Icon: LayoutDashboard },
  {
    href: "/dashboard/finance-hub/apply",
    label: "Apply",
    Icon: ClipboardSignature,
  },
  { href: "/dashboard/finance-hub/loans", label: "My Loans", Icon: Wallet },
  {
    href: "/dashboard/finance-hub/repayments",
    label: "Repayments",
    Icon: RefreshCcw,
  },
  {
    href: "/dashboard/finance-hub/calculator",
    label: "Calculator",
    Icon: Calculator,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard/finance-hub")
    return pathname === "/dashboard/finance-hub";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function FinanceHubShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const handleSignOut = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }, [router]);

  return (
    <div
      data-product="finance-hub"
      className="dark dashboard-theme min-h-screen"
      style={{
        background: "var(--product-main)",
        "--sidebar-active-bg": FINANCE_HUB_COLOR,
        "--sidebar-ring": FINANCE_HUB_COLOR,
      } as React.CSSProperties}
    >
      {/* Sidebar */}
      <MobileSidebarOverlay open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <aside
        className={`owner-sidebar fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col overflow-y-auto px-4 py-6 shadow-[inset_-1px_0_0_var(--sidebar-divider)] transition-transform duration-300 ease-in-out md:w-[256px] ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ background: "var(--product-sidebar)", color: "var(--sidebar-text)" }}
      >
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md opacity-70 hover:opacity-100 md:hidden"
          style={{ color: "var(--sidebar-text)" }}
          aria-label="Close menu"
        >
          <XIcon size={18} />
        </button>

        {/* Brand */}
        <div className="mb-4 flex flex-col items-center">
          <Image
            src="/finance.png"
            alt="SERVLO FINANCE"
            width={120}
            height={120}
            style={{ height: "auto", maxWidth: "120px" }}
          />
          <div
            className="mt-3 h-[2px] w-full"
            style={{ background: "var(--product-accent)" }}
            aria-hidden
          />
        </div>

        {/* Product switcher */}
        <div className="mb-4">
          <ProductSwitcher activeProduct="finance-hub" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0">
          <div className="flex flex-col gap-2">
            {FINANCE_HUB_NAV.map((item) => {
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
            className="rounded-lg px-3 py-2.5"
            style={{
              background: "rgb(16 185 129 / 0.12)",
              border: "1px solid rgb(16 185 129 / 0.3)",
            }}
          >
            <p className="text-xs font-semibold" style={{ color: "#6EE7B7" }}>
              Coming soon
            </p>
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--sidebar-text-muted)" }}
            >
              Banking & BAS for service businesses
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div
        className="flex min-h-screen flex-col md:pl-[256px]"
        style={{ background: "var(--product-main)" }}
      >
        <header
          className="flex h-12 items-center justify-between border-b px-3 md:h-14 md:px-6"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 md:hidden"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              SERVLO Finance Hub
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  background: "rgb(16 185 129 / 0.2)",
                  color: "#6EE7B7",
                  border: "1px solid rgb(16 185 129 / 0.35)",
                }}
              >
                Coming soon
              </span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
              {/* Tour trigger */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("servlo:start-tour"))}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Start tour"
              >
                <Compass size={18} />
              </button>
              {/* Help */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("servlo:open-help"))}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Help"
              >
                <HelpCircle size={18} />
              </button>
              <DarkModeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden md:block rounded-md px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--product-accent)" }}
            >
              Sign Out
            </button>
          </div>
        </header>
        <main className="p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--sidebar-divider)] bg-[var(--sidebar-bg)] md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        <div className="grid grid-cols-5 px-2">
          {FINANCE_HUB_NAV.slice(0, 4).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                data-active={active ? "true" : "false"}
                onClick={() => setAppsOpen(false)}
                className="flex min-h-[52px] flex-1 min-w-0 flex-col items-center justify-center px-1 py-2 text-[10px] text-[var(--sidebar-text)]"
              >
                <item.Icon size={20} className="shrink-0 text-[var(--sidebar-text)]" />
                <span className="mt-0.5 w-full truncate text-center leading-tight">{item.label}</span>
              </a>
            );
          })}
          <button
            type="button"
            onClick={() => setAppsOpen((v) => !v)}
            className={`flex min-h-[52px] flex-1 min-w-0 flex-col items-center justify-center px-1 py-2 text-[10px] text-[var(--sidebar-text)] ${appsOpen ? "bg-white/10" : ""}`}
          >
            <LayoutGrid size={20} className="shrink-0" />
            <span className="mt-0.5 leading-tight truncate">Apps</span>
          </button>
        </div>
      </nav>
      {/* Mobile apps sheet */}
      {appsOpen ? (
        <>
          <button type="button" aria-label="Close apps" className="fixed inset-0 z-[38] bg-black/40 md:hidden" onClick={() => setAppsOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl md:hidden"
            style={{ background: "var(--product-sidebar)", border: "1px solid var(--sidebar-divider)", height: "60vh", paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Switch App</p>
              <button type="button" onClick={() => setAppsOpen(false)} className="rounded-md p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Close">
                <XIcon size={16} />
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-4" style={{ height: "calc(60vh - 80px)" }}>
              <div className="grid grid-cols-3 gap-3">
                {MOBILE_APPS.map((app) => (
                  <a key={app.href} href={app.href} onClick={() => setAppsOpen(false)}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-white/10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white" style={{ background: app.color }}>
                      {app.label[0]}
                    </div>
                    <span className="text-center text-xs font-medium leading-tight text-[var(--text-primary)]">{app.label}</span>
                    <span className="line-clamp-2 text-center text-[10px] leading-tight text-[var(--text-muted)]">{app.sub}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
      <HelpButton />
    </div>
  );
}
