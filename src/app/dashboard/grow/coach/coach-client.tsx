"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Zap, MessageSquare, BarChart3, Star } from "lucide-react";
import { useRouter } from "next/navigation";

export type BusinessContext = {
  businessName: string;
  suburb: string;
  state: string;
  phone: string | null;
  jobsThisMonth: number;
  totalRevenue: number;
  unpaidInvoices: number;
  reviewCount: number;
  avgRating: number | null;
  topServiceType: string | null;
};

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  actions?: Array<{ label: string; href: string }>;
}

function buildWelcome(ctx: BusinessContext): Message {
  const revenueStr = ctx.totalRevenue > 0 ? ` · $${ctx.totalRevenue.toLocaleString("en-AU")} revenue tracked` : "";
  const reviewStr = ctx.reviewCount > 0 ? ` · ${ctx.reviewCount} review${ctx.reviewCount !== 1 ? "s" : ""}${ctx.avgRating ? ` (${ctx.avgRating.toFixed(1)}★)` : ""}` : "";
  return {
    id: "welcome",
    role: "assistant",
    content: `👋 Hey ${ctx.businessName}! I'm your AI marketing coach.\n\nI can see you're based in ${ctx.suburb}, ${ctx.state}${ctx.jobsThisMonth > 0 ? ` with ${ctx.jobsThisMonth} job${ctx.jobsThisMonth !== 1 ? "s" : ""} this month` : ""}${revenueStr}${reviewStr}.\n\nI use your real business data to give you personalised, actionable advice — not generic tips. What would you like to work on?`,
    actions: [],
  };
}

const QUICK_PROMPTS = [
  "How do I get more Google reviews?",
  "Write me a Facebook post for this week",
  "What ads should I run right now?",
  "How do I beat my local competitors?",
  "Help me grow my referral pipeline",
  "What's my biggest growth opportunity?",
];

