export type CorePlan = "solo" | "team" | "business";

const CORE_PLANS: readonly CorePlan[] = ["solo", "team", "business"];

export function isCorePlan(value: string | null | undefined): value is CorePlan {
  return CORE_PLANS.includes(String(value ?? "").toLowerCase() as CorePlan);
}

export function normalizeCorePlan(value: string): CorePlan | null {
  const plan = value.trim().toLowerCase();
  return isCorePlan(plan) ? plan : null;
}

export function getPlanFromPriceId(
  priceId: string | null | undefined,
  env: Record<string, string | undefined> = process.env
): CorePlan | "trial" {
  if (!priceId) return "trial";

  const priceIdsByPlan: Record<CorePlan, Array<string | undefined>> = {
    solo: [env.STRIPE_SOLO_PRICE_ID, env.STRIPE_SOLO_ANNUAL_PRICE_ID],
    team: [env.STRIPE_TEAM_PRICE_ID, env.STRIPE_TEAM_ANNUAL_PRICE_ID],
    business: [env.STRIPE_BUSINESS_PRICE_ID, env.STRIPE_BUSINESS_ANNUAL_PRICE_ID],
  };

  for (const plan of CORE_PLANS) {
    if (priceIdsByPlan[plan].includes(priceId)) return plan;
  }

  return "trial";
}

type PaidSubscriptionStateInput = {
  customerId: string;
  subscriptionId: string;
  selectedProductCombo: string;
  selectedPlanTier: CorePlan;
  startedAtIso: string;
  cardLast4: string | null;
  cardBrand: string | null;
};

export function buildPaidSubscriptionProfileUpdate(input: PaidSubscriptionStateInput) {
  return {
    stripe_customer_id: input.customerId,
    stripe_subscription_id: input.subscriptionId,
    selected_products: input.selectedProductCombo,
    plan_tier: input.selectedPlanTier,
    trial_started_at: input.startedAtIso,
    card_last4: input.cardLast4,
    card_brand: input.cardBrand,
    subscription_status: "active",
    plan: input.selectedPlanTier,
    subscription_tier: input.selectedPlanTier,
    trial_expired_at: null,
  };
}

export function buildPaidSubscriptionBusinessUpdate(input: Pick<PaidSubscriptionStateInput, "customerId" | "subscriptionId" | "selectedPlanTier">) {
  return {
    stripe_customer_id: input.customerId,
    stripe_subscription_id: input.subscriptionId,
    plan: input.selectedPlanTier,
    subscription_status: "active",
  };
}
