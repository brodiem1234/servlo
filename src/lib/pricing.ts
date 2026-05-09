// ACTION REQUIRED AFTER DEPLOY:
// Create new Stripe prices in Stripe dashboard at:
// Solo Monthly: $39.00 AUD/month
// Solo Annual: $390.00 AUD/year
// Team Monthly: $89.00 AUD/month
// Team Annual: $890.00 AUD/year
// Business Monthly: $179.00 AUD/month
// Business Annual: $1,790.00 AUD/year
// Then update these env vars in Vercel:
// NEXT_PUBLIC_STRIPE_SOLO_MONTHLY_PRICE_ID
// NEXT_PUBLIC_STRIPE_SOLO_ANNUAL_PRICE_ID
// NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID
// NEXT_PUBLIC_STRIPE_TEAM_ANNUAL_PRICE_ID
// NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID
// NEXT_PUBLIC_STRIPE_BUSINESS_ANNUAL_PRICE_ID

export const PLANS = {
  free: {
    name: 'Free',
    badge: 'Just browsing',
    subtitle: 'Try SERVLO at no cost',
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthlyEquiv: 0,
    jobsPerMonth: 5,
    users: 1,
    aiGenerations: 0,
    features: [
      '5 jobs per month',
      'Watermarked invoices',
      '1 user only',
      'Basic client management',
      'No AI features',
    ],
    limits: { jobs: 5, users: 1, ai: 0, invites: false },
  },
  solo: {
    name: 'Solo',
    badge: 'Just me',
    subtitle: 'Perfect for sole traders',
    monthlyPrice: 39,
    annualPrice: 390,
    annualMonthlyEquiv: 32.5,
    jobsPerMonth: Infinity,
    users: 1,
    aiGenerations: 50,
    features: [
      'Unlimited jobs',
      'Professional invoices',
      '1 user (you)',
      'Full client management',
      '50 AI generations/month',
      'Customer portal',
      'Online booking',
    ],
    limits: { jobs: Infinity, users: 1, ai: 50, invites: false },
  },
  team: {
    name: 'Team',
    badge: 'I have a team',
    subtitle: 'Unlimited team members',
    monthlyPrice: 89,
    annualPrice: 890,
    annualMonthlyEquiv: 74.17,
    jobsPerMonth: Infinity,
    users: Infinity,
    aiGenerations: 200,
    features: [
      'Unlimited jobs',
      'Unlimited team members',
      'Employee & contractor management',
      '200 AI generations/month',
      'Team scheduling',
      'Timesheets & payroll',
      'SMS automations',
    ],
    limits: { jobs: Infinity, users: Infinity, ai: 200, invites: true },
  },
  business: {
    name: 'Business',
    badge: 'Growing business',
    subtitle: 'Advanced features & integrations',
    monthlyPrice: 179,
    annualPrice: 1790,
    annualMonthlyEquiv: 149.17,
    jobsPerMonth: Infinity,
    users: Infinity,
    aiGenerations: 500,
    features: [
      'Everything in Team',
      '500 AI generations/month',
      'Xero & MYOB integration',
      'BAS prep helper',
      'Custom forms & compliance',
      'Advanced reports',
      'Priority support',
    ],
    limits: { jobs: Infinity, users: Infinity, ai: 500, invites: true },
  },
  enterprise: {
    name: 'Enterprise',
    badge: 'Large operation',
    subtitle: 'Custom pricing for large teams',
    monthlyPrice: null,
    annualPrice: null,
    annualMonthlyEquiv: null,
    jobsPerMonth: Infinity,
    users: Infinity,
    aiGenerations: 2000,
    features: [
      'Everything in Business',
      'Unlimited AI generations',
      'Custom integrations',
      'Dedicated account manager',
      'White-glove onboarding',
      'SLA guarantee',
      'Custom contracts',
    ],
    limits: { jobs: Infinity, users: Infinity, ai: 2000, invites: true },
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const EARLY_ADOPTER_DISCOUNT = {
  code: 'EARLYACCESS',
  discountPercent: 75,
  months: 3,
  plans: {
    solo: { discountedMonthly: 9.75, fullPrice: 39 },
    team: { discountedMonthly: 22.25, fullPrice: 89 },
    business: { discountedMonthly: 44.75, fullPrice: 179 },
  },
};

export function formatPlanPrice(plan: PlanKey, billing: 'monthly' | 'annual' = 'monthly'): string {
  const p = PLANS[plan];
  if (p.monthlyPrice === null) return 'Custom';
  if (p.monthlyPrice === 0) return 'Free';
  if (billing === 'annual') return `$${p.annualMonthlyEquiv?.toFixed(2)}/mo`;
  return `$${p.monthlyPrice}/mo`;
}
