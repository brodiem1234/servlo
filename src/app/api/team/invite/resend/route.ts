import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    // Verify ownership and get invitation
    const { data: invitation } = await admin
      .from('team_invitations')
      .select('id, invited_email, role, business_id, personal_message')
      .eq('id', invitationId)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify this user owns the business
    const { data: business } = await admin
      .from('businesses')
      .select('id, business_name')
      .eq('id', invitation.business_id)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create new token and reset expiry
    const newToken = crypto.randomUUID();
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await admin
      .from('team_invitations')
      .update({
        invite_token: newToken,
        status: 'pending',
        expires_at: newExpiry,
      })
      .eq('id', invitationId);

    // Get owner name
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const ownerFirstName = (ownerProfile as { full_name?: string | null } | null)?.full_name?.split(' ')[0] ?? 'Someone';
    const businessName = (business as { business_name?: string | null }).business_name ?? 'your team';
    const personalMessage = (invitation as { personal_message?: string | null }).personal_message;
    const role = (invitation as { role: string }).role;
    const email = (invitation as { invited_email: string }).invited_email;

    // Resend email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${newToken}`;

    if (resend) {
      await resend.emails.send({
        from: `SERVLO <notifications@servlo.com.au>`,
        to: email,
        subject: `${ownerFirstName} re-sent your invitation to join ${businessName} on SERVLO`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#f8fafc">
            <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
              <div style="margin-bottom:24px">
                <span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#3B82F6">SERVLO</span>
              </div>
              <h2 style="color:#0f172a;margin:0 0 12px">Invitation reminder</h2>
              <p style="color:#475569;margin:0 0 8px">
                This is a reminder that <strong>${ownerFirstName}</strong> has invited you to join
                <strong>${businessName}</strong> on SERVLO as a <strong>${role}</strong>.
              </p>
              ${personalMessage ? `
              <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;border-left:4px solid #3B82F6">
                <p style="color:#475569;margin:0;font-style:italic">"${personalMessage}"</p>
              </div>
              ` : ''}
              <a href="${inviteUrl}"
                style="display:inline-block;background:#3B82F6;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin-top:16px">
                Accept Invitation →
              </a>
              <p style="color:#94a3b8;font-size:12px;margin-top:24px">This invitation expires in 7 days.</p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[team/invite/resend] error:', err);
    return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 });
  }
}
