"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function DarkModeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("servlo-theme") : null;
    const isDark = stored !== "light";
    setDark(isDark);
    applyTheme(isDark);
  }, []);

  function applyTheme(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light-mode");
    }
  }

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("servlo-theme", next ? "dark" : "light");
    applyTheme(next);
  }

  // v2 TODO: re-enable when light mode is re-introduced
  // return (
  //   <button
  //     type="button"
  //     onClick={toggle}
  //     aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
  //     className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${className ?? ""}`}
  //     style={{ color: "var(--text-muted, #94a3b8)" }}
  //   >
  //     {dark
  //       ? <Sun size={16} aria-hidden className="hover:text-yellow-400 transition-colors" />
  //       : <Moon size={16} aria-hidden className="hover:text-blue-400 transition-colors" />
  //     }
  //   </button>
  // );
  return null;
}
