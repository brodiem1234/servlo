"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Share, Plus } from "lucide-react";

type Platform = "ios" | "android" | null;

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios/i.test(ua);
  if (isIOS && isSafari) return "ios";
  const isAndroid = /android/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edge|edg/i.test(ua);
  if (isAndroid && isChrome) return "android";
  return null;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);
}

const STORAGE_KEY = "servlo_pwa_prompt";
const VISIT_KEY = "servlo_visit_count";
const DISMISS_DAYS = 7;

function shouldShow(platform: Platform): boolean {
  if (!platform) return false;
  if (isStandalone()) return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { dismissed?: number; installed?: boolean };
      if (saved.installed) return false;
      if (saved.dismissed && Date.now() - saved.dismissed < DISMISS_DAYS * 864e5) return false;
    }
    const visits = parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10);
    return visits >= 2;
  } catch {
    return false;
  }
}

export function PwaInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    // Increment visit count
    try {
      const v = parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10) + 1;
      localStorage.setItem(VISIT_KEY, String(v));
    } catch { /* noop */ }

    const p = detectPlatform();
    setPlatform(p);

    // Wait a moment then show if eligible
    const t = setTimeout(() => {
      if (shouldShow(p)) setVisible(true);
    }, 3000);

    // Android: capture the beforeinstallprompt event
    const handleBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const pl = detectPlatform();
      if (shouldShow(pl)) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handleBip);

    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", handleBip);
    };
  }, []);

  function dismiss(permanent = false) {
    setVisible(false);
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...existing,
        dismissed: permanent ? Date.now() - 864e5 * 365 : Date.now()
      }));
    } catch { /* noop */ }
  }

  async function installAndroid() {
    if (!deferredPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (deferredPrompt as any).prompt();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const choice = await (deferredPrompt as any).userChoice;
    if (choice?.outcome === "accepted") {
      try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, installed: true }));
      } catch { /* noop */ }
    }
    setVisible(false);
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Install SERVLO"
      className="fixed inset-x-0 bottom-0 z-[9999] animate-in slide-in-from-bottom duration-300"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => dismiss()}
        aria-hidden
      />

      {/* Sheet */}
      <div className="relative mx-auto max-w-md rounded-t-3xl bg-[#0F0F0F] px-6 pb-8 pt-5 shadow-2xl">
        {/* Drag indicator */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        {/* Close button */}
        <button
          onClick={() => dismiss()}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Logo */}
        <div className="mb-5 flex items-center gap-3">
          <Image
            src="/servlo-master-white.svg"
            alt="SERVLO"
            width={140}
            height={40}
            unoptimized
            className="drop-shadow-[0_0_28px_rgba(255,255,255,0.2)] h-10 w-auto"
          />
        </div>

        {platform === "ios" ? (
          <>
            <h2 className="text-lg font-bold text-white">
              Install SERVLO on your iPhone
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Add to your home screen for the full app experience. Works offline too.
            </p>

            <ol className="mt-5 space-y-3">
              {[
                { Icon: Share, text: "Tap the Share button in Safari's toolbar" },
                { Icon: Plus, text: "Scroll down and tap \"Add to Home Screen\"" },
                { Icon: null, text: "Tap \"Add\" in the top right. Done!" },
              ].map(({ Icon, text }, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-300">
                    {Icon ? <Icon size={14} /> : <span>{i + 1}</span>}
                  </div>
                  <span className="text-sm text-zinc-300">{text}</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => dismiss()}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5"
              >
                Got it
              </button>
              <button
                onClick={() => dismiss()}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/5"
              >
                Remind me later
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-white">Install SERVLO</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Add SERVLO to your home screen for instant access and a better experience.
            </p>

            <button
              onClick={installAndroid}
              className="mt-6 w-full rounded-xl bg-blue-500 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Install app
            </button>

            <button
              onClick={() => dismiss()}
              className="mt-2.5 w-full rounded-xl py-3 text-sm font-semibold text-zinc-400 transition hover:text-zinc-200"
            >
              Not now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
