"use client";

import React, { useState } from "react";
import { Mail, BarChart2, LayoutTemplate, Plus } from "lucide-react";

type Tab = "templates" | "campaigns" | "analytics";

interface Template {
  name: string;
  trigger: string;
}

const TEMPLATES: Template[] = [
  { name: "Welcome New Client", trigger: "New client created" },
  { name: "Job Completion Follow-up", trigger: "Job marked complete" },
  { name: "Quote Follow-up (3 days)", trigger: "3 days after quote sent" },
  { name: "Invoice Overdue Reminder", trigger: "Invoice overdue" },
  { name: "Seasonal Promotion", trigger: "Manual" },
  { name: "Review Request", trigger: "1 day after job complete" },
];

const STAT_CARDS = [
  { label: "Open rate", value: "0%" },
  { label: "Click rate", value: "0%" },
  { label: "Unsubscribes", value: "0" },
  { label: "Sent", value: "0" },
];

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  borderColor: "var(--border)",
};

export default function EmailMarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [activeTemplates, setActiveTemplates] = useState<Set<number>>(
    new Set([0, 1])
  );

  const toggleTemplate = (idx: number) => {
    setActiveTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "templates",
      label: "Templates",
      icon: <LayoutTemplate size={14} />,
    },
    { id: "campaigns", label: "Campaigns", icon: <Mail size={14} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart2 size={14} /> },
  ];

  return (
    <>
      <title>SERVLO GROW — Email Marketing</title>
      <section className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Email Marketing
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Automated email sequences for your service business.
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
            style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
          >
            Coming soon (Q4 2026)
          </span>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 rounded-lg p-1"
          style={{ background: "var(--bg-secondary)", width: "fit-content" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all"
              style={
                activeTab === tab.id
                  ? {
                      background: "#8B5CF6",
                      color: "#fff",
                    }
                  : {
                      color: "var(--text-muted)",
                    }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Templates tab */}
        {activeTab === "templates" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {TEMPLATES.map((tmpl, idx) => {
              const isActive = activeTemplates.has(idx);
              return (
                <div
                  key={tmpl.name}
                  className="flex items-start justify-between gap-4 rounded-xl border p-4"
                  style={cardStyle}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "rgb(139 92 246 / 0.15)" }}
                    >
                      <Mail size={16} style={{ color: "#A78BFA" }} />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {tmpl.name}
                      </p>
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Trigger: {tmpl.trigger}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTemplate(idx)}
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all"
                    style={
                      isActive
                        ? {
                            background: "rgb(16 185 129 / 0.15)",
                            color: "#10B981",
                            border: "1px solid rgb(16 185 129 / 0.3)",
                          }
                        : {
                            background: "var(--bg-secondary)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }
                    }
                  >
                    {isActive ? "✓ Active" : "Activate"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Campaigns tab */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "#8B5CF6" }}
              >
                <Plus size={15} /> Create Campaign
              </button>
            </div>
            <div
              className="flex flex-col items-center justify-center rounded-xl border py-16"
              style={cardStyle}
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "rgb(139 92 246 / 0.15)" }}
              >
                <Mail size={24} style={{ color: "#A78BFA" }} />
              </div>
              <p
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                No campaigns yet.
              </p>
              <p
                className="mt-1 max-w-sm text-center text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                AI-powered email campaigns coming Q4 2026.
              </p>
            </div>
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STAT_CARDS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border p-4"
                  style={cardStyle}
                >
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="mt-1 text-3xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="flex items-center gap-3 rounded-xl border p-4"
              style={{
                background: "rgb(139 92 246 / 0.06)",
                borderColor: "rgb(139 92 246 / 0.25)",
              }}
            >
              <Mail size={18} style={{ color: "#A78BFA" }} />
              <p className="text-sm" style={{ color: "#C4B5FD" }}>
                Connect your email to see stats. Integration coming Q4 2026.
              </p>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
