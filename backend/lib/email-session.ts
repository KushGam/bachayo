import { createClient } from '@supabase/supabase-js';

import { createSupabaseAdmin, supabaseUrl } from './supabase-admin';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Creates (or recovers) an email/password auth user with email already confirmed,
 * then returns a real Supabase session. Used by the mobile app so "Confirm email"
 * in Supabase Auth does not block signup (email path has no in-app OTP).
 */
export async function mintSessionForEmailSignup(email: string, password: string) {
  const admin = createSupabaseAdmin();
  const normalized = normalizeEmail(email);

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', normalized)
    .maybeSingle();

  if (existingProfile?.id) {
    const err = new Error('Account already exists. Please log in instead.');
    (err as Error & { code?: string }).code = 'ACCOUNT_EXISTS';
    throw err;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
  });

  let userId = created.user?.id ?? null;

  if (createError) {
    if (!/already|registered|exists/i.test(createError.message)) {
      throw createError;
    }

    // Orphan auth user from a previous failed signup — confirm + set password.
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalized,
    });
    if (linkError || !link.user?.id) throw linkError ?? new Error('Could not find account');

    userId = link.user.id;

    const { data: profileById } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (profileById?.id) {
      const err = new Error('Account already exists. Please log in instead.');
      (err as Error & { code?: string }).code = 'ACCOUNT_EXISTS';
      throw err;
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (updateError) throw updateError;
  }

  if (!userId) {
    throw new Error('Could not create your account.');
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const anon = createClient(supabaseUrl(), anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (signInError || !signedIn.session?.user) {
    throw signInError ?? new Error('Could not start your session.');
  }

  return {
    session: signedIn.session,
    userId: signedIn.session.user.id,
  };
}
