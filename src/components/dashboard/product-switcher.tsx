"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { LayoutGrid, Lock } from "lucide-react";

export type ProductId =
  | "core"
  | "grow"
  | "leads"
  | "answer"
  | "pay"
  | "hire"
  | "fleet"
  | "finance-hub"
  | "insurance"
  | "safe"
  | "books"
  | "academy"
  | "connect";

const ACTIVE_PRODUCTS: Array<{
  id: ProductId;
  label: string;
  sub: string;
  href: string;
  color: string;
}> = [
  {
    id: "core",
    label: "Core",
    sub: "Business Management",
    href: "/dashboard/owner",
    color: "#3B82F6",
  },
  {
    id: "grow",
    label: "Grow",
    sub: "Marketing & Ads",
    href: "/dashboard/grow",
    color: "#7C3AED",
  },
];

const COMING_SOON_PRODUCTS: Array<{
  id: ProductId;
  label: string;
  sub: string;
  href: string;
  color: string;
  launch: string;
}> = [
  {
    id: "leads",
    label: "Leads",
    sub: "Lead Marketplace",
    href: "/dashboard/leads",
    color: "#F59E0B",
    launch: "Q4 2026",
  },
];

export function ProductSwitcher({
  activeProduct,
}: {
  activeProduct: ProductId;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="product-switcher-trigger flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors"
        style={{
          background: open
            ? "color-mix(in srgb, var(--sidebar-divider) 80%, transparent)"
            : "color-mix(in srgb, var(--sidebar-divider) 50%, transparent)",
          color: "var(--sidebar-text)",
        }}
      >
        <LayoutGrid size={14} aria-hidden />
        <span>Products</span>
        <span
          className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
          style={{ background: "rgb(59 130 246 / 0.2)", color: "#93C5FD" }}
        >
          2 of 3
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 98 }}
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed left-0 top-0 overflow-y-auto"
            style={{
              width: "256px",
              height: "100vh",
              zIndex: 99,
              background: "var(--panel-bg, #0d1117)",
              borderRight: "1px solid var(--panel-border, rgba(255,255,255,0.12))",
              boxShadow: "var(--panel-shadow, 4px 0 20px rgba(0,0,0,0.5))",
            }}
          >
          {/* Active products */}
          <div className="px-3 pt-3 pb-2">
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--text-muted, #6b7280)" }}
            >
              Active
            </p>
            <div className="flex flex-col gap-1">
              {ACTIVE_PRODUCTS.map((product) => {
                const isActiveProd = product.id === activeProduct;
                return (
                  <Link
                    key={product.id}
                    href={product.href as any}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors no-underline"
                    style={{
                      background: isActiveProd
                        ? `color-mix(in srgb, ${product.color} 15%, transparent)`
                        : "transparent",
                      border: isActiveProd
                        ? `1px solid color-mix(in srgb, ${product.color} 40%, transparent)`
                        : "1px solid transparent",
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: product.color }}
                    />
                    <span className="flex flex-col">
                      <span
                        className="text-sm font-bold leading-none"
                        style={{
                          color: isActiveProd
                            ? product.color
                            : "var(--text-primary, #f9fafb)",
                        }}
                      >
                        {product.label}
                      </span>
                      <span
                        className="mt-0.5 text-xs leading-none"
                        style={{ color: "var(--text-muted, #6b7280)" }}
                      >
                        {product.sub}
                      </span>
                    </span>
                    {isActiveProd && (
                      <span
                        className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: `color-mix(in srgb, ${product.color} 20%, transparent)`,
                          color: product.color,
                        }}
                      >
                        Current
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div
            className="mx-3 h-px"
            style={{ background: "var(--border, rgba(255,255,255,0.08))" }}
          />

          {/* Coming soon products */}
          <div className="px-3 pt-2 pb-3">
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--text-muted, #6b7280)" }}
            >
              Coming Soon
            </p>
            <div className="flex flex-col gap-1">
              {COMING_SOON_PRODUCTS.map((product) => (
                <div
                  key={product.id}
                  title={`Launching ${product.launch}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-default"
                  style={{ opacity: 0.55 }}
                >
                  <Lock size={11} className="shrink-0" style={{ color: product.color }} />
                  <span className="flex flex-col">
                    <span
                      className="text-sm font-semibold leading-none"
                      style={{ color: "var(--text-primary, #f9fafb)" }}
                    >
                      {product.label}
                    </span>
                    <span
                      className="mt-0.5 text-xs leading-none"
                      style={{ color: "var(--text-muted, #6b7280)" }}
                    >
                      {product.sub}
                    </span>
                  </span>
                  <span
                    className="ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "var(--text-muted, #6b7280)",
                    }}
                  >
                    {product.launch}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2 text-center text-[10px]"
            style={{
              background: "rgba(0,0,0,0.04)",
              borderTop: "1px solid var(--panel-border, rgba(255,255,255,0.08))",
              color: "var(--text-muted, #6b7280)",
            }}
          >
            SERVLO Platform — 2 of 3 products active. More coming soon.
          </div>
          </div>
        </>
      )}
    </div>
  );
}
