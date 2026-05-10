"use client";

import { useCallback, useRef } from "react";

interface UndoToastOptions {
  message: string;
  onUndo: () => void;
  duration?: number;
}

/**
 * Simple undo toast using the browser's native approach.
 * Returns a `showUndo` function. When called it shows a floating toast with
 * an Undo button. If the user clicks Undo within `duration` ms the onUndo
 * callback fires. After `duration` ms the toast auto-dismisses.
 */
export function useUndoToast() {
  const toastRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (toastRef.current) {
      toastRef.current.remove();
      toastRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showUndo = useCallback(
    ({ message, onUndo, duration = 5000 }: UndoToastOptions) => {
      // Remove any existing toast first
      dismiss();

      const toast = document.createElement("div");
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        background: #1f2937;
        color: #f9fafb;
        padding: 12px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-family: inherit;
        box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        white-space: nowrap;
        animation: slideUp 0.2s ease-out;
      `;

      // Inject keyframes once
      if (!document.getElementById("undo-toast-styles")) {
        const style = document.createElement("style");
        style.id = "undo-toast-styles";
        style.textContent = `
          @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(8px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `;
        document.head.appendChild(style);
      }

      const span = document.createElement("span");
      span.textContent = message;

      const btn = document.createElement("button");
      btn.textContent = "Undo";
      btn.style.cssText = `
        background: transparent;
        border: 1px solid rgba(255,255,255,0.3);
        color: #fff;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
      `;
      btn.addEventListener("click", () => {
        onUndo();
        dismiss();
      });

      toast.appendChild(span);
      toast.appendChild(btn);
      document.body.appendChild(toast);
      toastRef.current = toast;

      timerRef.current = setTimeout(dismiss, duration);
    },
    [dismiss]
  );

  return { showUndo, dismissUndo: dismiss };
}
