"use client";

import { ThemeToggleButton } from "@/components/theme-toggle-button";

/** Fixed top-right; use on auth pages outside cards. */
export function ThemeToggleCorner() {
  return (
    <div className="pointer-events-auto fixed right-4 top-4 z-[100] md:right-6 md:top-6">
      <ThemeToggleButton />
    </div>
  );
}
