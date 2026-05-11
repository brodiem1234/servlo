// Stripe Price IDs (CLAUDE.md canonical):
// Solo:     price_1TTiL8K1tzStyRcJQAfbuJ5n
// Team:     price_1TTiLaK1tzStyRcJNOgCeg0X
// Business: price_1TTiLyK1tzStyRcJ4BVJz0o8

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
    monthlyPrice: 29,
    annualPrice: 290,
    annualMonthlyEquiv: 24.17,
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
    monthlyPrice: 79,
    annualPrice: 790,
    annualMonthlyEquiv: 65.83,
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
    monthlyPrice: 149,
    annualPrice: 1490,
    annualMonthlyEquiv: 124.17,
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
    solo: { discountedMonthly: 7.25, fullPrice: 29 },
    team: { discountedMonthly: 19.75, fullPrice: 79 },
    business: { discountedMonthly: 37.25, fullPrice: 149 },
  },
};

export function formatPlanPrice(plan: PlanKey, billing: 'monthly' | 'annual' = 'monthly'): string {
  const p = PLANS[plan];
  if (p.monthlyPrice === null) return 'Custom';
  if (p.monthlyPrice === 0) return 'Free';
  if (billing === 'annual') return `$${p.annualMonthlyEquiv?.toFixed(2)}/mo`;
  return `$${p.monthlyPrice}/mo`;
}
