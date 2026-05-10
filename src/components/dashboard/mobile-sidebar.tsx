"use client";

import { useEffect } from "react";

/**
 * Shared mobile sidebar overlay.
 * Renders a dark backdrop when the mobile sidebar drawer is open.
 * Clicking it closes the drawer.
 */
export function MobileSidebarOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Lock body scroll while the drawer is open on mobile
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[39] bg-black/50 md:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}
