import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'admin_session';

function getSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SECRET is not configured');
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminSession() {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function verifyAdminSession(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload.role === 'admin';
}

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) {
    throw new Error('Unauthorized');
  }
  const valid = await verifyAdminSession(token).catch(() => false);
  if (!valid) {
    throw new Error('Unauthorized');
  }
}

export function adminCookieOptions(maxAge = 60 * 60 * 24) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
