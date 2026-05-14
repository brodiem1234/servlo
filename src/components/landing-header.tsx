"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

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
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0A]/90 backdrop-blur-xl">
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
            className="drop-shadow-[0_0_28px_rgba(255,255,255,0.15)] h-8 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-400 md:flex">
          <Link href="/#pricing" className="transition hover:text-white">Pricing</Link>
          <Link href="/compare" className="transition hover:text-white">Compare</Link>
          <Link href="/guarantee" className="transition hover:text-white">Guarantee</Link>
          <Link href="/status" className="transition hover:text-white">Status</Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-white/70 transition hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-neutral-100 md:px-4 md:py-2 md:text-sm"
          >
            Start free trial
          </Link>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="landing-header-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white transition hover:bg-white/5 md:hidden"
          >
            {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div
          id="landing-header-mobile-menu"
          className="border-t border-white/[0.06] bg-[#0A0A0A] px-4 py-3 shadow-lg md:hidden"
        >
          <nav className="flex flex-col gap-0.5 text-base font-medium text-slate-300">
            <Link href="/#pricing" onClick={close} className="rounded-lg px-3 py-3 transition hover:bg-white/5 hover:text-white">
              Pricing
            </Link>
            <Link href="/compare" onClick={close} className="rounded-lg px-3 py-3 transition hover:bg-white/5 hover:text-white">
              Compare
            </Link>
            <Link href="/guarantee" onClick={close} className="rounded-lg px-3 py-3 transition hover:bg-white/5 hover:text-white">
              Guarantee
            </Link>
            <Link href="/status" onClick={close} className="rounded-lg px-3 py-3 transition hover:bg-white/5 hover:text-white">
              Status
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
