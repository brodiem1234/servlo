"use client";

import { useState, useMemo } from "react";

type BusinessInfo = {
  name: string | null;
  phone: string | null;
  address: string | null;
  suburb: string;
  state: string;
  postcode: string | null;
  email: string | null;
  abn: string | null;
};

interface Props {
  business: BusinessInfo;
  industryLabel: string;
  seoScore: number;
  reviewCount: number;
  clientCount: number;
}

type Recommendation = {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  action: string;
  href?: string;
  done: boolean;
};

type KeywordRow = {
  term: string;
  volume: string;
  competition: "Low" | "Medium" | "High";
  tip: string;
};

function industryToKeywords(industry: string, suburb: string, state: string): KeywordRow[] {
  const loc = [suburb, state].filter(Boolean).join(" ");
  const locSuffix = loc ? ` ${loc}` : "";
  const locShort = suburb || state || "near me";

  const base: Record<string, KeywordRow[]> = {
    trades: [
      { term: `Electrician${locSuffix}`, volume: "2,400/mo", competition: "Medium", tip: "Add your suburb to Google Business Profile" },
      { term: `Emergency electrician${locSuffix}`, volume: "880/mo", competition: "Low", tip: "Highlight 24/7 availability in description" },
      { term: `Electrician ${locShort}`, volume: "4,400/mo", competition: "High", tip: "Earn 5+ Google reviews to compete" },
      { term: `Switchboard upgrade${locSuffix}`, volume: "320/mo", competition: "Low", tip: "Great long-tail — add to website title" },
      { term: `Electrical inspection${locSuffix}`, volume: "590/mo", competition: "Low", tip: "Create a dedicated service page" },
    ],
    cleaning: [
      { term: `House cleaning${locSuffix}`, volume: "3,600/mo", competition: "High", tip: "Get reviews that mention suburbs you serve" },
      { term: `End of lease cleaning${locSuffix}`, volume: "2,900/mo", competition: "Medium", tip: "Highly intent-driven — add pricing info" },
      { term: `Office cleaning${locSuffix}`, volume: "1,100/mo", competition: "Medium", tip: "Target commercial areas in your profile" },
      { term: `Carpet cleaning ${locShort}`, volume: "1,800/mo", competition: "Medium", tip: "Add carpet cleaning as a service category" },
      { term: `Regular cleaner${locSuffix}`, volume: "720/mo", competition: "Low", tip: "Mention recurring services in your bio" },
    ],
    plumbing: [
      { term: `Plumber${locSuffix}`, volume: "5,400/mo", competition: "High", tip: "Complete your Google Business Profile 100%" },
      { term: `Emergency plumber${locSuffix}`, volume: "1,600/mo", competition: "Medium", tip: "Add 24/7 to your business name/description" },
      { term: `Hot water system${locSuffix}`, volume: "1,100/mo", competition: "Low", tip: "Create a dedicated hot water page" },
      { term: `Blocked drain${locSuffix}`, volume: "880/mo", competition: "Low", tip: "Photo before/after jobs for social proof" },
      { term: `Gas plumber${locSuffix}`, volume: "590/mo", competition: "Low", tip: "Add gas licence number to your profile" },
    ],
  };

  const industryLower = industry.toLowerCase();
  for (const [key, rows] of Object.entries(base)) {
    if (industryLower.includes(key)) return rows;
  }

  // Generic fallback
  return [
    { term: `${industry}${locSuffix}`, volume: "1,200/mo", competition: "Medium", tip: "Complete your Google Business Profile" },
    { term: `Best ${industry} ${locShort}`, volume: "590/mo", competition: "Low", tip: "Earn 5+ five-star reviews" },
    { term: `${industry} near me`, volume: "2,400/mo", competition: "High", tip: "Add your precise service areas" },
    { term: `Affordable ${industry}${locSuffix}`, volume: "320/mo", competition: "Low", tip: "Mention competitive pricing in profile" },
    { term: `${industry} reviews${locSuffix}`, volume: "480/mo", competition: "Low", tip: "Respond to all Google reviews" },
  ];
}

