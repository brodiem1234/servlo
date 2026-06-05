"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type UpgradePlan = {
  key: string;
  name: string;
  price: string;
  priceId: string;
  features: string[];
  accent: string;
  popular?: boolean;
};

type Props = {
  plans: UpgradePlan[];
  email: string;
};

export default function UpgradePlanCards({ plans, email }: Props) {
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");

  async function startCheckout(plan: UpgradePlan) {
    if (!plan.priceId) {
      setError("Missing Stripe price id for this plan.");
      return;
    }
    if (!email) {
      setError("Missing account email. Please sign in again and retry.");
      return;
    }

    setError("");
    setLoadingPlan(plan.key);
    try {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (data.session?.access_token) {
        headers.Authorization = `Bearer ${data.session.access_token}`;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ priceId: plan.priceId, email }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start checkout");
      }
      window.location.href = payload.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout");
      setLoadingPlan("");
    }
  }

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <div className="grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`relative rounded-2xl border p-6 flex flex-col gap-4 ${
              plan.popular
                ? "border-[var(--accent-color)] shadow-lg"
                : "border-[var(--border)]"
            } bg-[var(--bg-card)]`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent-color)] px-3 py-0.5 text-[11px] font-bold text-white uppercase tracking-wide">
                Most popular
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h2>
              <p className="mt-1 text-2xl font-extrabold text-[var(--text-primary)]">{plan.price}</p>
            </div>
            <ul className="space-y-1.5 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="mt-0.5 text-green-500 shrink-0">{"\u2713"}</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => startCheckout(plan)}
              disabled={loadingPlan === plan.key}
              className="block w-full rounded-lg bg-[var(--accent-color)] py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loadingPlan === plan.key ? "Redirecting..." : `Subscribe - ${plan.price}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
