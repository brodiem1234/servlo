"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeTogglePublic } from "@/components/theme-toggle-public";

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  const navLinkClass =
    "rounded-md px-2 py-2 text-[#334155] hover:bg-slate-100 hover:text-[var(--accent-color)] dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-cyan-300 md:py-0 md:hover:bg-transparent";

  return (
    <header className="sticky top-0 z-50 border-b border-t-2 border-teal-400 border-slate-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#1e3a5f]/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={close}>
          <Image src="/servlo-master-dark.svg" alt="SERVLO" width={36} height={36} unoptimized className="dark:hidden" />
          <Image src="/servlo-master-white.svg" alt="SERVLO" width={36} height={36} unoptimized className="hidden dark:block" />
          <span className="text-lg font-bold tracking-wide text-[#1e3a5f] dark:text-white">SERVLO</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a href="#features" className="text-[#334155] hover:text-[var(--accent-color)] dark:text-slate-200 dark:hover:text-cyan-300">
            Features
          </a>
          <a href="#pricing" className="text-[#334155] hover:text-[var(--accent-color)] dark:text-slate-200 dark:hover:text-cyan-300">
            Pricing
          </a>
          <a href="#about" className="text-[#334155] hover:text-[var(--accent-color)] dark:text-slate-200 dark:hover:text-cyan-300">
            About
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeTogglePublic />
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/auth/login"
              className="rounded-md border border-[var(--accent-color)]/45 px-3 py-2 text-sm text-[#1e3a5f] hover:bg-slate-100 dark:border-cyan-300/40 dark:text-white dark:hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md bg-[var(--accent-color)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] dark:bg-cyan-400 dark:text-[#0f172a] dark:hover:bg-cyan-300"
            >
              Start Free Trial
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-[#1e3a5f] hover:bg-slate-100 md:hidden dark:border-white/15 dark:text-white dark:hover:bg-white/10"
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="landing-mobile-nav"
          className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden dark:border-white/10 dark:bg-[#1e3a5f]"
        >
          <nav className="flex flex-col gap-1 text-sm font-medium">
            <a href="#features" className={navLinkClass} onClick={close}>
              Features
            </a>
            <a href="#pricing" className={navLinkClass} onClick={close}>
              Pricing
            </a>
            <a href="#about" className={navLinkClass} onClick={close}>
              About
            </a>
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
            <Link
              href="/auth/login"
              className="rounded-md border border-[var(--accent-color)]/45 px-3 py-2.5 text-center text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50 dark:border-cyan-300/40 dark:text-white dark:hover:bg-white/10"
              onClick={close}
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md bg-[var(--accent-color)] px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--accent-hover)] dark:bg-cyan-400 dark:text-[#0f172a] dark:hover:bg-cyan-300"
              onClick={close}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
