"use client";

import { Lock } from "lucide-react";

interface LockedOverlayProps {
  productName: string;
  launchDate: string;
  accentColor: string;
}

export function LockedOverlay({ productName, launchDate, accentColor }: LockedOverlayProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        background: "rgba(8,13,24,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px 32px",
          borderRadius: "16px",
          background: "rgba(15,22,35,0.95)",
          border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
          boxShadow: `0 0 60px color-mix(in srgb, ${accentColor} 15%, transparent)`,
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
            border: `2px solid color-mix(in srgb, ${accentColor} 40%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Lock size={24} style={{ color: accentColor }} />
        </div>
        <h2
          style={{
            color: "#f9fafb",
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
          }}
        >
          {productName}
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 20px" }}>
          This product is coming soon. You&apos;ll be notified when it&apos;s available for your account.
        </p>
        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: "20px",
            background: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accentColor} 40%, transparent)`,
            color: accentColor,
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          Launching {launchDate}
        </div>
      </div>
    </div>
  );
}
