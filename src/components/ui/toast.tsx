"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastKind = "success" | "error";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
};

type ToastCtx = {
  toast: (kind: ToastKind, message: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

function id() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const item: ToastItem = { id: id(), kind, message };
    setItems((prev) => [...prev, item].slice(-6));
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-[80] flex w-[min(92vw,340px)] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0">
        {items.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-lg transition-opacity ${
              t.kind === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return v;
}

