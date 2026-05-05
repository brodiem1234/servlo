"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Briefcase, FileText, Home, Menu, Users, Wrench } from "lucide-react";

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
  children: React.ReactNode;
};

export default function OwnerShell({ businessName, signOutAction, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen md:grid-cols-[260px_1fr]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[#1e3a5f] px-4 py-6 text-white transition-transform md:static md:w-auto md:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Wrench size={18} />
              <p className="text-xl font-bold tracking-wide">SERVLO</p>
            </div>
            <div className="mt-2 h-[2px] w-full bg-[#3b82f6]" />
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
                    active ? "bg-[#3b82f6] text-white" : "hover:bg-[#2d5b8d]"
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
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#274d7c]"
              >
                Sign Out
              </button>
            </form>
          </header>

          <main className="p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        </div>
      </div>

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
                  active ? "text-[#3b82f6]" : "text-slate-500"
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


