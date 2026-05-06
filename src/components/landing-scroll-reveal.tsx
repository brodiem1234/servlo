"use client";

import { useEffect } from "react";

type Props = {
  /** CSS selector for elements to reveal. */
  selector?: string;
};

export function LandingScrollReveal({ selector = "[data-reveal]" }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (nodes.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).classList.add("is-revealed");
          obs.unobserve(e.target);
        }
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    for (const el of nodes) obs.observe(el);
    return () => obs.disconnect();
  }, [selector]);

  return null;
}

