"use client";

import { useState } from "react";
import { ArrowLeft, Bell, CreditCard, MapPin } from "lucide-react";

interface Props {
  business: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
}

const TRADES = ["Plumbing","Electrical","Air Conditioning","Tiling","Carpentry","Roofing","Painting","Landscaping","Cleaning","Solar","Concreting","Security","General Building","Other"];

export default function LeadsSettingsClient({ business, profile }: Props) {
  // Suppress unused variable warnings
  void business;
  void profile;

  const [activeTab, setActiveTab] = useState("preferences");
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [maxBudget, setMaxBudget] = useState("5000");
  const [radius, setRadius] = useState("25");

  const toggleTrade = (trade: string) =>
    setSelectedTrades((prev) => prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <a href="/dashboard/leads" className="flex items-center gap-1.5 text-sm text-yellow-400 hover:text-yellow-300 transition-colors mb-4">
          <ArrowLeft size={15} />Back to SERVLO LEADS
        </a>
        <h1 className="text-2xl font-bold text-white">SERVLO LEADS — Settings</h1>
        <p className="text-slate-400 mt-1">Configure your lead preferences and notifications</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/10">
        {["preferences", "notifications", "billing"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab ? "border-yellow-500 text-yellow-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "preferences" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white mb-4">Trade Categories</h2>
            <p className="text-sm text-slate-400 mb-3">Select the trades you want to receive leads for:</p>
            <div className="flex flex-wrap gap-2">
              {TRADES.map((trade) => (
                <button
                  key={trade}
                  onClick={() => toggleTrade(trade)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
                    selectedTrades.includes(trade)
                      ? "border-yellow-500/60 bg-yellow-500/20 text-yellow-400"
                      : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                  }`}
                >
                  {trade}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><MapPin size={15} className="text-yellow-400" />Location &amp; Budget</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Search Radius (km)</label>
                <input
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                  min="5"
                  max="200"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Max Lead Budget (AUD)</label>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#F59E0B" }}
          >
            Save Preferences
          </button>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Bell size={16} className="text-yellow-400" />Lead Notifications</h2>
          <div className="space-y-3">
            {[
              "Email me instantly when a matching lead is posted",
              "SMS alert for urgent leads",
              "Daily digest of new leads in my area",
              "Notify me when a claimed lead is updated",
            ].map((notif) => (
              <label key={notif} className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-300">{notif}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-yellow-500" />
              </label>
            ))}
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2"><CreditCard size={16} className="text-yellow-400" />Billing</h2>
          <p className="text-sm text-slate-400 mb-4">SERVLO LEADS billing is managed through your SERVLO CORE subscription.</p>
          <a
            href="/dashboard/owner/settings?tab=billing"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#F59E0B" }}
          >
            Manage Billing in SERVLO CORE
          </a>
        </div>
      )}
    </div>
  );
}
