import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseAdmin } from '@/lib/supabase-admin';

type WaitlistBody = {
  email?: string;
  city?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const { email, city } = (await request.json()) as WaitlistBody;
    const normalizedEmail = email ? normalizeEmail(email) : '';

    if (!normalizedEmail) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from('waitlist').insert({
      email: normalizedEmail,
      city: city?.trim() || null,
    });

    if (error && error.code !== '23505') {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not join waitlist';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

