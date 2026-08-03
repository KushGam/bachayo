import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseAdmin, supabaseUrl } from '@/lib/supabase-admin';

function normalizeNpPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.replace(/^977/, '').replace(/^0/, '');
  return local.slice(-10);
}

function phoneVariants(local: string) {
  return [...new Set([`+977${local}`, `977${local}`, local, `0${local}`])];
}

/**
 * Phone + password login for the SAME account as email + password.
 * Looks up profiles.phone → auth user email, then verifies password.
 * Covers email accounts that later added a phone, and pure phone accounts.
 */
export async function POST(request: NextRequest) {
  let phone: unknown;
  let password: unknown;

  try {
    ({ phone, password } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof phone !== 'string' || !phone.trim()) {
    return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
  }
  if (typeof password !== 'string' || !password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  const local = normalizeNpPhone(phone);
  if (!/^(97|98)\d{8}$/.test(local)) {
    return NextResponse.json({ error: 'Enter a valid Nepal mobile number' }, { status: 400 });
  }

  const genericError = 'Wrong phone number or password. Please try again.';

  try {
    const admin = createSupabaseAdmin();
    const variants = phoneVariants(local);

    const { data: profiles } = await admin
      .from('profiles')
      .select('id')
      .in('phone', variants)
      .limit(1);

    const profile = profiles?.[0];
    if (!profile?.id) {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    const { data: authData, error: authLookupError } = await admin.auth.admin.getUserById(
      profile.id,
    );
    if (authLookupError || !authData.user?.email) {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      return NextResponse.json({ error: 'Auth is not configured' }, { status: 500 });
    }

    const anon = createClient(supabaseUrl(), anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signedIn, error: signError } = await anon.auth.signInWithPassword({
      email: authData.user.email,
      password,
    });

    if (signError || !signedIn.session || !signedIn.user) {
      return NextResponse.json({ error: genericError }, { status: 401 });
    }

    // Keep profile phone normalized to E.164 for future lookups.
    await admin
      .from('profiles')
      .update({ phone: `+977${local}` })
      .eq('id', profile.id);

    return NextResponse.json({
      success: true,
      user_id: signedIn.user.id,
      access_token: signedIn.session.access_token,
      refresh_token: signedIn.session.refresh_token,
    });
  } catch (error) {
    console.error('[phone-password] failed:', error);
    return NextResponse.json({ error: 'Could not sign in. Please try again.' }, { status: 500 });
  }
}
