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
 * Synthetic email used only for phone-only accounts (no real email signup).
 * Email accounts that later add a phone keep their real auth email.
 */
function phoneEmail(e164: string) {
  return `${e164.replace(/\D/g, '')}@lastbag.phone`;
}

function phoneLookupVariants(e164: string): string[] {
  const digits = e164.replace(/\D/g, '');
  const local = digits.replace(/^977/, '').replace(/^0/, '');
  const variants = [e164, `+977${local}`, `977${local}`, local, `0${local}`];
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
    .limit(1);
  return (data?.[0] as PhoneProfile | undefined) ?? null;
}

async function mintSessionForAuthEmail(email: string) {
  const admin = createSupabaseAdmin();
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (linkError) throw linkError;

  const tokenHash = link?.properties?.hashed_token;
  if (!tokenHash) throw new Error('Could not create session');

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
  if (!verified.session) throw new Error('Could not create session');

  return verified.session;
}

/**
 * After NepalOTP verifies the SMS code, open the SAME account that owns this
 * phone on profiles (email signup that added a phone, or a phone-only account).
 */
export async function mintSessionForPhone(e164: string) {
  const admin = createSupabaseAdmin();
  const syntheticEmail = phoneEmail(e164);

  let profile = await findProfileByPhone(admin, e164);
  let sessionEmail = syntheticEmail;

  if (profile?.id) {
    const { data: existing } = await admin.auth.admin.getUserById(profile.id);
    if (existing?.user?.email) {
      // Email (or phone) account that already owns this number — sign into THAT user.
      sessionEmail = existing.user.email;
    } else if (existing?.user) {
      await admin.auth.admin.updateUserById(profile.id, {
        email: syntheticEmail,
        email_confirm: true,
      });
      sessionEmail = syntheticEmail;
    }

    if (profile.phone !== e164) {
      await admin.from('profiles').update({ phone: e164 }).eq('id', profile.id);
      profile = { ...profile, phone: e164 };
    }
  } else {
    // Brand-new phone — create synthetic auth user if needed.
    const { error: createError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: { phone: e164 },
    });

    if (createError && !/already been registered|already exists/i.test(createError.message)) {
      throw createError;
    }
    sessionEmail = syntheticEmail;
  }

  const session = await mintSessionForAuthEmail(sessionEmail);
  const userId = session.user.id;

  // Safety: session must match the profile we found.
  if (profile && profile.id !== userId) {
    console.error('[phone-session] session/profile mismatch', {
      profileId: profile.id,
      sessionUserId: userId,
      sessionEmail,
    });
    throw new Error('Could not open the account for this phone number');
  }

  if (!profile) {
    const { data: byId } = await admin
      .from('profiles')
      .select('id, role, phone, full_name, onboarding_completed')
      .eq('id', userId)
      .maybeSingle<PhoneProfile>();
    profile = byId ?? null;

    if (profile && profile.phone !== e164) {
      await admin.from('profiles').update({ phone: e164 }).eq('id', userId);
      profile = { ...profile, phone: e164 };
    }
  }

  return {
    session,
    isNewUser: !profile,
    profile: profile ?? null,
  };
}
