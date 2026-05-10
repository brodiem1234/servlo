"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import React, { useCallback, useState } from "react";
import {
  LayoutDashboard,
  FilePlus,
  Search,
  List,
  Bookmark,
  Menu,
  X as XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductSwitcher } from "./product-switcher";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { HelpButton } from "./help-button";
import { MobileSidebarOverlay } from "@/components/dashboard/mobile-sidebar";

const HIRE_COLOR = "#7C3AED";

type NavItem = { href: string; label: string; Icon: LucideIcon };

const HIRE_NAV: NavItem[] = [
  { href: "/dashboard/hire", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/hire/post", label: "Post a Job", Icon: FilePlus },
  {
    href: "/dashboard/hire/browse",
    label: "Browse Tradies",
    Icon: Search,
  },
  { href: "/dashboard/hire/listings", label: "My Listings", Icon: List },
  {
    href: "/dashboard/hire/saved",
    label: "Saved Tradies",
    Icon: Bookmark,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard/hire") return pathname === "/dashboard/hire";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HireShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleSignOut = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }, [router]);

  return (
    <div
      data-product="hire"
      className="dark dashboard-theme min-h-screen"
      style={{
        background: "var(--product-main)",
        "--sidebar-active-bg": HIRE_COLOR,
        "--sidebar-ring": HIRE_COLOR,
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
            src="/hire.png"
            alt="SERVLO HIRE"
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
          <ProductSwitcher activeProduct="hire" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0">
          <div className="flex flex-col gap-2">
            {HIRE_NAV.map((item) => {
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
              background: "rgb(124 58 237 / 0.12)",
              border: "1px solid rgb(124 58 237 / 0.3)",
            }}
          >
            <p className="text-xs font-semibold" style={{ color: "#C4B5FD" }}>
              Coming soon
            </p>
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--sidebar-text-muted)" }}
            >
              ATS & hiring for service businesses
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
              SERVLO Hire
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  background: "rgb(124 58 237 / 0.2)",
                  color: "#FDBA74",
                  border: "1px solid rgb(249 115 22 / 0.35)",
                }}
              >
                Coming soon
              </span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden rounded-md px-4 py-2 text-sm font-semibold text-white md:block"
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
