"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard/employee",          label: "Home",     icon: "🏠" },
  { href: "/dashboard/employee/jobs",     label: "Jobs",     icon: "📋" },
  { href: "/dashboard/employee/timesheets", label: "Hours",  icon: "⏱️" },
  { href: "/dashboard/employee/expenses", label: "Expenses", icon: "🧾" },
];

export function EmployeeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--bg-secondary)" }}>
      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        aria-label="Employee navigation"
      >
        {NAV.map((item) => {
          const active = item.href === "/dashboard/employee"
            ? pathname === "/dashboard/employee"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-3 px-4 text-xs font-medium transition-colors"
              style={{ color: active ? "var(--accent-color)" : "var(--text-muted)" }}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
