import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type AdminClient = ReturnType<typeof createAdminClient>;

function normalizeEmail(email: string | null | undefined) {
  return (email ?? '').trim().toLowerCase();
}

function profileRoleForInvite(role: string) {
  // profiles.role only models app access; contractor/manager detail stays on the invitation/employee record.
  return role === 'client' ? 'client' : 'employee';
}

async function findAuthUserByEmail(admin: AdminClient, email: string) {
  const targetEmail = normalizeEmail(email);
  const perPage = 1000;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate) => normalizeEmail(candidate.email) === targetEmail);
    if (user || data.users.length < perPage) return user ?? null;
  }

  return null;
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

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
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

    const invitedEmail = normalizeEmail(inv.invited_email);
    if (!invitedEmail) {
      return NextResponse.json({ error: 'Invitation email is invalid' }, { status: 400 });
    }

    let userId: string;

    // Check if a user already exists with this email
    const existingUser = await findAuthUserByEmail(admin, invitedEmail);

    if (existingUser) {
      if (currentUser?.id !== existingUser.id) {
        return NextResponse.json(
          { error: `Please sign in as ${invitedEmail} before accepting this invitation.` },
          { status: 409 }
        );
      }
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

    if (existingUser) {
      const { data: existingProfile, error: profileLookupError } = await admin
        .from('profiles')
        .select('role, business_id')
        .eq('id', userId)
        .maybeSingle();

      if (profileLookupError) {
        console.error('[invite/accept] profile lookup error:', profileLookupError);
        return NextResponse.json({ error: 'Failed to verify account profile' }, { status: 500 });
      }

      const profile = existingProfile as { role?: string | null; business_id?: string | null } | null;
      if (profile?.role === 'owner') {
        return NextResponse.json(
          { error: 'Owner accounts cannot accept team member invitations.' },
          { status: 409 }
        );
      }
      if (profile?.business_id && profile.business_id !== inv.business_id) {
        return NextResponse.json(
          { error: 'This account already belongs to another workspace.' },
          { status: 409 }
        );
      }
    }

    // Upsert profile before consuming the invitation so a failed profile write cannot orphan the accepted invite.
    const { error: profileWriteError } = await admin
      .from('profiles')
      .upsert({
        id: userId,
        role: profileRoleForInvite(inv.role),
        business_id: inv.business_id,
        ...(name && !existingUser ? { full_name: name } : {}),
      }, { onConflict: 'id' });

    if (profileWriteError) {
      console.error('[invite/accept] profile upsert error:', profileWriteError);
      return NextResponse.json({ error: 'Failed to update account profile' }, { status: 500 });
    }

    // Mark invitation accepted
    await admin
      .from('team_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', inv.id);

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
