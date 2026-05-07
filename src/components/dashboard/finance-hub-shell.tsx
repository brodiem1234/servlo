"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import React, { useCallback } from "react";
import {
  LayoutDashboard,
  ClipboardSignature,
  Wallet,
  RefreshCcw,
  Calculator,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductSwitcher } from "./product-switcher";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { HelpButton } from "./help-button";

const FINANCE_HUB_COLOR = "#6366F1";
const FINANCE_HUB_LOGO_FILTER =
  "brightness(0) saturate(100%) invert(1) sepia(1) saturate(3) hue-rotate(220deg)";

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
            style={{
              height: "auto",
              maxWidth: "120px",
              filter: FINANCE_HUB_LOGO_FILTER,
            }}
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
              background: "rgb(99 102 241 / 0.12)",
              border: "1px solid rgb(99 102 241 / 0.3)",
            }}
          >
            <p className="text-xs font-semibold" style={{ color: "#A5B4FC" }}>
              Coming soon
            </p>
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--sidebar-text-muted)" }}
            >
              SERVLO Finance launches Q3 2027
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
          className="flex items-center justify-between border-b px-4 py-3 md:px-6"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            SERVLO Finance Hub
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: "rgb(99 102 241 / 0.2)",
                color: "#A5B4FC",
                border: "1px solid rgb(99 102 241 / 0.35)",
              }}
            >
              Coming soon
            </span>
          </p>
          <div className="flex items-center gap-2">
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
