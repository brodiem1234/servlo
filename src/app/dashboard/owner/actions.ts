'use server';
import { createClient } from '@/lib/supabase/server';

export async function markOnboardingComplete() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true } as Record<string, unknown>)
      .eq('id', user.id);
  }
}

export async function resetOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ onboarding_completed: false } as Record<string, unknown>)
      .eq('id', user.id);
  }
}
