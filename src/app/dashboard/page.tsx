import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role === 'employee' || profile?.role === 'contractor')
    redirect('/dashboard/employee')
  if (profile?.role === 'client')
    redirect('/dashboard/client')
  if (profile?.role === 'owner')
    redirect('/dashboard/owner')
  redirect('/onboarding/complete-profile')
}
