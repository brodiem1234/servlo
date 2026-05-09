import { createAdminClient } from '@/lib/supabase/admin';

export type PlanName = 'free' | 'solo' | 'team' | 'business' | 'enterprise';

export async function getUserPlan(userId: string): Promise<PlanName> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', userId)
    .single();

  if (!data) return 'free';

  // Active paid subscription — use the plan column
  const status = (data as { subscription_status?: string | null }).subscription_status;
  const plan = (data as { plan?: string | null }).plan;

  if (status === 'active' || status === 'trialing') {
    const p = plan?.toLowerCase() as PlanName | undefined;
    if (p && ['solo', 'team', 'business', 'enterprise'].includes(p)) return p;
  }

  return 'free';
}

export async function canInviteTeamMembers(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === 'team' || plan === 'business' || plan === 'enterprise';
}

export async function getJobCountThisMonth(userId: string): Promise<number> {
  const admin = createAdminClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { count } = await admin
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .gte('created_at', startOfMonth.toISOString());
  return count ?? 0;
}

export async function canCreateJob(userId: string): Promise<{ allowed: boolean; reason?: string; resetDate?: string; currentCount?: number }> {
  const plan = await getUserPlan(userId);
  if (plan !== 'free') return { allowed: true };
  const count = await getJobCountThisMonth(userId);
  if (count >= 5) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    return {
      allowed: false,
      reason: 'free_job_limit',
      resetDate: nextMonth.toISOString(),
      currentCount: count,
    };
  }
  return { allowed: true, currentCount: count };
}
