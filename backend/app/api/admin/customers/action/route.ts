import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { deleteCustomerAccount } from '@/lib/delete-customer-account';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

type CustomerAction = 'suspend' | 'delete';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const valid = token ? await verifyAdminSession(token).catch(() => false) : false;
  if (!valid) {
    throw new Error('Unauthorized');
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = (await request.json()) as {
      profileId?: string;
      action?: CustomerAction;
    };

    const profileId = body.profileId?.trim();
    const action = body.action;

    if (!profileId || !action) {
      return NextResponse.json(
        { success: false, error: 'profileId and action are required' },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    if (action === 'suspend') {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: true })
        .eq('id', profileId)
        .eq('role', 'customer');

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      await deleteCustomerAccount(profileId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const code =
      typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code ?? '')
        : '';

    const status =
      message === 'Unauthorized'
        ? 401
        : code === 'NOT_CUSTOMER'
          ? 403
          : code === 'NOT_FOUND'
            ? 404
            : 500;

    return NextResponse.json({ success: false, error: message, code: code || undefined }, { status });
  }
}
