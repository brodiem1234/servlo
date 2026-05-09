"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "👋 I'm your AI marketing coach for Australian trades businesses! I can help you with: growing your Google reviews, writing better ad copy, targeting the right suburbs, seasonal promotions, and more. What would you like to work on today?",
};

const QUICK_PROMPTS = [
  "How do I get more Google reviews?",
  "What's the best time to run ads?",
  "Write me a Facebook post",
  "How do I beat my local competitors?",
];

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  borderColor: "var(--border)",
};

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

export default function AiCoachPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/marketing-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, context: {} }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply = data.reply ?? "Sorry, I couldn't process that. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: reply,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <>
      <title>SERVLO GROW — AI Marketing Coach</title>
      <section className="flex h-[calc(100vh-10rem)] flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              AI Marketing Coach
            </h1>
            <Sparkles size={20} style={{ color: "#8B5CF6" }} />
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
            style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
          >
            Powered by Claude
          </span>
        </div>

        {/* Chat window */}
        <div
          className="flex flex-1 flex-col overflow-hidden rounded-xl border"
          style={cardStyle}
        >
          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgb(139 92 246 / 0.2)" }}
                  >
                    <Sparkles size={13} style={{ color: "#A78BFA" }} />
                  </div>
                )}
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                          background: "#8B5CF6",
                          color: "#fff",
                          borderBottomRightRadius: 4,
                        }
                      : {
                          background: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                          borderBottomLeftRadius: 4,
                        }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgb(139 92 246 / 0.2)" }}
                >
                  <Sparkles size={13} style={{ color: "#A78BFA" }} />
                </div>
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-muted)",
                    borderBottomLeftRadius: 4,
                  }}
                >
                  <Spinner /> Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div
            className="border-t px-4 py-2"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-all disabled:opacity-40"
                  style={{
                    background: "rgb(139 92 246 / 0.12)",
                    color: "#C4B5FD",
                    border: "1px solid rgb(139 92 246 / 0.25)",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input bar */}
          <div
            className="flex items-end gap-2 border-t px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
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
    </>
  );
}
