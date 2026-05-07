"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Megaphone, Share2, Star, Bell, CreditCard, ArrowLeft } from "lucide-react";

interface Props {
  business: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
}

const TABS = [
  { id: "general", label: "General" },
  { id: "integrations", label: "Integrations" },
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Billing" },
];

export default function GrowSettingsClient({ business, profile }: Props) {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fbPage, setFbPage] = useState((business?.facebook_page_id as string) || "");
  const [igHandle, setIgHandle] = useState((business?.instagram_handle as string) || "");
  const [googlePlaceId, setGooglePlaceId] = useState((business?.google_place_id as string) || "");
  const [adBudget, setAdBudget] = useState((business?.default_ad_budget as string) || "500");

  // Suppress unused variable warning for profile
  void profile;

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("businesses").update({
        facebook_page_id: fbPage || null,
        instagram_handle: igHandle || null,
        google_place_id: googlePlaceId || null,
        default_ad_budget: adBudget ? parseInt(adBudget) : null,
      }).eq("owner_id", user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href="/dashboard/grow" className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors">
          <ArrowLeft size={15} />Back to SERVLO GROW
        </a>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">SERVLO GROW — Settings</h1>
        <p className="text-slate-400 mt-1">Configure your marketing and advertising preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white mb-4">Ad Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Default Daily Ad Budget (AUD)</label>
                <input
                  type="number"
                  value={adBudget}
                  onChange={(e) => setAdBudget(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                  placeholder="500"
                  min="1"
                />
                <p className="text-xs text-slate-500 mt-1">Used as default when creating new ad campaigns</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Megaphone size={16} className="text-purple-400" />Content Preferences</h2>
            <div className="space-y-3">
              {[
                { label: "Use business name in all AI-generated content", default: true },
                { label: "Include suburb/location in ad copy", default: true },
                { label: "Auto-add business phone to ad copy", default: false },
              ].map((pref) => (
                <label key={pref.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{pref.label}</span>
                  <input type="checkbox" defaultChecked={pref.default} className="w-4 h-4 accent-purple-500" />
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            style={{ background: saving ? "#4a3f7a" : "#8B5CF6" }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white mb-4">Social Media Connections</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 flex items-center gap-2">
                  <Share2 size={14} />Facebook Page ID
                </label>
                <input
                  type="text"
                  value={fbPage}
                  onChange={(e) => setFbPage(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g. 123456789012345"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Instagram Handle</label>
                <input
                  type="text"
                  value={igHandle}
                  onChange={(e) => setIgHandle(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                  placeholder="@yourbusiness"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 flex items-center gap-2">
                  <Star size={14} />Google Place ID
                </label>
                <input
                  type="text"
                  value={googlePlaceId}
                  onChange={(e) => setGooglePlaceId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                  placeholder="ChIJ..."
                />
                <p className="text-xs text-slate-500 mt-1">Used to pull Google reviews automatically</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 rounded-lg px-5 py-2 text-sm font-semibold text-white"
              style={{ background: "#8B5CF6" }}
            >
              {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Bell size={16} className="text-purple-400" />Notification Preferences</h2>
          <div className="space-y-3">
            {[
              "Email me when a new review is posted",
              "Email me when an ad campaign ends",
              "Weekly Grow performance digest",
              "New referral notification",
              "Social post scheduled confirmation",
            ].map((notif) => (
              <label key={notif} className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-300">{notif}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-purple-500" />
              </label>
            ))}
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2"><CreditCard size={16} className="text-purple-400" />Billing</h2>
          <p className="text-sm text-slate-400 mb-4">SERVLO GROW billing is managed through your SERVLO CORE subscription.</p>
          <a
            href="/dashboard/owner/settings?tab=billing"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#8B5CF6" }}
          >
            Manage Billing in SERVLO CORE
          </a>
        </div>
      )}
    </div>
  );
}
