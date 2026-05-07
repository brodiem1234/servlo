"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

type ProductId = "core" | "grow" | "leads";

const PRODUCTS: Array<{ id: ProductId; label: string; href: string; comingSoon?: boolean }> = [
  { id: "core", label: "Core", href: "/dashboard/owner" },
  { id: "grow", label: "Grow", href: "/dashboard/grow", comingSoon: true },
  { id: "leads", label: "Leads", href: "/dashboard/leads", comingSoon: true },
];

export function ProductSwitcher({ activeProduct }: { activeProduct: ProductId }) {
  return (
    <div className="flex gap-1 rounded-lg p-1" style={{ background: "color-mix(in srgb, var(--sidebar-divider) 60%, transparent)" }}>
      {PRODUCTS.map((product) => {
        const isActive = product.id === activeProduct;
        const showLock = product.comingSoon && !isActive;
        return (
          <Link
            key={product.id}
            href={product.href as any}
            title={product.comingSoon && !isActive ? "Coming soon" : undefined}
            className={[
              "relative flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors no-underline",
              isActive
                ? "shadow-sm"
                : "hover:bg-black/10",
              !isActive ? "opacity-60" : "",
            ].join(" ")}
            style={
              isActive
                ? { background: "var(--sidebar-active-bg)", color: "var(--sidebar-active-text)" }
                : { color: "var(--sidebar-text-muted)" }
            }
          >
            {showLock && <Lock size={9} className="shrink-0" />}
            {product.label}
          </Link>
        );
      })}
    </div>
  );
}
