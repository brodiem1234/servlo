"use client";

import React, { useState } from "react";
import { Download, FileImage, FileText, Truck, Mail } from "lucide-react";

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  borderColor: "var(--border)",
};

type AssetItem = {
  name: string;
  formats: string[];
  icon: React.ReactNode;
};

const ASSETS: AssetItem[] = [
  {
    name: "Logo",
    formats: ["PNG", "SVG", "White"],
    icon: <FileImage size={22} style={{ color: "#A78BFA" }} />,
  },
  {
    name: "Business Card Template",
    formats: ["PDF"],
    icon: <FileText size={22} style={{ color: "#A78BFA" }} />,
  },
  {
    name: "Email Signature Template",
    formats: ["HTML"],
    icon: <Mail size={22} style={{ color: "#A78BFA" }} />,
  },
  {
    name: "Van Decal Template",
    formats: ["PDF", "AI"],
    icon: <Truck size={22} style={{ color: "#A78BFA" }} />,
  },
];

const BRAND_COLOURS = [
  { name: "Primary Blue", hex: "#3B82F6" },
  { name: "Secondary Gray", hex: "#64748B" },
  { name: "Accent Purple", hex: "#8B5CF6" },
];

type Tone = "professional" | "friendly" | "authoritative";

const TONE_EXAMPLES: Record<Tone, string[]> = {
  professional: [
    "We deliver quality workmanship on every project, backed by a satisfaction guarantee.",
    "Our licensed technicians bring expertise and reliability to every job.",
    "Trust our team for timely, precise service that meets Australian standards.",
  ],
  friendly: [
    "Hey there! We're your local tradies — give us a ring and we'll sort it out!",
    "No job too big or small. We love helping our neighbours keep things running smoothly.",
    "We're the team your friends recommend. Come see why 500+ locals trust us!",
  ],
  authoritative: [
    "Industry leaders since 2010. When precision matters, choose the experts.",
    "Unmatched technical expertise. We set the standard in your area.",
    "The most trusted name in the trade. Results speak for themselves.",
  ],
};

export default function BrandKitPage() {
  const [selectedTone, setSelectedTone] = useState<Tone>("professional");

  return (
    <>
      <title>SERVLO GROW — Brand Kit</title>
      <section className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Brand Kit
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Your brand assets, colours, and voice guidelines.
          </p>
        </div>

        {/* Section 1: Brand Assets */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Brand Assets
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ASSETS.map((asset) => (
              <div
                key={asset.name}
                className="flex flex-col gap-3 rounded-xl border p-4"
                style={cardStyle}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: "rgb(139 92 246 / 0.12)" }}
                >
                  {asset.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {asset.name}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {asset.formats.map((fmt) => (
                      <span
                        key={fmt}
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: "rgb(139 92 246 / 0.12)", color: "#A78BFA" }}
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="mt-auto flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold opacity-50"
                  style={{ background: "#8B5CF6", color: "#fff" }}
                >
                  <Download size={12} /> Download
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Asset generation coming soon — brand kit will be auto-built from your business profile.
          </p>
        </div>

        {/* Section 2: Brand Colours */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Brand Colours
          </h2>
          <div className="flex flex-wrap gap-4">
            {BRAND_COLOURS.map((colour) => (
              <div
                key={colour.hex}
                className="flex items-center gap-3 rounded-xl border p-3"
                style={cardStyle}
              >
                <div
                  className="h-12 w-12 shrink-0 rounded-lg shadow-lg"
                  style={{ background: colour.hex }}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {colour.name}
                  </p>
                  <p
                    className="mt-0.5 font-mono text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {colour.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Brand Voice */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Brand Voice
          </h2>
          <div className="flex gap-2">
            {(["professional", "friendly", "authoritative"] as Tone[]).map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setSelectedTone(tone)}
                className="rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-all"
                style={
                  selectedTone === tone
                    ? { background: "#8B5CF6", color: "#fff" }
                    : {
                        background: "var(--bg-secondary)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {tone}
              </button>
            ))}
          </div>
          <div className="rounded-xl border p-4 space-y-3" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Example phrases — {selectedTone} tone
            </p>
            {TONE_EXAMPLES[selectedTone].map((phrase, idx) => (
              <div
                key={idx}
                className="rounded-lg border-l-2 px-3 py-2.5 text-sm"
                style={{
                  background: "var(--bg-secondary)",
                  borderLeftColor: "#8B5CF6",
                  color: "var(--text-secondary)",
                }}
              >
                &ldquo;{phrase}&rdquo;
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
