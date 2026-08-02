import crypto from 'crypto';

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

import { createSupabaseAdmin, supabaseUrl } from './supabase-admin';

const OTP_LENGTH = 8;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function requireSecret() {
  const secret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('Missing INTERNAL_SECRET for email OTP encryption');
  }
  return secret;
}

function encryptionKey() {
  return crypto.createHash('sha256').update(requireSecret()).digest();
}

export function encryptSignupPassword(password: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function decryptSignupPassword(payload: string) {
  const buf = Buffer.from(payload, 'base64url');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function hashOtpCode(email: string, code: string) {
  return crypto
    .createHash('sha256')
    .update(`${normalizeEmail(email)}:${code}:${requireSecret()}`)
    .digest('hex');
}

export function generateOtpCode() {
  const max = 10 ** OTP_LENGTH;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(OTP_LENGTH, '0');
}

async function sendOtpEmail(email: string, code: string) {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');

  if (!gmailUser || !gmailPass) {
    throw new Error('Email delivery is not configured');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"LastBag" <${gmailUser}>`,
    to: email,
    subject: `${code} is your LastBag verification code`,
    text: `Your LastBag verification code is ${code}.\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `
      <p style="font-family:sans-serif;font-size:16px;color:#1a1a1a">
        Your LastBag verification code is
      </p>
      <p style="font-family:monospace;font-size:32px;letter-spacing:6px;font-weight:700;color:#1a1a1a">
        ${code}
      </p>
      <p style="font-family:sans-serif;font-size:14px;color:#666">
        Expires in 10 minutes. If you did not request this, you can ignore this email.
      </p>
    `,
  });
}

async function findAuthUserByEmail(email: string) {
  const admin = createSupabaseAdmin();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

  const response = await fetch(
    `${supabaseUrl()}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  );

  if (response.ok) {
    const payload = (await response.json()) as {
      users?: Array<{
        id: string;
        email?: string;
        email_confirmed_at?: string | null;
      }>;
      id?: string;
      email?: string;
      email_confirmed_at?: string | null;
    };

    if (Array.isArray(payload.users)) {
      return (
        payload.users.find((u) => (u.email || '').toLowerCase() === email) ?? null
      );
    }

    if (payload.id && (payload.email || '').toLowerCase() === email) {
      return payload;
    }
  }

  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, per_page: 200 });
  return listed.users.find((u) => (u.email || '').toLowerCase() === email) ?? null;
}

/**
 * Sends an email OTP WITHOUT creating auth.users.
 * Auth user is created only in verifyPendingEmailSignup.
 */
export async function sendPendingEmailSignupOtp(email: string, password: string) {
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

  const existingAuth = await findAuthUserByEmail(normalized);
  if (existingAuth?.id) {
    const { data: profileById } = await admin
      .from('profiles')
      .select('id')
      .eq('id', existingAuth.id)
      .maybeSingle();

    if (profileById?.id || existingAuth.email_confirmed_at) {
      const err = new Error('Account already exists. Please log in instead.');
      (err as Error & { code?: string }).code = 'ACCOUNT_EXISTS';
      throw err;
    }

    // Leftover unconfirmed auth row from old signup flow — remove so we
    // only create a user after OTP verify.
    await admin.auth.admin.deleteUser(existingAuth.id);
  }

  const { data: existingPending } = await admin
    .from('pending_email_signups')
    .select('last_sent_at')
    .eq('email', normalized)
    .maybeSingle();

  if (existingPending?.last_sent_at) {
    const elapsed = Date.now() - new Date(existingPending.last_sent_at).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const err = new Error('Please wait a moment before requesting another code.');
      (err as Error & { code?: string }).code = 'RATE_LIMITED';
      throw err;
    }
  }

  const code = generateOtpCode();
  const row = {
    email: normalized,
    password_cipher: encryptSignupPassword(password),
    code_hash: hashOtpCode(normalized, code),
    attempts: 0,
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    last_sent_at: new Date().toISOString(),
  };

  const { error: upsertError } = await admin.from('pending_email_signups').upsert(row, {
    onConflict: 'email',
  });

  if (upsertError) throw upsertError;

  await sendOtpEmail(normalized, code);

  return { email: normalized, expiresInSeconds: OTP_TTL_MS / 1000 };
}

/**
 * Verifies OTP, THEN creates the auth user (confirmed) and returns a session.
 */
export async function verifyPendingEmailSignup(email: string, code: string) {
  const admin = createSupabaseAdmin();
  const normalized = normalizeEmail(email);
  const cleaned = code.replace(/\D/g, '');

  const { data: pending, error: pendingError } = await admin
    .from('pending_email_signups')
    .select('*')
    .eq('email', normalized)
    .maybeSingle();

  if (pendingError) throw pendingError;

  if (!pending) {
    const err = new Error('No verification in progress. Request a new code.');
    (err as Error & { code?: string }).code = 'OTP_NOT_FOUND';
    throw err;
  }

  if (new Date(pending.expires_at).getTime() < Date.now()) {
    await admin.from('pending_email_signups').delete().eq('email', normalized);
    const err = new Error('Code expired. Request a new one.');
    (err as Error & { code?: string }).code = 'OTP_EXPIRED';
    throw err;
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    await admin.from('pending_email_signups').delete().eq('email', normalized);
    const err = new Error('Too many attempts. Request a new code.');
    (err as Error & { code?: string }).code = 'MAX_ATTEMPTS_EXCEEDED';
    throw err;
  }

  const expected = hashOtpCode(normalized, cleaned);
  if (expected !== pending.code_hash) {
    await admin
      .from('pending_email_signups')
      .update({ attempts: pending.attempts + 1 })
      .eq('email', normalized);
    const err = new Error('Wrong code. Please try again.');
    (err as Error & { code?: string }).code = 'INVALID_OTP';
    throw err;
  }

  const password = decryptSignupPassword(pending.password_cipher);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    throw createError ?? new Error('Could not create your account.');
  }

  await admin.from('pending_email_signups').delete().eq('email', normalized);

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const anon = createClient(supabaseUrl(), anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (signInError || !signedIn.session?.user) {
    // Roll back so we never leave an auth user without a usable session.
    await admin.auth.admin.deleteUser(created.user.id);
    throw signInError ?? new Error('Could not start your session.');
  }

  return {
    session: signedIn.session,
    userId: signedIn.session.user.id,
  };
}
