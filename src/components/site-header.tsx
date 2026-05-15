"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

// ── Single source of truth for public navigation ───────────────────────────
// Add new public pages here and they'll show in desktop nav + mobile menu.
// Primary = always visible. Secondary = "More" dropdown (desktop) + collapsed
// section in mobile menu.

const PRIMARY_NAV = [
  { href: "/#pricing", label: "Pricing" },
  { href: "/compare", label: "Compare" },
  { href: "/docs", label: "Docs" },
  { href: "/status", label: "Status" },
];

const SECONDARY_NAV = [
  { href: "/guarantee", label: "Guarantee" },
  { href: "/#roadmap", label: "Roadmap" },
  { href: "/contact", label: "Contact" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/refund", label: "Refund Policy" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Close menus on Escape
  useEffect(() => {
    if (!mobileOpen && !moreOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMoreOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, moreOpen]);

  // Close "More" dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    function onClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moreOpen]);

  const closeAll = () => {
    setMobileOpen(false);
    setMoreOpen(false);
  };

  return (
    <>
    {/* Spacer matches header height so content starts below it on mount.
        Header is fixed (not sticky) because some pages wrap children in
        overflow-x-hidden, which silently breaks position: sticky. */}
    <div aria-hidden className="h-14 md:h-16" />
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#0A0A0A]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6">
        {/* Logo */}
        <Link href="/" className="shrink-0" onClick={closeAll}>
          <Image
            src="/servlo-master-white.svg"
            alt="SERVLO"
            width={120}
            height={32}
            priority
            unoptimized
            className="h-8 w-auto drop-shadow-[0_0_28px_rgba(255,255,255,0.15)]"
          />
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-7 text-sm font-medium text-white md:flex"
        >
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white transition hover:text-white/70"
            >
              {item.label}
            </Link>
          ))}

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1 text-white transition hover:text-white/70"
            >
              More
              <ChevronDown size={14} aria-hidden className={moreOpen ? "rotate-180 transition" : "transition"} />
            </button>
            {moreOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-white/10 bg-[#0A0A0A] py-1 shadow-2xl"
              >
                {SECONDARY_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={closeAll}
                    className="block px-3 py-2 text-sm text-white transition hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-white transition hover:text-white/70"
            onClick={closeAll}
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-neutral-200 md:px-4 md:py-2 md:text-sm"
            onClick={closeAll}
          >
            Sign Up
          </Link>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="site-header-mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white transition hover:bg-white/5 md:hidden"
          >
            {mobileOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen ? (
        <div
          id="site-header-mobile-menu"
          className="border-t border-white/[0.06] bg-[#0A0A0A] px-4 py-3 shadow-lg md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col gap-0.5 text-base font-medium text-white">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeAll}
                className="rounded-lg px-3 py-3 transition hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-white/40">
              More
            </div>
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeAll}
                className="rounded-lg px-3 py-3 transition hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
    </>
  );
}
