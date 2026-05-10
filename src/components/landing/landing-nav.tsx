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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:gap-4 md:px-6 md:py-4">
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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-gray-500 dark:text-slate-400 md:flex">
          <a href="#pricing" className="transition hover:text-gray-900 dark:hover:text-white">Pricing</a>
          <a href="#platform" className="transition hover:text-gray-900 dark:hover:text-white">Compare</a>
          <a href="#roadmap" className="transition hover:text-gray-900 dark:hover:text-white">Roadmap</a>
          <Link href="/status" className="transition hover:text-gray-900 dark:hover:text-white">Status</Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeTogglePublic />
          <Link
            href="/auth/login"
            className="hidden text-sm font-medium text-gray-600 dark:text-slate-300 transition hover:text-gray-900 dark:hover:text-white md:block"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="hidden rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 md:inline-flex"
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5 md:hidden"
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open ? (
        <div
          id="landing-mobile-menu"
          className="border-t border-gray-200 bg-white px-4 py-4 shadow-lg dark:border-white/[0.06] dark:bg-[#0A0A0A] md:hidden"
        >
          <nav className="flex flex-col gap-1 text-base font-medium text-gray-700 dark:text-slate-200">
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
          <div className="mt-3 flex flex-col gap-2 border-t border-gray-200 pt-3 dark:border-white/10">
            <Link
              href="/auth/login"
              onClick={close}
              className="flex h-12 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              onClick={close}
              className="flex h-12 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Start free trial
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
