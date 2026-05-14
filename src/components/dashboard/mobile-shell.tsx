"use client";

/**
 * MobileShell — full-screen mobile product shell.
 *
 * Renders ONLY on mobile (< md breakpoint). Each product layout can use this
 * alongside its existing desktop shell:
 *
 *   <div className="hidden md:block">
 *     <ProductShell>{children}</ProductShell>
 *   </div>
 *   <div className="md:hidden">
 *     <MobileShell productName="SERVLO GROW" accentColor="#7C3AED"
 *       navItems={[...]} logoSrc="/grow.png">
 *       {children}
 *     </MobileShell>
 *   </div>
 *
 * navItems uses string iconName so it's serializable from Server Components.
 * Pass up to 5 items; the first 4 appear in the bottom tab bar and all appear
 * in the sidebar drawer. The 5th bottom tab is always "Apps" (product switcher).
 */

import { useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import * as LucideIcons from "lucide-react";
import {
  Menu,
  X,
  Compass,
  HelpCircle,
  LayoutGrid,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MobileSidebarOverlay } from "@/components/dashboard/mobile-sidebar";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

// ── App switcher data ─────────────────────────────────────────────────────────

const MOBILE_APPS = [
  { label: "Core", sub: "Business Management", href: "/dashboard/owner", color: "#3B82F6" },
  { label: "Grow", sub: "Marketing & Ads",     href: "/dashboard/grow",  color: "#7C3AED" },
];

// ── Nav item types ────────────────────────────────────────────────────────────

/**
 * Use `iconName` (a string matching a Lucide export) so the navItems array is
 * serializable from Server Components. Example: iconName: "LayoutDashboard"
 */
export type MobileNavItem = {
  href: string;
  label: string;
  /** Name of a Lucide icon export, e.g. "LayoutDashboard" or "PhoneCall" */
  iconName: string;
};

function resolveIcon(name: string): LucideIcon {
  return ((LucideIcons as unknown) as Record<string, LucideIcon>)[name] ?? LayoutGrid;
}

function isNavActive(pathname: string, href: string): boolean {
  const base = href.split("?")[0];
  const parts = base.split("/").filter(Boolean);
  if (parts.length <= 2) return pathname === base; // root dashboard URL
  return pathname === base || pathname.startsWith(`${base}/`);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface MobileShellProps {
  productName: string;
  /** Optional badge label, e.g. "Beta" or "Coming soon" */
  productLabel?: string;
  accentColor: string;
  navItems: MobileNavItem[];
  /** Path to the product logo, e.g. "/grow.png" */
  logoSrc: string;
  children: React.ReactNode;
}

export default function MobileShell({
  productName,
  productLabel,
  accentColor,
  navItems,
  logoSrc,
  children,
}: MobileShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }, [router]);

  const bottomTabs = navItems.slice(0, 4);

  return (
    <div
      className="dashboard-theme min-h-screen"
      style={{
        background: "var(--product-main)",
        "--sidebar-active-bg": accentColor,
        "--sidebar-ring": accentColor,
      } as React.CSSProperties}
    >
      {/* Sidebar overlay */}
      <MobileSidebarOverlay open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Sidebar drawer */}
      <aside
        className={`owner-sidebar fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col overflow-y-auto px-4 py-6 shadow-[inset_-1px_0_0_var(--sidebar-divider)] transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--product-sidebar)", color: "var(--sidebar-text)" }}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md opacity-70 hover:opacity-100"
          style={{ color: "var(--sidebar-text)" }}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="mb-4 flex flex-col items-center">
          <Image
            src={logoSrc}
            alt={productName}
            width={120}
            height={120}
            style={{ height: "auto", maxWidth: "120px" }}
          />
          <div className="mt-3 h-[2px] w-full" style={{ background: accentColor }} aria-hidden />
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = resolveIcon(item.iconName);
            const active = isNavActive(pathname, item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                data-active={active ? "true" : "false"}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 rounded-md border-l-4 border-transparent px-3 py-2 text-sm transition-colors"
              >
                <Icon size={15} aria-hidden />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="mt-4 border-t border-[var(--sidebar-divider)] pt-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
            style={{ color: "var(--sidebar-text)" }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-col" style={{ background: "var(--product-main)" }}>
        {/* Top bar */}
        <header
          className="flex h-12 items-center justify-between border-b px-3"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {productName}
              {productLabel && (
                <span
                  className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    background: `${accentColor}33`,
                    color: accentColor,
                    border: `1px solid ${accentColor}55`,
                  }}
                >
                  {productLabel}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("servlo:start-tour"))}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Start tour"
            >
              <Compass size={18} />
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("servlo:open-help"))}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Help"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 pb-20">{children}</main>
      </div>

      {/* Bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--sidebar-divider)] bg-[var(--sidebar-bg)]"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        <div className="grid grid-cols-5 px-2">
          {bottomTabs.map((item) => {
            const Icon = resolveIcon(item.iconName);
            const active = isNavActive(pathname, item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                data-active={active ? "true" : "false"}
                onClick={() => setAppsOpen(false)}
                className="flex min-h-[52px] flex-1 min-w-0 flex-col items-center justify-center px-1 py-2 text-[10px] text-[var(--sidebar-text)]"
              >
                <Icon size={20} className="shrink-0 text-[var(--sidebar-text)]" />
                <span className="mt-0.5 w-full truncate text-center leading-tight">{item.label}</span>
              </a>
            );
          })}
          <button
            type="button"
            onClick={() => setAppsOpen((v) => !v)}
            className={`flex min-h-[52px] flex-1 min-w-0 flex-col items-center justify-center px-1 py-2 text-[10px] text-[var(--sidebar-text)] ${
              appsOpen ? "bg-white/10" : ""
            }`}
          >
            <LayoutGrid size={20} className="shrink-0" />
            <span className="mt-0.5 leading-tight truncate">Apps</span>
          </button>
        </div>
      </nav>

      {/* Apps sheet */}
      {appsOpen ? (
        <>
          <button
            type="button"
            aria-label="Close apps"
            className="fixed inset-0 z-[38] bg-black/40"
            onClick={() => setAppsOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl"
            style={{
              background: "var(--product-sidebar)",
              border: "1px solid var(--sidebar-divider)",
              height: "60vh",
              paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
            }}
          >
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Switch App</p>
              <button
                type="button"
                onClick={() => setAppsOpen(false)}
                className="rounded-md p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-4" style={{ height: "calc(60vh - 80px)" }}>
              <div className="grid grid-cols-3 gap-3">
                {MOBILE_APPS.map((app) => (
                  <a
                    key={app.href}
                    href={app.href}
                    onClick={() => setAppsOpen(false)}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-white/10"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
                      style={{ background: app.color }}
                    >
                      {app.label[0]}
                    </div>
                    <span className="text-center text-xs font-medium leading-tight text-[var(--text-primary)]">
                      {app.label}
                    </span>
                    <span className="line-clamp-2 text-center text-[10px] leading-tight text-[var(--text-muted)]">
                      {app.sub}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
