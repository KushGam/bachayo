import { createClient } from '@supabase/supabase-js';

import { createSupabaseAdmin, supabaseUrl } from './supabase-admin';

export type PhoneProfile = {
  id: string;
  role: string | null;
  phone: string | null;
  full_name?: string | null;
  onboarding_completed?: boolean | null;
};

/**
 * Auth users are keyed by a synthetic email because Supabase magic links are
 * email-based. The phone itself stays on `profiles`, which is what the app reads.
 */
function phoneEmail(e164: string) {
  return `${e164.replace(/\D/g, '')}@lastbag.phone`;
}

function phoneLookupVariants(e164: string): string[] {
  const digits = e164.replace(/\D/g, '');
  const local = digits.replace(/^977/, '').replace(/^0/, '');
  const variants = [
    e164,
    `+977${local}`,
    `977${local}`,
    local,
    `0${local}`,
  ];
  return [...new Set(variants.filter(Boolean))];
}

async function findProfileByPhone(
  admin: ReturnType<typeof createSupabaseAdmin>,
  e164: string,
): Promise<PhoneProfile | null> {
  const variants = phoneLookupVariants(e164);
  const { data } = await admin
    .from('profiles')
    .select('id, role, phone, full_name, onboarding_completed')
    .in('phone', variants)
    .limit(1)
    .maybeSingle<PhoneProfile>();
  return data ?? null;
}

/**
 * Exchanges a proven-verified phone number for a real Supabase session.
 * Only ever call this after the OTP gateway has confirmed the code.
 *
 * Existing account = a profiles row for this phone (any common format) OR for
 * the auth user behind the phone email. Brand-new numbers get an auth user
 * with no profile so the app can route them into setup.
 */
export async function mintSessionForPhone(e164: string) {
  const admin = createSupabaseAdmin();
  const email = phoneEmail(e164);

  let profile = await findProfileByPhone(admin, e164);

  if (profile?.id) {
    const { data: existing } = await admin.auth.admin.getUserById(profile.id);
    if (existing?.user && !existing.user.email) {
      await admin.auth.admin.updateUserById(profile.id, {
        email,
        email_confirm: true,
      });
    }
    // Normalize stored phone to E.164 when we found a legacy format.
    if (profile.phone && profile.phone !== e164) {
      await admin.from('profiles').update({ phone: e164 }).eq('id', profile.id);
      profile = { ...profile, phone: e164 };
    }
  } else {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { phone: e164 },
    });

    // A half-finished signup can leave the auth user without a profile row;
    // that account is still usable, so only real failures should bubble up.
    if (createError && !/already been registered|already exists/i.test(createError.message)) {
      throw createError;
    }
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (linkError) throw linkError;

  const tokenHash = link?.properties?.hashed_token;
  if (!tokenHash) {
    throw new Error('Could not create session');
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const anon = createClient(supabaseUrl(), anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: verified, error: verifyError } = await anon.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  });

  if (verifyError) throw verifyError;
  if (!verified.session) {
    throw new Error('Could not create session');
  }

  const userId = verified.session.user.id;

  // Auth user existed from a prior OTP attempt — attach profile if present.
  if (!profile) {
    const { data: byId } = await admin
      .from('profiles')
      .select('id, role, phone, full_name, onboarding_completed')
      .eq('id', userId)
      .maybeSingle<PhoneProfile>();
    profile = byId ?? null;

    if (profile && (!profile.phone || profile.phone !== e164)) {
      await admin.from('profiles').update({ phone: e164 }).eq('id', userId);
      profile = { ...profile, phone: e164 };
    }
  }

  return {
    session: verified.session,
    isNewUser: !profile,
    profile: profile ?? null,
  };
}
