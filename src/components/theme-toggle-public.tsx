"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeTogglePublic() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem("servlo-theme") as "dark" | "light" | null) ?? "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("servlo-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  // Stable placeholder during SSR to avoid layout shift
  if (!mounted) {
    return <div className="h-[34px] w-[34px] rounded-md border border-gray-200 dark:border-white/20" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border border-gray-200 dark:border-white/20 p-2 text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
