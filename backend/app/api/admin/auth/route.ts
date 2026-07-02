import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, adminCookieOptions, signAdminSession } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = (await request.json()) as { password?: string };
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin auth not configured' }, { status: 500 });
    }

    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const token = await signAdminSession();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
