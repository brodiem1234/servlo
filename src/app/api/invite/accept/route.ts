import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type ProfileRole = 'employee' | 'owner' | 'client';

function profileRoleForInvitation() {
  // Team invite roles (employee/contractor/manager) all land on the employee dashboard today.
  return 'employee' satisfies ProfileRole;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      token?: string;
      name?: string;
      password?: string;
    };
    const { token, name, password } = body;

    if (!token) {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get invitation
    const { data: invitation } = await admin
      .from('team_invitations')
      .select('id, business_id, invited_email, role, status, expires_at, invited_by_user_id')
      .eq('invite_token', token)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or already used' }, { status: 404 });
    }

    const inv = invitation as {
      id: string;
      business_id: string;
      invited_email: string;
      role: string;
      status: string;
      expires_at: string;
      invited_by_user_id: string;
    };

    if (inv.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is no longer valid' }, { status: 410 });
    }

    if (new Date(inv.expires_at) < new Date()) {
      await admin.from('team_invitations').update({ status: 'expired' }).eq('id', inv.id);
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    let userId: string;

    // Check if a user already exists with this email
    const { data: { users: existingUsers } } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers.find((u) => u.email === inv.invited_email);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // New signup — name and password required
      if (!name || !password) {
        return NextResponse.json({ error: 'name and password required for new accounts' }, { status: 400 });
      }
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: inv.invited_email,
        password,
        email_confirm: true,
        user_metadata: { name, full_name: name, role: inv.role },
      });
      if (createError || !newUser.user) {
        console.error('[invite/accept] createUser error:', createError);
        return NextResponse.json({ error: createError?.message ?? 'Failed to create account' }, { status: 500 });
      }
      userId = newUser.user.id;
    }

    const { data: currentProfile, error: currentProfileError } = await admin
      .from('profiles')
      .select('role, business_id')
      .eq('id', userId)
      .maybeSingle();

    if (currentProfileError) {
      console.error('[invite/accept] profile lookup error:', currentProfileError);
      return NextResponse.json({ error: 'Failed to verify account profile' }, { status: 500 });
    }

    const profile = currentProfile as { role?: ProfileRole | null; business_id?: string | null } | null;
    if (profile?.role === 'owner') {
      return NextResponse.json(
        { error: 'Owner accounts cannot accept team invitations. Use a different email address.' },
        { status: 409 }
      );
    }

    if (profile?.business_id && profile.business_id !== inv.business_id) {
      return NextResponse.json(
        { error: 'This account already belongs to another workspace. Use a different email address.' },
        { status: 409 }
      );
    }

    const profilePayload: Record<string, unknown> = {
      id: userId,
      role: profileRoleForInvitation(),
      business_id: inv.business_id,
    };
    if (name && !existingUser) {
      profilePayload.full_name = name;
    }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileError) {
      console.error('[invite/accept] profile upsert error:', profileError);
      return NextResponse.json({ error: 'Failed to update account profile' }, { status: 500 });
    }

    // Mark invitation accepted
    const { error: acceptError } = await admin
      .from('team_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', inv.id)
      .eq('status', 'pending');

    if (acceptError) {
      console.error('[invite/accept] invitation update error:', acceptError);
      return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
    }

    // Get display name for notification
    const { data: acceptedProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const displayName = (acceptedProfile as { full_name?: string | null } | null)?.full_name
      ?? name
      ?? inv.invited_email;

    // Get owner info for notification
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', inv.invited_by_user_id)
      .maybeSingle();

    const ownerEmail = (await admin.auth.admin.getUserById(inv.invited_by_user_id)).data.user?.email;

    // Send owner notification email
    if (resend && ownerEmail) {
      await resend.emails.send({
        from: `SERVLO <notifications@servlo.com.au>`,
        to: ownerEmail,
        subject: `${displayName} accepted your invitation`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
            <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
              <span style="font-size:24px;font-weight:900;letter-spacing:-1px;color:#0891b2">SERVLO</span>
              <h2 style="color:#0f172a;margin:16px 0 8px">Team invitation accepted</h2>
              <p style="color:#475569">
                <strong>${displayName}</strong> has accepted your invitation and joined your team as a <strong>${inv.role}</strong>.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/owner/team"
                style="display:inline-block;background:#0891b2;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
                View your team →
              </a>
            </div>
          </div>
        `,
      });
    }

    // Insert in-app notification for owner
    try {
      await admin.from('notifications').insert({
        owner_id: inv.invited_by_user_id,
        type: 'system',
        title: `${displayName} joined your team`,
        body: `${displayName} accepted your invitation as ${inv.role}.`,
        action_url: '/dashboard/owner/team',
        read: false,
      });
    } catch (e) {
      console.warn('[invite/accept] notification insert failed:', e);
    }

    return NextResponse.json({ ok: true, role: inv.role });
  } catch (err) {
    console.error('[invite/accept] error:', err);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
