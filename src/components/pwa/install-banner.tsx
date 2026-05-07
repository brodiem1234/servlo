"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem("servlo_pwa_dismissed")) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] border-t border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 shadow-xl md:bottom-6 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-auto md:rounded-xl md:border">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Add SERVLO to your home screen</p>
          <p className="text-xs text-[var(--text-muted)]">Get the best experience on mobile</p>
        </div>
        <button
          onClick={() => { prompt.prompt(); setPrompt(null); }}
          className="rounded-lg bg-[var(--accent-color)] px-3 py-1.5 text-xs font-semibold text-white"
        >
          Install
        </button>
        <button
          onClick={() => { localStorage.setItem("servlo_pwa_dismissed", "true"); setPrompt(null); }}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          Later
        </button>
      </div>
    </div>
  );
}
