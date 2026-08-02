import crypto from 'crypto';

import { createClient } from '@supabase/supabase-js';

import {
  generateOtpCode,
  hashOtpCode,
} from '@/lib/pending-email-signup';
import { createSupabaseAdmin, supabaseUrl } from '@/lib/supabase-admin';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function requireSecret() {
  const secret = process.env.INTERNAL_SECRET || process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('Missing INTERNAL_SECRET for password reset tokens');
  }
  return secret;
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
      users?: Array<{ id: string; email?: string }>;
      id?: string;
      email?: string;
    };

    if (Array.isArray(payload.users)) {
      return (
        payload.users.find((u) => (u.email || '').toLowerCase() === email) ?? null
      );
    }

    if (payload.id && (payload.email || '').toLowerCase() === email) {
      return { id: payload.id, email: payload.email };
    }
  }

  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, per_page: 200 });
  return listed.users.find((u) => (u.email || '').toLowerCase() === email) ?? null;
}

async function sendResetOtpEmail(email: string, code: string) {
  const nodemailer = await import('nodemailer');
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
    subject: `${code} is your LastBag password reset code`,
    text: `Your LastBag password reset code is ${code}.\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1C1917">
        <p style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#D85A30;margin:0 0 12px">LastBag</p>
        <h1 style="font-size:22px;margin:0 0 8px">Password reset code</h1>
        <p style="font-size:15px;color:#6B6560;line-height:1.5;margin:0 0 20px">
          Use this 8-digit code in the app to choose a new password.
        </p>
        <p style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:34px;letter-spacing:8px;font-weight:700;margin:0 0 20px;color:#1C1917">
          ${code}
        </p>
        <p style="font-size:13px;color:#9C9590;margin:0">
          Expires in 10 minutes. If you didn’t request this, you can ignore this email.
        </p>
      </div>
    `,
  });
}

function signResetToken(email: string, userId: string) {
  const payload = {
    email: normalizeEmail(email),
    userId,
    exp: Date.now() + RESET_TOKEN_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', requireSecret())
    .update(body)
    .digest('base64url');
  return `${body}.${sig}`;
}

function verifyResetToken(token: string): { email: string; userId: string } {
  const [body, sig] = token.split('.');
  if (!body || !sig) {
    const err = new Error('Reset session expired. Request a new code.');
    (err as Error & { code?: string }).code = 'RESET_TOKEN_INVALID';
    throw err;
  }
  const expected = crypto
    .createHmac('sha256', requireSecret())
    .update(body)
    .digest('base64url');
  if (expected !== sig) {
    const err = new Error('Reset session expired. Request a new code.');
    (err as Error & { code?: string }).code = 'RESET_TOKEN_INVALID';
    throw err;
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
    email?: string;
    userId?: string;
    exp?: number;
  };
  if (!payload.email || !payload.userId || !payload.exp || payload.exp < Date.now()) {
    const err = new Error('Reset session expired. Request a new code.');
    (err as Error & { code?: string }).code = 'RESET_TOKEN_EXPIRED';
    throw err;
  }
  return { email: payload.email, userId: payload.userId };
}

/**
 * Sends an 8-digit password-reset OTP.
 * Always returns success for unknown emails (no account enumeration).
 */
export async function sendPasswordResetOtp(email: string) {
  const admin = createSupabaseAdmin();
  const normalized = normalizeEmail(email);

  const authUser = await findAuthUserByEmail(normalized);
  if (!authUser?.id) {
    // Fake delay-ish success so attackers can't probe emails.
    return { email: normalized, expiresInSeconds: OTP_TTL_MS / 1000, sent: false };
  }

  const { data: existing } = await admin
    .from('password_reset_otps')
    .select('last_sent_at')
    .eq('email', normalized)
    .maybeSingle();

  if (existing?.last_sent_at) {
    const elapsed = Date.now() - new Date(existing.last_sent_at).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const err = new Error('Please wait a moment before requesting another code.');
      (err as Error & { code?: string }).code = 'RATE_LIMITED';
      throw err;
    }
  }

  const code = generateOtpCode();
  const row = {
    email: normalized,
    user_id: authUser.id,
    code_hash: hashOtpCode(normalized, code),
    attempts: 0,
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    last_sent_at: new Date().toISOString(),
  };

  const { error: upsertError } = await admin.from('password_reset_otps').upsert(row, {
    onConflict: 'email',
  });
  if (upsertError) throw upsertError;

  await sendResetOtpEmail(normalized, code);

  return { email: normalized, expiresInSeconds: OTP_TTL_MS / 1000, sent: true };
}

export async function verifyPasswordResetOtp(email: string, code: string) {
  const admin = createSupabaseAdmin();
  const normalized = normalizeEmail(email);
  const cleaned = code.replace(/\D/g, '');

  const { data: pending, error: pendingError } = await admin
    .from('password_reset_otps')
    .select('*')
    .eq('email', normalized)
    .maybeSingle();

  if (pendingError) throw pendingError;

  if (!pending) {
    const err = new Error('No reset in progress. Request a new code.');
    (err as Error & { code?: string }).code = 'OTP_NOT_FOUND';
    throw err;
  }

  if (new Date(pending.expires_at).getTime() < Date.now()) {
    await admin.from('password_reset_otps').delete().eq('email', normalized);
    const err = new Error('Code expired. Request a new one.');
    (err as Error & { code?: string }).code = 'OTP_EXPIRED';
    throw err;
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    await admin.from('password_reset_otps').delete().eq('email', normalized);
    const err = new Error('Too many attempts. Request a new code.');
    (err as Error & { code?: string }).code = 'MAX_ATTEMPTS_EXCEEDED';
    throw err;
  }

  const expected = hashOtpCode(normalized, cleaned);
  if (expected !== pending.code_hash) {
    await admin
      .from('password_reset_otps')
      .update({ attempts: pending.attempts + 1 })
      .eq('email', normalized);
    const err = new Error('Wrong code. Please try again.');
    (err as Error & { code?: string }).code = 'INVALID_OTP';
    throw err;
  }

  // Consume the OTP — password must be set with the reset token next.
  await admin.from('password_reset_otps').delete().eq('email', normalized);

  return {
    email: normalized,
    resetToken: signResetToken(normalized, pending.user_id),
  };
}

export async function confirmPasswordReset(input: {
  resetToken: string;
  password: string;
}) {
  if (input.password.length < 8) {
    const err = new Error('Password must be at least 8 characters.');
    (err as Error & { code?: string }).code = 'WEAK_PASSWORD';
    throw err;
  }

  const { email, userId } = verifyResetToken(input.resetToken);
  const admin = createSupabaseAdmin();

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: input.password,
  });
  if (updateError) throw updateError;

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const anon = createClient(supabaseUrl(), anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (signInError || !signedIn.session) {
    // Password was updated — client can still log in manually.
    return { email, userId, session: null as null };
  }

  return {
    email,
    userId,
    session: signedIn.session,
  };
}
