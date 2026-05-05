"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Briefcase, FileText, Home, Menu, Moon, Sun, Users } from "lucide-react";

const ownerNav = [
  { href: "/dashboard/owner", label: "Dashboard" },
  { href: "/dashboard/owner/jobs", label: "Jobs" },
  { href: "/dashboard/owner/clients", label: "Clients" },
  { href: "/dashboard/owner/invoices", label: "Invoices" },
  { href: "/dashboard/owner/quotes", label: "Quotes" },
  { href: "/dashboard/owner/employees", label: "Employees" },
  { href: "/dashboard/owner/settings", label: "Settings" }
];

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
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("servlo-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <div className="dashboard-theme min-h-screen bg-[#f8fafc] text-[#1e3a5f]">
      <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto transform bg-[#0d1a26] px-4 py-6 text-white transition-transform md:static md:w-auto md:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="SERVLO" width={36} height={36} />
              <p className="text-xl font-bold tracking-wide">SERVLO</p>
            </div>
            <div className="mt-2 h-[2px] w-full bg-[#0db8c8]" />
          </div>
          <nav className="grid gap-2">
            {ownerNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    active ? "bg-[#0db8c8] text-white" : "hover:bg-[#16324b]"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b bg-white px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded border p-2 md:hidden"
                onClick={() => setOpen((prev) => !prev)}
              >
                <Menu size={18} />
              </button>
              <p className="text-sm font-semibold text-[#1e3a5f] md:text-base">{businessName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border p-2"
                onClick={toggleTheme}
                aria-label="Toggle dark and light mode"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="relative">
                <button
                  type="button"
                  className="relative rounded border p-2"
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
                  <div className="absolute right-0 z-40 mt-2 w-80 rounded-md border bg-white p-2 shadow-lg">
                    <p className="px-2 py-1 text-xs font-semibold text-[#64748b]">Notifications</p>
                    <div className="max-h-72 overflow-auto">
                      {alerts.length === 0 ? (
                        <p className="px-2 py-2 text-sm text-[#64748b]">No new alerts.</p>
                      ) : (
                        alerts.map((alert) => (
                          <p key={alert.id} className="rounded px-2 py-2 text-sm hover:bg-[#f1f5f9]">
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
                  className="dashboard-primary rounded-md bg-[#0db8c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a9dab]"
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

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white md:hidden">
        <div className="grid grid-cols-4">
          {[
            { href: "/dashboard/owner", label: "Dashboard", icon: Home },
            { href: "/dashboard/owner/jobs", label: "Jobs", icon: Briefcase },
            { href: "/dashboard/owner/clients", label: "Clients", icon: Users },
            { href: "/dashboard/owner/invoices", label: "Invoices", icon: FileText }
          ].map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 text-xs ${
                  active ? "text-[#0db8c8]" : "text-[#64748b]"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


