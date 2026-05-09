import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type AdminClient = ReturnType<typeof createAdminClient>;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function employeeRosterRole(inviteRole: string) {
  return inviteRole === 'contractor' ? 'contractor' : 'employee';
}

async function findAuthUserByEmail(admin: AdminClient, email: string) {
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((u) => normalizeEmail(u.email ?? '') === email);
    if (user) return user;
    if (data.users.length < perPage) return null;
  }
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
    const supabase = await createClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

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
    const invitedEmail = normalizeEmail(inv.invited_email);

    if (inv.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is no longer valid' }, { status: 410 });
    }

    if (new Date(inv.expires_at) < new Date()) {
      await admin.from('team_invitations').update({ status: 'expired' }).eq('id', inv.id);
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    let userId: string;

    // Check if a user already exists with this email
    const existingUser = await findAuthUserByEmail(admin, invitedEmail);

    if (existingUser) {
      if (
        !sessionUser ||
        sessionUser.id !== existingUser.id ||
        normalizeEmail(sessionUser.email ?? '') !== invitedEmail
      ) {
        return NextResponse.json(
          { error: 'Sign in with the invited email before accepting this invitation.' },
          { status: 403 }
        );
      }
      userId = existingUser.id;
    } else {
      // New signup — name and password required
      if (!name || !password) {
        return NextResponse.json({ error: 'name and password required for new accounts' }, { status: 400 });
      }
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: invitedEmail,
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

    const { data: business, error: businessError } = await admin
      .from('businesses')
      .select('owner_id')
      .eq('id', inv.business_id)
      .maybeSingle();

    if (businessError || !business) {
      console.error('[invite/accept] business lookup failed:', businessError);
      return NextResponse.json({ error: 'Invitation business not found' }, { status: 404 });
    }

    const ownerId = (business as { owner_id: string }).owner_id;
    const displayNameSeed =
      name?.trim() ||
      String(existingUser?.user_metadata?.full_name ?? existingUser?.user_metadata?.name ?? '').trim() ||
      invitedEmail.split('@')[0];

    const { data: currentProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if ((currentProfile as { role?: string } | null)?.role === 'owner') {
      return NextResponse.json(
        { error: 'Owner accounts cannot be converted into team member accounts.' },
        { status: 409 }
      );
    }

    // Profiles only support owner/client/employee; contractor is stored on the roster row.
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: userId,
        email: invitedEmail,
        full_name: displayNameSeed,
        role: 'employee',
        business_id: inv.business_id,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('[invite/accept] profile upsert error:', profileError);
      return NextResponse.json({ error: 'Failed to update account profile' }, { status: 500 });
    }

    const rosterRole = employeeRosterRole(inv.role);
    const { data: existingEmployee, error: employeeLookupError } = await admin
      .from('employees')
      .select('id')
      .eq('owner_id', ownerId)
      .ilike('email', invitedEmail)
      .limit(1)
      .maybeSingle();

    if (employeeLookupError) {
      console.error('[invite/accept] employee lookup error:', employeeLookupError);
      return NextResponse.json({ error: 'Failed to update team roster' }, { status: 500 });
    }

    const employeePayload = {
      owner_id: ownerId,
      full_name: displayNameSeed,
      email: invitedEmail,
      role: rosterRole,
    };

    const employeeWrite = existingEmployee
      ? await admin
          .from('employees')
          .update(employeePayload)
          .eq('id', (existingEmployee as { id: string }).id)
      : await admin.from('employees').insert(employeePayload);

    if (employeeWrite.error) {
      console.error('[invite/accept] employee write error:', employeeWrite.error);
      return NextResponse.json({ error: 'Failed to update team roster' }, { status: 500 });
    }

    // Mark invitation accepted
    const { error: invitationUpdateError } = await admin
      .from('team_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', inv.id);

    if (invitationUpdateError) {
      console.error('[invite/accept] invitation update error:', invitationUpdateError);
      return NextResponse.json({ error: 'Failed to mark invitation accepted' }, { status: 500 });
    }

    // Get display name for notification
    const { data: acceptedProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const displayName = (acceptedProfile as { full_name?: string | null } | null)?.full_name
      ?? name
      ?? invitedEmail;

    // Get owner info for notification
    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', ownerId)
      .maybeSingle();

    const ownerEmail = (await admin.auth.admin.getUserById(ownerId)).data.user?.email;

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
        owner_id: ownerId,
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
