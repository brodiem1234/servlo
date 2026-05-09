import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { canInviteTeamMembers } from '@/lib/plan-limits';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check plan allows invites
    const canInvite = await canInviteTeamMembers(user.id);
    if (!canInvite) {
      return NextResponse.json({ error: 'invite_requires_team_plan' }, { status: 403 });
    }

    const body = await req.json() as {
      email?: string;
      role?: string;
      personalMessage?: string;
    };
    const { email, role = 'employee', personalMessage } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!['employee', 'contractor', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get owner's business
    const { data: business } = await admin
      .from('businesses')
      .select('id, business_name')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get owner profile for their name
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const ownerFirstName = (ownerProfile as { full_name?: string | null } | null)?.full_name?.split(' ')[0] ?? 'Someone';
    const ownerFullName = (ownerProfile as { full_name?: string | null } | null)?.full_name ?? 'Someone';

    // Insert invitation
    const { data: invitation, error: insertError } = await admin
      .from('team_invitations')
      .insert({
        business_id: business.id,
        invited_by_user_id: user.id,
        invited_email: email.toLowerCase().trim(),
        role,
        personal_message: personalMessage?.trim() || null,
      })
      .select('id, invite_token')
      .single();

    if (insertError || !invitation) {
      console.error('[team/invite] insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Send email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.invite_token}`;
    const businessName = (business as { business_name?: string | null }).business_name ?? 'your team';

    if (resend) {
      await resend.emails.send({
        from: `SERVLO <notifications@servlo.com.au>`,
        to: email,
        subject: `${ownerFirstName} invited you to join ${businessName} on SERVLO`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#f8fafc">
            <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
              <div style="margin-bottom:24px">
                <span style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#0891b2">SERVLO</span>
              </div>

              <h2 style="color:#0f172a;margin:0 0 12px;font-size:22px">You've been invited!</h2>
              <p style="color:#475569;margin:0 0 8px">
                <strong>${ownerFullName}</strong> has invited you to join
                <strong>${businessName}</strong> on SERVLO as a <strong>${role}</strong>.
              </p>

              ${personalMessage ? `
              <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;border-left:4px solid #0891b2">
                <p style="color:#475569;margin:0;font-style:italic">"${personalMessage}"</p>
              </div>
              ` : ''}

              <p style="color:#64748b;margin:16px 0 24px;font-size:14px">
                Click the button below to accept your invitation and set up your account.
              </p>

              <a href="${inviteUrl}"
                style="display:inline-block;background:#0891b2;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
                Accept Invitation →
              </a>

              <p style="color:#94a3b8;font-size:12px;margin-top:24px">
                This invitation expires in 7 days. If you didn't expect this, you can safely ignore it.
              </p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true, invitationId: invitation.id });
  } catch (err) {
    console.error('[team/invite] error:', err);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
