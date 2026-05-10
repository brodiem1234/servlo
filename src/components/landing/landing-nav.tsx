"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeTogglePublic } from "@/components/theme-toggle-public";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="shrink-0" onClick={close}>
          <Image
            src="/servlo-master-white.svg"
            alt="SERVLO"
            width={120}
            height={32}
            priority
            unoptimized
            className="hidden dark:block drop-shadow-[0_0_28px_rgba(255,255,255,0.2)] h-7 w-auto md:h-8"
          />
          <Image
            src="/servlo-master-dark.svg"
            alt="SERVLO"
            width={120}
            height={32}
            priority
            unoptimized
            className="block dark:hidden drop-shadow-[0_0_20px_rgba(0,0,0,0.12)] h-7 w-auto md:h-8"
          />
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-gray-500 dark:text-slate-400 md:flex">
          <a href="#pricing" className="transition hover:text-gray-900 dark:hover:text-white">Pricing</a>
          <a href="#platform" className="transition hover:text-gray-900 dark:hover:text-white">Compare</a>
          <a href="#roadmap" className="transition hover:text-gray-900 dark:hover:text-white">Roadmap</a>
          <Link href="/status" className="transition hover:text-gray-900 dark:hover:text-white">Status</Link>
        </nav>

        {/* Right side
            Mobile order: ThemeToggle | Log in | Start free trial | Hamburger
            Desktop order: Log in | Start free trial | ThemeToggle
            ThemeToggle wrapper uses order-first (mobile) / md:order-last (desktop)
        */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Log in — always visible */}
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-600 dark:text-white/80 transition hover:text-gray-900 dark:hover:text-white"
          >
            Log in
          </Link>

          {/* Start free trial — compact on mobile, full on desktop */}
          <Link
            href="/auth/signup"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 md:px-4 md:py-2 md:text-sm"
          >
            Start free trial
          </Link>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5 md:hidden"
          >
            {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>

          {/* Theme toggle — first on mobile (order-first), last on desktop (md:order-last) */}
          <div className="order-first md:order-last">
            <ThemeTogglePublic />
          </div>
        </div>
      </div>

      {/* Mobile dropdown — nav links ONLY (Log in + Start free trial stay in top bar) */}
      {open ? (
        <div
          id="landing-mobile-menu"
          className="border-t border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-white/[0.06] dark:bg-[#0A0A0A] md:hidden"
        >
          <nav className="flex flex-col gap-0.5 text-base font-medium text-gray-700 dark:text-slate-200">
            <a
              href="#pricing"
              onClick={close}
              className="rounded-lg px-3 py-3 transition hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Pricing
            </a>
            <a
              href="#platform"
              onClick={close}
              className="rounded-lg px-3 py-3 transition hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Compare
            </a>
            <a
              href="#roadmap"
              onClick={close}
              className="rounded-lg px-3 py-3 transition hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Roadmap
            </a>
            <Link
              href="/status"
              onClick={close}
              className="rounded-lg px-3 py-3 transition hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Status
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
