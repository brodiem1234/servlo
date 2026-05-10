"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Briefcase,
  Compass,
  FileText,
  HelpCircle,
  Home,
  LayoutGrid,
  Menu,
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

const MOBILE_APPS = [
  { label: "Core", sub: "Business Mgmt", href: "/dashboard/owner", color: "#3B82F6" },
  { label: "Grow", sub: "Marketing & Ads", href: "/dashboard/grow", color: "#7C3AED" },
  { label: "Leads", sub: "Lead Marketplace", href: "/dashboard/leads", color: "#F59E0B" },
  { label: "Answer", sub: "AI Phone Agent", href: "/dashboard/answer", color: "#14B8A6" },
  { label: "Pay", sub: "Payments", href: "/dashboard/pay", color: "#10B981" },
  { label: "Fleet", sub: "Vehicles & Assets", href: "/dashboard/fleet", color: "#F97316" },
  { label: "Finance Hub", sub: "Accounting & BAS", href: "/dashboard/finance-hub", color: "#06B6D4" },
  { label: "Hire", sub: "Recruitment & HR", href: "/dashboard/hire", color: "#EA580C" },
];

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
  const [appsOpen, setAppsOpen] = useState(false);
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
              {/* Tour trigger — mobile only */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("servlo:start-tour"))}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-white/10 md:hidden"
                aria-label="Start tour"
              >
                <Compass size={18} />
              </button>
              {/* Help — mobile only */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("servlo:open-help"))}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-white/10 md:hidden"
                aria-label="Help"
              >
                <HelpCircle size={18} />
              </button>
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

      <nav
        className="owner-mobile-nav fixed inset-x-0 bottom-0 z-30 border-t border-[var(--sidebar-divider)] bg-[var(--sidebar-bg)] md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      >
        <div className="grid grid-cols-5 px-2">
          {mobileTabs.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = iconForMobileNav(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                data-active={active ? "true" : "false"}
                onClick={() => { setAppsOpen(false); }}
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
            className={`flex min-h-[52px] flex-1 min-w-0 flex-col items-center justify-center px-1 py-2 text-[10px] text-[var(--sidebar-text)] ${appsOpen ? "bg-white/10" : ""}`}
          >
            <LayoutGrid size={20} className="shrink-0" />
            <span className="mt-0.5 leading-tight truncate">Apps</span>
          </button>
        </div>
      </nav>

      {appsOpen ? (
        <>
          <button
            type="button"
            aria-label="Close apps"
            className="fixed inset-0 z-[38] bg-black/40 md:hidden"
            onClick={() => setAppsOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl md:hidden"
            style={{
              background: "var(--product-sidebar)",
              border: "1px solid var(--sidebar-divider)",
              height: "60vh",
              paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Switch App</p>
              <button
                type="button"
                onClick={() => setAppsOpen(false)}
                className="rounded-md p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                <XIcon size={16} />
              </button>
            </div>
            {/* Product grid */}
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
