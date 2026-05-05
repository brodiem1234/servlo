"use client";

import { useState } from "react";

type Plan = {
  key: "solo" | "team" | "business";
  label: string;
  price: string;
  description: string;
  priceId: string;
};

type Props = {
  email: string;
  currentPlan: string;
  success: boolean;
  priceIds: {
    solo: string;
    team: string;
    business: string;
  };
};

export default function SubscriptionCards({ email, currentPlan, success, priceIds }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<string>("");
  const [error, setError] = useState<string>("");
  const plans: Plan[] = [
    {
      key: "solo",
      label: "Solo",
      price: "$29/mo",
      description: "1 user, jobs, clients, invoices",
      priceId: priceIds.solo
    },
    {
      key: "team",
      label: "Team",
      price: "$79/mo",
      description: "Up to 5 employees, all Solo features",
      priceId: priceIds.team
    },
    {
      key: "business",
      label: "Business",
      price: "$179/mo",
      description: "Up to 20 employees, all features",
      priceId: priceIds.business
    }
  ];

  const startCheckout = async (priceId: string, planKey: string) => {
    if (!priceId) {
      setError("Missing Stripe price id for this plan.");
      return;
    }
    try {
      setError("");
      setLoadingPlan(planKey);
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, email })
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start checkout");
      setLoadingPlan("");
    }
  };

  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1e3a5f]">Subscription</h2>
      {success ? (
        <p className="mt-2 rounded bg-green-50 px-3 py-2 text-sm text-[#22c55e]">
          Subscription checkout completed successfully.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan.toLowerCase() === plan.key;
          return (
            <div
              key={plan.key}
              className={`rounded-lg border p-4 ${
                isCurrent ? "border-[#0db8c8] bg-cyan-50" : "border-slate-200"
              }`}
            >
              <p className="text-lg font-semibold text-[#1e3a5f]">{plan.label}</p>
              <p className="mt-1 text-xl font-bold">{plan.price}</p>
              <p className="mt-2 text-sm text-[#64748b]">{plan.description}</p>
              {isCurrent ? (
                <p className="mt-3 text-sm font-medium text-[#0db8c8]">Current plan</p>
              ) : (
                <button
                  type="button"
                  onClick={() => startCheckout(plan.priceId, plan.key)}
                  disabled={loadingPlan === plan.key}
                  className="mt-3 rounded bg-[#0db8c8] px-4 py-2 text-sm text-white hover:bg-[#0a9dab] disabled:opacity-60"
                >
                  {loadingPlan === plan.key ? "Redirecting..." : "Upgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