const CITATION_SOURCES = [
  { name: "Google Business Profile", url: "https://business.google.com", icon: "🔵", priority: "Essential" },
  { name: "Yellow Pages Australia", url: "https://www.yellowpages.com.au", icon: "🟡", priority: "Essential" },
  { name: "True Local",             url: "https://www.truelocal.com.au", icon: "🟢", priority: "High" },
  { name: "Yelp Australia",         url: "https://www.yelp.com.au",      icon: "🔴", priority: "High" },
  { name: "hipages",                url: "https://hipages.com.au",       icon: "🟠", priority: "High" },
  { name: "Oneflare",               url: "https://www.oneflare.com.au",  icon: "🔷", priority: "High" },
  { name: "Service Seeking",        url: "https://www.serviceseeking.com.au", icon: "🟤", priority: "Medium" },
  { name: "Product Review",         url: "https://www.productreview.com.au", icon: "⭐", priority: "Medium" },
];

function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        className="transition-all duration-700"
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="currentColor"
        className="text-[var(--text-primary)]" fontSize="18" fontWeight="bold">
        {score}
      </text>
      <text x="50" y="66" textAnchor="middle" dominantBaseline="central" fill="var(--text-muted)" fontSize="10">
        /100
      </text>
    </svg>
  );
}

const IMPACT_STYLES = {
  high:   "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low:    "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export function LocalSeoManager({ business, industryLabel, seoScore, reviewCount, clientCount }: Props) {
  const [citationsDone, setCitationsDone] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "citations" | "checklist">("overview");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const keywords = useMemo(
    () => industryToKeywords(industryLabel, business.suburb, business.state),
    [industryLabel, business.suburb, business.state]
  );

  const recommendations: Recommendation[] = useMemo(() => {
    const recs: Recommendation[] = [];
    if (!business.phone) recs.push({ id: "phone", title: "Add your phone number", description: "Businesses with a phone number rank 15% higher in local search.", impact: "high", action: "Add phone", href: "/dashboard/owner/settings?tab=profile", done: false });
    if (!business.address || !business.suburb) recs.push({ id: "address", title: "Complete your address", description: "Local SEO requires an exact address to appear in 'near me' searches.", impact: "high", action: "Add address", href: "/dashboard/owner/settings?tab=profile", done: false });
    if (reviewCount === 0) recs.push({ id: "reviews", title: "Get your first review", description: "Businesses with 1+ reviews are 270% more likely to rank in Google Maps.", impact: "high", action: "Get reviews", href: "/dashboard/grow/reviews", done: false });
    if (reviewCount > 0 && reviewCount < 5) recs.push({ id: "more_reviews", title: `Get to 5 reviews (${reviewCount}/5)`, description: "Google's algorithm requires at least 5 reviews to prominently feature your business.", impact: "high", action: "Get more reviews", href: "/dashboard/grow/reviews", done: false });
    if (reviewCount >= 5) recs.push({ id: "reviews_done", title: "5+ reviews achieved", description: "Excellent! Keep collecting reviews for continued ranking improvements.", impact: "high", action: "View reviews", href: "/dashboard/grow/reviews", done: true });
    if (!business.abn) recs.push({ id: "abn", title: "Add your ABN", description: "ABN verification adds trust signals and improves local directory listings.", impact: "medium", action: "Add ABN", href: "/dashboard/owner/settings?tab=profile", done: false });
    if (citationsDone.size === 0) recs.push({ id: "citation", title: "Create a citation (directory listing)", description: "Each citation on directories like Yellow Pages or True Local boosts local rankings.", impact: "medium", action: "View directories", done: false });
    if (citationsDone.size >= 3) recs.push({ id: "citations_done", title: `${citationsDone.size} citations created`, description: "Good citation coverage! Aim for 5+ directories.", impact: "medium", action: "View all", done: citationsDone.size >= 5 });

    if (recs.length === 0) {
      recs.push({ id: "maintain", title: "Keep collecting reviews", description: "Continue requesting reviews after each job to maintain ranking momentum.", impact: "low", action: "Request reviews", href: "/dashboard/grow/reviews", done: false });
    }
    return recs;
  }, [business, reviewCount, citationsDone]);

  const completedRecs = recommendations.filter((r) => r.done).length;
  const progressPct = recommendations.length > 0 ? Math.round((completedRecs / recommendations.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {([["overview", "Overview"], ["keywords", "Keywords"], ["citations", "Directories"], ["checklist", "Action Plan"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? "border-[#8B5CF6] text-[#8B5CF6]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
          >{label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Score card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 flex flex-col items-center gap-3">
            <ScoreRing score={seoScore} />
            <div className="text-center">
              <p className="font-bold text-[var(--text-primary)]">Local SEO Score</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {seoScore >= 80 ? "Excellent — keep it up!" : seoScore >= 50 ? "Good — room to improve" : "Needs attention"}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: "Reviews", value: reviewCount.toString(), icon: "⭐", note: reviewCount >= 5 ? "Strong signal" : `Need ${5 - reviewCount} more`, good: reviewCount >= 5 },
              { label: "Clients Served", value: clientCount.toString(), icon: "👤", note: "Shows business activity", good: clientCount > 5 },
              { label: "Profile Complete", value: [business.name, business.phone, business.address, business.abn].filter(Boolean).length + "/4", icon: "✅", note: "Business info fields", good: !!(business.phone && business.address) },
              { label: "Directory Coverage", value: `${citationsDone.size}/${CITATION_SOURCES.length}`, icon: "📍", note: "Aim for 5+ listings", good: citationsDone.size >= 3 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{stat.icon}</span>
                  <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
                </div>
                <div className={`text-2xl font-bold ${stat.good ? "text-emerald-400" : "text-amber-400"}`}>{stat.value}</div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.note}</p>
              </div>
            ))}
          </div>

          {/* Top recommendations */}
          <div className="lg:col-span-3">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">Top Recommendations</h3>
            <div className="space-y-2">
              {recommendations.filter((r) => !r.done).slice(0, 4).map((rec) => (
                <div key={rec.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 flex items-start gap-3">
                  <span className={`rounded border px-2 py-0.5 text-xs font-medium flex-shrink-0 mt-0.5 ${IMPACT_STYLES[rec.impact]}`}>
                    {rec.impact.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] text-sm">{rec.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{rec.description}</p>
                  </div>
                  {rec.href && (
                    <a href={rec.href} className="flex-shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--accent-color)] hover:bg-[var(--bg-primary)] whitespace-nowrap">
                      {rec.action} →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── KEYWORDS ── */}
      {activeTab === "keywords" && (
        <div>
          <div className="mb-4">
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">Recommended Keywords</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Based on your industry ({industryLabel}) and location ({[business.suburb, business.state].filter(Boolean).join(", ") || "not set"}). Use these in your Google Business Profile, website, and directory listings.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm" aria-label="Keyword recommendations">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-card)]">
                  <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Keyword</th>
                  <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium hidden sm:table-cell">Monthly Searches</th>
                  <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium hidden md:table-cell">Competition</th>
                  <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Tip</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{kw.term}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] hidden sm:table-cell">{kw.volume}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${kw.competition === "Low" ? "bg-emerald-500/15 text-emerald-400" : kw.competition === "Medium" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"}`}>
                        {kw.competition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{kw.tip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-3">* Search volume estimates are approximate and vary by location. Focus on local variants first.</p>
        </div>
      )}

      {/* ── CITATIONS / DIRECTORIES ── */}
      {activeTab === "citations" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Business Directories</h3>
              <p className="text-sm text-[var(--text-muted)]">
                List your business consistently across directories to boost local search rankings. Consistency in name, address and phone (NAP) is critical.
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{citationsDone.size}/{CITATION_SOURCES.length}</div>
              <div className="text-xs text-[var(--text-muted)]">directories</div>
            </div>
          </div>

          {/* NAP summary */}
          {(business.name || business.phone || business.address) && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 mb-5">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Your NAP (copy exactly when listing)</p>
              <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                {business.name && <p><strong>Name:</strong> {business.name}</p>}
                {business.phone && <p><strong>Phone:</strong> {business.phone}</p>}
                {business.address && <p><strong>Address:</strong> {[business.address, business.suburb, business.state, business.postcode].filter(Boolean).join(", ")}</p>}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {CITATION_SOURCES.map((src) => {
              const done = citationsDone.has(src.name);
              return (
                <div key={src.name} className={`rounded-xl border p-4 flex items-center gap-3 transition-all ${done ? "border-emerald-500/40 bg-emerald-500/10" : "border-[var(--border)] bg-[var(--bg-card)]"}`}>
                  <span className="text-2xl flex-shrink-0">{src.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[var(--text-primary)]">{src.name}</p>
                    <span className={`text-[10px] font-medium ${src.priority === "Essential" ? "text-red-400" : src.priority === "High" ? "text-amber-400" : "text-slate-400"}`}>
                      {src.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={src.url} target="_blank" rel="noopener noreferrer"
                      className="rounded border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
                      aria-label={`Visit ${src.name}`}
                    >
                      Visit →
                    </a>
                    <button
                      onClick={() => {
                        setCitationsDone((prev) => {
                          const next = new Set(prev);
                          if (done) next.delete(src.name); else next.add(src.name);
                          return next;
                        });
                        showToast(done ? `${src.name} unmarked` : `${src.name} marked as listed!`);
                      }}
                      className={`rounded border px-2.5 py-1.5 text-xs font-medium transition-colors ${done ? "border-emerald-500/40 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40" : "border-[var(--border)] text-[var(--text-muted)] hover:border-emerald-500/50 hover:text-emerald-400"}`}
                      aria-label={done ? `Unmark ${src.name}` : `Mark ${src.name} as listed`}
                    >
                      {done ? "✓ Listed" : "Mark Listed"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACTION PLAN / CHECKLIST ── */}
      {activeTab === "checklist" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">SEO Action Plan</h3>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">Complete these steps to improve your local search visibility</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{progressPct}%</div>
              <div className="text-xs text-[var(--text-muted)]">complete</div>
            </div>
          </div>

          <div className="h-2 rounded-full bg-[var(--bg-secondary)] mb-5">
            <div className="h-2 rounded-full bg-[#8B5CF6] transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className={`rounded-xl border p-4 flex items-start gap-3 transition-colors ${rec.done ? "border-emerald-500/30 bg-emerald-500/10 opacity-75" : "border-[var(--border)] bg-[var(--bg-card)]"}`}>
                <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mt-0.5 ${rec.done ? "bg-emerald-500/20" : "border-2 border-[var(--border)]"}`}>
                  {rec.done ? (
                    <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className={`h-2 w-2 rounded-full ${rec.impact === "high" ? "bg-red-400" : rec.impact === "medium" ? "bg-amber-400" : "bg-blue-400"}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-medium text-sm ${rec.done ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>{rec.title}</p>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${IMPACT_STYLES[rec.impact]}`}>{rec.impact}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{rec.description}</p>
                </div>
                {!rec.done && rec.href && (
                  <a href={rec.href} className="flex-shrink-0 rounded-lg bg-[#8B5CF6] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap">
                    {rec.action}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div role="alert" aria-live="polite" className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium text-white bg-emerald-600">
          {toast}
        </div>
      )}
    </div>
  );
}
