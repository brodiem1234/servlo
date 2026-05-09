import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function normalizeEmail(email: string | null | undefined) {
  return (email ?? '').trim().toLowerCase();
}

function profileRoleForInvite(role: string) {
  // profiles.role only gates app dashboards; contractor details live on employees.role.
  return role === 'client' ? 'client' : 'employee';
}

function employeeRoleForInvite(role: string) {
  return role === 'contractor' ? 'contractor' : 'employee';
}

function isDuplicateEmailError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? '';
  return message.includes('already') || message.includes('registered') || message.includes('exists');
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
    let createdUser = false;
    const invitedEmail = normalizeEmail(inv.invited_email);

    const supabase = await createClient();
    const {
      data: { user: sessionUser }
    } = await supabase.auth.getUser();

    if (sessionUser) {
      if (normalizeEmail(sessionUser.email) !== invitedEmail) {
        return NextResponse.json(
          { error: `Sign in as ${inv.invited_email} to accept this invitation.` },
          { status: 403 }
        );
      }
      userId = sessionUser.id;
    } else {
      // New signup — name and password required
      if (!name || !password) {
        return NextResponse.json(
          { error: 'Sign in to the invited account, or enter your name and password to create it.' },
          { status: 400 }
        );
      }
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: invitedEmail,
        password,
        email_confirm: true,
        user_metadata: { name, full_name: name, role: inv.role },
      });
      if (createError || !newUser.user) {
        if (isDuplicateEmailError(createError)) {
          return NextResponse.json(
            { error: `An account already exists for ${inv.invited_email}. Sign in as that user to accept this invitation.` },
            { status: 409 }
          );
        }
        console.error('[invite/accept] createUser error:', createError);
        return NextResponse.json({ error: createError?.message ?? 'Failed to create account' }, { status: 500 });
      }
      userId = newUser.user.id;
      createdUser = true;
    }

    const { data: ownedBusiness } = await admin
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (ownedBusiness) {
      return NextResponse.json(
        { error: 'Owner accounts cannot accept team invitations. Use a separate employee account.' },
        { status: 409 }
      );
    }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: userId,
        role: profileRoleForInvite(inv.role),
        business_id: inv.business_id,
        ...(name && createdUser ? { full_name: name } : {}),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('[invite/accept] profile upsert error:', profileError);
      if (createdUser) {
        await admin.auth.admin.deleteUser(userId).catch((deleteError) => {
          console.warn('[invite/accept] rollback deleteUser failed:', deleteError);
        });
      }
      return NextResponse.json({ error: 'Failed to update invited user profile' }, { status: 500 });
    }

    const { data: businessRow } = await admin
      .from('businesses')
      .select('owner_id')
      .eq('id', inv.business_id)
      .maybeSingle();
    const ownerId = (businessRow as { owner_id?: string } | null)?.owner_id ?? inv.invited_by_user_id;

    const { data: existingEmployee } = await admin
      .from('employees')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('email', invitedEmail)
      .maybeSingle();

    const employeeResult = existingEmployee
      ? await admin
          .from('employees')
          .update({ email: invitedEmail, role: employeeRoleForInvite(inv.role) })
          .eq('id', existingEmployee.id)
      : await admin.from('employees').insert({
          owner_id: ownerId,
          full_name: name || inv.invited_email.split('@')[0],
          email: invitedEmail,
          role: employeeRoleForInvite(inv.role)
        });

    if (employeeResult.error) {
      console.error('[invite/accept] employee upsert error:', employeeResult.error);
      return NextResponse.json({ error: 'Failed to add invited user to the team' }, { status: 500 });
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
              <span style="font-size:24px;font-weight:900;letter-spacing:-1px;color:#3B82F6">SERVLO</span>
              <h2 style="color:#0f172a;margin:16px 0 8px">Team invitation accepted</h2>
              <p style="color:#475569">
                <strong>${displayName}</strong> has accepted your invitation and joined your team as a <strong>${inv.role}</strong>.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/owner/team"
                style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
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
