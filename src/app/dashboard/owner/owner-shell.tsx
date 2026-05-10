"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Briefcase,
  FileText,
  Home,
  LayoutGrid,
  Menu,
  MoreHorizontal,
  Users,
  X as XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import OwnerKeyboardShortcuts from "@/components/dashboard/owner-keyboard-shortcuts";
import OwnerSidebarTodos, { type OwnerTaskRow } from "@/components/dashboard/owner-sidebar-todos";
import type { OwnerNavItem, OwnerNavSection } from "@/app/dashboard/owner/nav-config";
import { ToastProvider } from "@/components/ui/toast";
import { ProductSwitcher } from "@/components/dashboard/product-switcher";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { HelpButton } from "@/components/dashboard/help-button";
import { BackToTop } from "@/components/dashboard/back-to-top";
import { InstallBanner } from "@/components/pwa/install-banner";
import { QuickActionFab } from "@/components/dashboard/quick-action-fab";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { DarkModeToggle } from "@/components/dashboard/dark-mode-toggle";
import { MobileSidebarOverlay } from "@/components/dashboard/mobile-sidebar";
import { OnboardingTour } from "@/components/dashboard/onboarding-tour";
import { OnlineMembersIndicator } from "@/components/dashboard/online-members-indicator";

const CORE_COLOR = "#3B82F6";

