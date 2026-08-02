import { NextRequest, NextResponse } from 'next/server';

import { deleteCustomerAccount } from '@/lib/delete-customer-account';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  if (!token) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  try {
    await deleteCustomerAccount(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[account/delete] failed:', error);
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code ?? '')
        : '';
    const message =
      error instanceof Error ? error.message : 'Could not delete account.';

    if (code === 'NOT_CUSTOMER') {
      return NextResponse.json({ error: message, code }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
