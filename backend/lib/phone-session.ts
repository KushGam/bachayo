import { createClient } from '@supabase/supabase-js';

import { createSupabaseAdmin, supabaseUrl } from './supabase-admin';

export type PhoneProfile = {
  id: string;
  role: string | null;
  phone: string | null;
};

/**
 * Auth users are keyed by a synthetic email because Supabase magic links are
 * email-based. The phone itself stays on `profiles`, which is what the app reads.
 */
function phoneEmail(e164: string) {
  return `${e164.replace(/\D/g, '')}@lastbag.phone`;
}

/**
 * Exchanges a proven-verified phone number for a real Supabase session.
 * Only ever call this after the OTP gateway has confirmed the code.
 */
export async function mintSessionForPhone(e164: string) {
  const admin = createSupabaseAdmin();
  const email = phoneEmail(e164);

  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, phone')
    .eq('phone', e164)
    .maybeSingle<PhoneProfile>();

  if (profile?.id) {
    const { data: existing } = await admin.auth.admin.getUserById(profile.id);
    if (existing?.user && !existing.user.email) {
      await admin.auth.admin.updateUserById(profile.id, {
        email,
        email_confirm: true,
      });
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

  return {
    session: verified.session,
    isNewUser: !profile,
    profile: profile ?? null,
  };
}
