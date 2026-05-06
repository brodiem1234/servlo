"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { Bell, Briefcase, HardHat, Home, Menu, Moon, Sun, Users } from "lucide-react";

const ownerNavSections = [
  [{ href: "/dashboard/owner", label: "Dashboard" }],
  [
    { href: "/dashboard/owner/jobs", label: "Jobs" },
    { href: "/dashboard/owner/clients", label: "Clients" }
  ],
  [
    { href: "/dashboard/owner/invoices", label: "Invoices" },
    { href: "/dashboard/owner/quotes", label: "Quotes" }
  ],
  [
    { href: "/dashboard/owner/employees", label: "Employees" },
    { href: "/dashboard/contractors", label: "Contractors" }
  ],
  [{ href: "/dashboard/owner/settings", label: "Settings" }]
];

/** Dashboard is only active on the exact path; other items match their section. */
function isNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard/owner") {
    return pathname === "/dashboard/owner";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  businessName: string;
  signOutAction: (formData: FormData) => Promise<void>;
  alerts: Array<{ id: string; text: string }>;
  children: React.ReactNode;
};

export default function OwnerShell({ businessName, signOutAction, alerts, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("servlo-theme") as "dark" | "light" | null) ?? "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("servlo-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <div className="dashboard-theme min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
        <aside
          className={`owner-sidebar fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-[#1e3a5f] transform px-4 py-6 text-white transition-transform md:static md:w-auto md:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="SERVLO" width={36} height={36} />
              <p className="text-xl font-bold tracking-wide !text-white">SERVLO</p>
            </div>
            <div className="mt-2 h-[2px] w-full bg-[#0db8c8]" />
          </div>
          <nav className="flex flex-col gap-0">
            {ownerNavSections.map((section, sectionIndex) => (
              <Fragment key={`nav-section-${sectionIndex}`}>
                {sectionIndex > 0 ? (
                  <hr
                    className="my-3 border-0 border-t border-[#0db8c8]/40"
                    aria-hidden
                  />
                ) : null}
                <div className="flex flex-col gap-2">
                  {section.map((item) => {
                    const active = isNavItemActive(pathname, item.href);
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        data-active={active ? "true" : "false"}
                        onClick={() => setOpen(false)}
                        className="rounded-md px-3 py-2 text-sm text-white transition-colors"
                      >
                        {item.label}
                      </a>
                    );
                  })}
                </div>
              </Fragment>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded border border-[var(--border)] p-2 text-[var(--text-primary)] md:hidden"
                onClick={() => setOpen((prev) => !prev)}
              >
                <Menu size={18} />
              </button>
              <p className="text-sm font-semibold text-[var(--text-primary)] md:text-base">{businessName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-[var(--border)] p-2 text-[var(--text-primary)]"
                onClick={toggleTheme}
                aria-label="Toggle dark and light mode"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="relative">
                <button
                  type="button"
                  className="relative rounded border border-[var(--border)] p-2 text-[var(--text-primary)]"
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
                <button
                  type="submit"
                  className="dashboard-primary rounded-md bg-[#0db8c8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a9dab]"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </header>

          <main className="p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        </div>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <nav className="owner-mobile-nav fixed inset-x-0 bottom-0 z-30 border-t border-[#2a4a6b] bg-[#0d1a26] md:hidden">
        <div className="grid grid-cols-4">
          {[
            { href: "/dashboard/owner", label: "Dashboard", icon: Home },
            { href: "/dashboard/owner/jobs", label: "Jobs", icon: Briefcase },
            { href: "/dashboard/owner/clients", label: "Clients", icon: Users },
            { href: "/dashboard/contractors", label: "Contractors", icon: HardHat }
          ].map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                data-active={active ? "true" : "false"}
                className="flex min-h-[52px] flex-col items-center justify-center px-1 py-2 text-xs text-white"
              >
                <Icon size={16} className="text-white" />
                <span className="mt-0.5 leading-tight">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