/** Dashboard is only active on the exact path; other items match their section. */
function isNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard/owner") {
    return pathname === "/dashboard/owner";
  }
  // Finance aggregate item — also match legacy direct routes
  if (href === "/dashboard/owner/finance") {
    return (
      pathname.startsWith("/dashboard/owner/finance") ||
      pathname.startsWith("/dashboard/owner/invoices") ||
      pathname.startsWith("/dashboard/owner/quotes") ||
      pathname.startsWith("/dashboard/owner/purchase-orders")
    );
  }
  // Team aggregate item — also match legacy direct routes
  if (href === "/dashboard/owner/team") {
    return (
      pathname.startsWith("/dashboard/owner/team") ||
      pathname.startsWith("/dashboard/owner/employees") ||
      pathname.startsWith("/dashboard/owner/timesheets") ||
      pathname.startsWith("/dashboard/contractors")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function iconForMobileNav(href: string): LucideIcon {
  if (href === "/dashboard/owner") return Home;
  if (href.includes("/jobs")) return Briefcase;
  if (href.includes("/clients")) return Users;
  if (href.includes("/invoices")) return FileText;
  if (href.includes("/quotes")) return FileText;
  return LayoutGrid;
}

type ShortcutTargets = {
  jobs?: boolean;
  clients?: boolean;
  invoices?: boolean;
  quotes?: boolean;
};

type Props = {
  businessName: string;
  signOutAction: (formData: FormData) => Promise<void>;
  alerts: Array<{ id: string; text: string }>;
  initialTasks: OwnerTaskRow[];
  navSections: OwnerNavSection[];
  shortcutTargets?: ShortcutTargets;
  /** Onboarding tour: whether the welcome modal has been dismissed (from DB). */
  initialOnboardingDismissed?: boolean;
  /** Onboarding tour: whether the guided tour has been completed (from DB). */
  initialTourCompleted?: boolean;
  /** Presence: business UUID for realtime channel. */
  businessId?: string | null;
  /** Presence: the current user's auth UUID. */
  currentUserId?: string;
  /** Presence: the current user's display name. */
  currentUserName?: string;
  /** Presence: the current user's plan slug. */
  plan?: string;
  children: React.ReactNode;
};

export default function OwnerShell({
  businessName: _businessName,
  signOutAction,
  alerts: _alerts,
  initialTasks,
  navSections,
  shortcutTargets,
  initialOnboardingDismissed = false,
  initialTourCompleted = false,
  businessId,
  currentUserId,
  currentUserName,
  plan = "free",
  children
}: Props) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mainSections = useMemo(() => navSections.filter((s) => !s.pinnedBottom), [navSections]);
  const bottomSections = useMemo(() => navSections.filter((s) => s.pinnedBottom), [navSections]);
  const flatNav = useMemo(() => navSections.flatMap((s) => s.items), [navSections]);

  const mobileTabs = useMemo(() => {
    const preferred = [
      "/dashboard/owner",
      "/dashboard/owner/jobs",
      "/dashboard/owner/clients",
      "/dashboard/owner/invoices",
      "/dashboard/owner/quotes",
      "/dashboard/schedule"
    ];
    const picked: OwnerNavItem[] = [];
    for (const href of preferred) {
      const hit = flatNav.find((i) => i.href === href);
      if (hit && !picked.some((p) => p.href === hit.href)) picked.push(hit);
      if (picked.length >= 4) break;
    }
    if (picked.length < 4) {
      for (const item of flatNav) {
        if (picked.some((p) => p.href === item.href)) continue;
        if (item.href === "/dashboard/owner/settings") continue;
        picked.push(item);
        if (picked.length >= 4) break;
      }
    }
    return picked.slice(0, 4);
  }, [flatNav]);

  const mobileMoreLinks = useMemo(
    () => flatNav.filter((l) => !mobileTabs.some((t) => t.href === l.href)),
    [flatNav, mobileTabs]
  );

  function renderNavItem(item: OwnerNavItem) {
    const active = isNavItemActive(pathname, item.href);
    return (
      <a
        key={item.href}
        href={item.href}
        data-active={active ? "true" : "false"}
        className="rounded-md px-3 py-2 text-sm text-[var(--sidebar-text)] transition-colors"
      >
        {item.label}
      </a>
    );
  }

  function renderSection(section: OwnerNavSection, index: number) {
    return (
      <div key={`section-${index}`} className="flex flex-col gap-1">
        {section.items.map((item) => renderNavItem(item))}
      </div>
    );
  }

  return (
    <ToastProvider>
    <div
        data-product="core"
        className="dark dashboard-theme min-h-screen bg-[var(--product-main)] text-[var(--text-primary)]"
        style={{ "--sidebar-active-bg": CORE_COLOR, "--sidebar-ring": CORE_COLOR } as React.CSSProperties}
      >
        <aside
          className={`owner-sidebar fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col px-4 py-6 text-[var(--sidebar-text)] shadow-[inset_-1px_0_0_var(--sidebar-divider)] transition-transform duration-300 ease-in-out md:w-[256px] ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
          style={{ background: "var(--product-sidebar)" }}
        >
          {/* Close button — mobile only */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-[var(--sidebar-text)] opacity-70 hover:opacity-100 md:hidden"
            aria-label="Close menu"
          >
            <XIcon size={18} />
          </button>
          <div className="mb-6 flex flex-col items-center">
            <Image
              src="/core.png"
              alt="SERVLO CORE"
              width={120}
              height={120}
              style={{ height: "auto", maxWidth: "120px" }}
            />
            <div className="mt-3 h-[2px] w-full bg-[var(--product-accent)]" aria-hidden />
          </div>
          <div className="mb-4">
            <ProductSwitcher activeProduct="core" />
          </div>

          {/* Scrollable nav area */}
          <div className="flex-1 overflow-y-auto">
            <nav className="flex flex-col gap-2">
              {mainSections.map((section, i) => renderSection(section, i))}
            </nav>
            <div className="hidden md:block">
              <OwnerSidebarTodos initialTasks={initialTasks} />
            </div>
          </div>

          {/* Pinned bottom — Settings + mobile sign-out */}
          <div className="mt-2 border-t border-[var(--sidebar-divider)] pt-2">
            {bottomSections.length > 0
              ? bottomSections.map((section, i) => (
                  <div key={`bottom-${i}`} className="flex flex-col gap-1">
                    {section.items.map((item) => renderNavItem(item))}
                  </div>
                ))
              : null}
            {/* Sign out — only shown in mobile sidebar */}
            <form action={signOutAction} className="mt-1 md:hidden">
              <button
                type="submit"
                className="w-full rounded-md px-3 py-2 text-left text-sm text-[var(--sidebar-text)] transition-colors hover:bg-white/10"
              >
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        <MobileSidebarOverlay open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-h-screen flex-col md:pl-[256px]" style={{ background: "var(--product-main)" }}>
          <header className="flex h-12 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] px-3 md:h-14 md:px-6">
            <div className="flex items-center gap-2 md:gap-3">
              {/* Hamburger — mobile only */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-white/10 md:hidden"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <p className="text-sm font-semibold text-[var(--text-primary)]">SERVLO CORE</p>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <DarkModeToggle />
              {businessId && currentUserId && currentUserName && (
                <OnlineMembersIndicator
                  businessId={businessId}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  plan={plan}
                />
              )}
              <NotificationBell />
              <form action={signOutAction} className="hidden md:block">
                <button type="submit" className="dashboard-primary rounded-md px-4 py-2 text-sm font-semibold text-white">
                  Sign Out
                </button>
              </form>
            </div>
          </header>

          <main className="p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        </div>

      <nav className="owner-mobile-nav fixed inset-x-0 bottom-0 z-30 border-t border-[var(--sidebar-divider)] bg-[var(--sidebar-bg)] md:hidden">
        <div className="grid grid-cols-5">
          {mobileTabs.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = iconForMobileNav(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                data-active={active ? "true" : "false"}
                onClick={() => {
                  setMoreOpen(false);
                }}
                className="flex min-h-[52px] flex-col items-center justify-center px-1 py-2 text-[11px] text-[var(--sidebar-text)]"
              >
                <Icon size={16} className="text-[var(--sidebar-text)]" />
                <span className="mt-0.5 leading-tight">{item.label}</span>
              </a>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex min-h-[52px] flex-col items-center justify-center px-1 py-2 text-[11px] text-[var(--sidebar-text)] ${moreOpen ? "bg-white/10" : ""}`}
          >
            <MoreHorizontal size={16} />
            <span className="mt-0.5 leading-tight">More</span>
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[38] bg-black/40 md:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-[52px] z-40 max-h-[55vh] overflow-auto rounded-t-xl border border-[var(--sidebar-divider)] bg-[var(--sidebar-bg)] p-3 text-[var(--sidebar-text)] md:hidden">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide opacity-70">More</p>
            <div className="grid gap-1">
              {mobileMoreLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm hover:bg-white/10"
                  onClick={() => setMoreOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <OwnerKeyboardShortcuts targets={shortcutTargets} />
      <CommandPalette />
      <HelpButton />
      <BackToTop />
      <QuickActionFab />
      <InstallBanner />
      {/* Onboarding tour — rendered inside the stable client component so it
          persists across page navigations without losing tour progress. */}
      <OnboardingTour
        initialDismissed={initialOnboardingDismissed}
        initialTourCompleted={initialTourCompleted}
      />
    </div>
    </ToastProvider>
  );
}
