"use client";

import { usePathname } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import {
  Bell,
  Briefcase,
  FileText,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import OwnerKeyboardShortcuts from "@/components/dashboard/owner-keyboard-shortcuts";
import OwnerSidebarTodos, { type OwnerTaskRow } from "@/components/dashboard/owner-sidebar-todos";
import type { OwnerNavItem } from "@/app/dashboard/owner/nav-config";
import { ToastProvider } from "@/components/ui/toast";
import { ProductSwitcher } from "@/components/dashboard/product-switcher";

/** Dashboard is only active on the exact path; other items match their section. */
function isNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard/owner") {
    return pathname === "/dashboard/owner";
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
  navSections: OwnerNavItem[][];
  shortcutTargets?: ShortcutTargets;
  children: React.ReactNode;
};

export default function OwnerShell({
  businessName,
  signOutAction,
  alerts,
  initialTasks,
  navSections,
  shortcutTargets,
  children
}: Props) {
  const pathname = usePathname();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const flatNav = useMemo(() => navSections.flat(), [navSections]);

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

  return (
    <ToastProvider>
    <div className="dashboard-theme min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <aside className="owner-sidebar fixed left-0 top-0 z-40 hidden h-screen w-[256px] flex-col overflow-y-auto bg-[var(--sidebar-bg)] px-4 py-6 text-[var(--sidebar-text)] shadow-[inset_-1px_0_0_var(--sidebar-divider)] md:flex">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent-color)] p-0.5 shadow-inner ring-2 ring-[color-mix(in_srgb,var(--accent-color)_55%,white)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--accent-color)]" aria-hidden>
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
              <p className="text-xl font-bold tracking-wide text-[var(--sidebar-text)]">SERVLO</p>
            </div>
            <div className="mt-2 h-[2px] w-full bg-[var(--sidebar-ring)]" aria-hidden />
          </div>
          <div className="mb-4">
            <ProductSwitcher activeProduct="core" />
          </div>
          <nav className="flex flex-col gap-0">
            {navSections.map((section, sectionIndex) => (
              <Fragment key={`nav-section-${sectionIndex}`}>
                {sectionIndex > 0 ? (
                  <hr className="my-3 border-0 border-t border-[var(--sidebar-divider)]" aria-hidden />
                ) : null}
                <div className="flex flex-col gap-2">
                  {section.map((item) => {
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
                  })}
                </div>
              </Fragment>
            ))}
          </nav>
          <OwnerSidebarTodos initialTasks={initialTasks} />
        </aside>

        <div className="flex min-h-screen flex-col md:pl-[256px]">
          <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-[var(--text-primary)] md:text-base">{businessName}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggleButton />
              <div className="relative">
                <button
                  type="button"
                  className={`relative rounded border border-[var(--border)] p-2 text-[var(--text-primary)] transition-shadow ${alerts.length > 0 ? "ring-2 ring-[var(--accent-color)] ring-offset-2 ring-offset-[var(--bg-secondary)]" : ""}`}
                  onClick={() => setAlertsOpen((prev) => !prev)}
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                  {alerts.length > 0 ? (
                    <span className="absolute -right-1 -top-1 rounded-full bg-[#ef4444] px-1.5 text-[10px] text-white">
                      {alerts.length}
                    </span>
                  ) : null}
                </button>
                {alertsOpen ? (
                  <div className="absolute right-0 z-40 mt-2 w-80 rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-lg">
                    <p className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)]">Notifications</p>
                    <div className="max-h-72 overflow-auto">
                      {alerts.length === 0 ? (
                        <p className="px-2 py-2 text-sm text-[var(--text-muted)]">No new alerts.</p>
                      ) : (
                        alerts.map((alert) => (
                          <p
                            key={alert.id}
                            className="rounded px-2 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                          >
                            {alert.text}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <form action={signOutAction}>
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
    </div>
    </ToastProvider>
  );
}
