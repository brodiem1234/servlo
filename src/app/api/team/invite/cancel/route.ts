import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitationId } = await req.json() as { invitationId?: string };
    if (!invitationId) {
      return NextResponse.json({ error: 'invitationId required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get invitation and verify ownership
    const { data: invitation } = await admin
      .from('team_invitations')
      .select('id, business_id')
      .eq('id', invitationId)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify this user owns the business
    const { data: business } = await admin
      .from('businesses')
      .select('id')
      .eq('id', invitation.business_id)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await admin
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[team/invite/cancel] error:', err);
    return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
  }
}
