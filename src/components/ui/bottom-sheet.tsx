"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[89] bg-black/50" onClick={onClose} />
      <div
        className={`fixed inset-x-0 bottom-0 z-[90] max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-[var(--border)] bg-[var(--bg-card)] md:inset-0 md:m-auto md:max-h-[80vh] md:max-w-lg md:rounded-xl md:border${className ? ` ${className}` : ""}`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
          <div className="mx-auto h-1 w-12 rounded-full bg-[var(--border)] md:hidden" />
          {title && <p className="font-semibold text-[var(--text-primary)]">{title}</p>}
          <button
            onClick={onClose}
            className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </>
  );
}