function detectActions(content: string, router: ReturnType<typeof useRouter>): Array<{ label: string; href: string }> {
  void router; // used in caller
  const actions: Array<{ label: string; href: string }> = [];
  const lower = content.toLowerCase();
  if (lower.includes("facebook post") || lower.includes("instagram") || lower.includes("social media post")) {
    actions.push({ label: "📅 Open Social Calendar", href: "/dashboard/grow/social" });
  }
  if (lower.includes("ad") && (lower.includes("campaign") || lower.includes("run") || lower.includes("facebook ad") || lower.includes("google ad"))) {
    actions.push({ label: "🎯 Create Ad Campaign", href: "/dashboard/grow/ads" });
  }
  if (lower.includes("review") || lower.includes("google review")) {
    actions.push({ label: "⭐ Review Hub", href: "/dashboard/grow/reviews" });
  }
  if (lower.includes("email") && (lower.includes("campaign") || lower.includes("newsletter") || lower.includes("follow"))) {
    actions.push({ label: "📧 Email Marketing", href: "/dashboard/grow/email" });
  }
  if (lower.includes("referral")) {
    actions.push({ label: "🔗 Referral Program", href: "/dashboard/grow/referrals" });
  }
  return actions.slice(0, 2);
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function MessageContent({ content }: { content: string }) {
  // Render newlines as line breaks, bold **text**
  const parts = content.split(/\n/);
  return (
    <span>
      {parts.map((line, i) => {
        const boldParts = line.split(/\*\*([^*]+)\*\*/g);
        return (
          <React.Fragment key={i}>
            {boldParts.map((p, j) =>
              j % 2 === 1 ? <strong key={j}>{p}</strong> : <span key={j}>{p}</span>
            )}
            {i < parts.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </span>
  );
}

export default function CoachClient({ ctx }: { ctx: BusinessContext }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([buildWelcome(ctx)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Build conversation history (last 10 messages for context)
    const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/ai/marketing-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
          context: {
            businessName: ctx.businessName,
            suburb: ctx.suburb,
            state: ctx.state,
            phone: ctx.phone,
            jobsThisMonth: ctx.jobsThisMonth,
            totalRevenue: ctx.totalRevenue,
            unpaidInvoices: ctx.unpaidInvoices,
            reviewCount: ctx.reviewCount,
            avgRating: ctx.avgRating,
            topServiceType: ctx.topServiceType,
          },
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply = data.reply ?? "Sorry, I couldn't process that. Please try again.";
      const actions = detectActions(reply, router);
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "assistant", content: reply, actions },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `ai-err-${Date.now()}`, role: "assistant", content: "Sorry, something went wrong. Please try again in a moment.", actions: [] },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, ctx, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <section className="flex h-[calc(100vh-10rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            AI Marketing Coach
          </h1>
          <Sparkles size={20} style={{ color: "#8B5CF6" }} />
        </div>

        {/* Business context pills */}
        <div className="flex flex-wrap gap-2">
          {ctx.jobsThisMonth > 0 && (
            <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "rgb(59 130 246 / 0.12)", color: "rgb(96 165 250)", border: "1px solid rgb(59 130 246 / 0.2)" }}>
              <BarChart3 size={10} />
              {ctx.jobsThisMonth} jobs this month
            </span>
          )}
          {ctx.reviewCount > 0 && (
            <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "rgb(245 158 11 / 0.12)", color: "rgb(251 191 36)", border: "1px solid rgb(245 158 11 / 0.2)" }}>
              <Star size={10} />
              {ctx.reviewCount} review{ctx.reviewCount !== 1 ? "s" : ""}
              {ctx.avgRating ? ` · ${ctx.avgRating.toFixed(1)}★` : ""}
            </span>
          )}
          {ctx.unpaidInvoices > 0 && (
            <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "rgb(239 68 68 / 0.12)", color: "rgb(248 113 113)", border: "1px solid rgb(239 68 68 / 0.2)" }}>
              <MessageSquare size={10} />
              ${ctx.unpaidInvoices.toLocaleString("en-AU")} unpaid
            </span>
          )}
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
            style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}>
            Powered by Claude
          </span>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgb(139 92 246 / 0.2)" }}>
                  <Sparkles size={13} style={{ color: "#A78BFA" }} />
                </div>
              )}
              <div className="max-w-[80%] space-y-2">
                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={msg.role === "user"
                    ? { background: "#8B5CF6", color: "#fff", borderBottomRightRadius: 4 }
                    : { background: "var(--bg-secondary)", color: "var(--text-secondary)", borderBottomLeftRadius: 4 }}>
                  <MessageContent content={msg.content} />
                </div>
                {/* Action buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-1">
                    {msg.actions.map((action) => (
                      <button
                        key={action.href}
                        type="button"
                        onClick={() => router.push(action.href)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-90"
                        style={{
                          background: "rgb(139 92 246 / 0.15)",
                          color: "#C4B5FD",
                          border: "1px solid rgb(139 92 246 / 0.3)",
                        }}
                      >
                        <Zap size={10} />
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgb(139 92 246 / 0.2)" }}>
                <Sparkles size={13} style={{ color: "#A78BFA" }} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
                style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", borderBottomLeftRadius: 4 }}>
                <Spinner /> Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="border-t px-4 py-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" disabled={loading}
                onClick={() => void sendMessage(prompt)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-all disabled:opacity-40"
                style={{ background: "rgb(139 92 246 / 0.12)", color: "#C4B5FD", border: "1px solid rgb(139 92 246 / 0.25)" }}>
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your marketing…"
            disabled={loading}
            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 disabled:opacity-50"
            style={{
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.3)",
              color: "#e2e8f0",
              maxHeight: 120,
            }}
          />
          <button
            type="button"
            disabled={!input.trim() || loading}
            onClick={() => void sendMessage(input)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-opacity disabled:opacity-40"
            style={{ background: "#8B5CF6" }}
          >
            {loading ? <Spinner /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </section>
  );
}
