"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/** Matches dashboard header theme control (`owner-shell.tsx`). */
export function ThemeToggleButton({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("servlo-theme") as "dark" | "light" | null) ?? "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("servlo-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <button
      type="button"
      className={`rounded border border-[var(--border)] p-2 text-[var(--text-primary)] ${className}`}
      onClick={toggleTheme}
      aria-label="Toggle dark and light mode"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
