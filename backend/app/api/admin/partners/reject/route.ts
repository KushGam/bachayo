import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { sendNotificationPayload } from '@/lib/notifications';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

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

    const { partnerId, reason } = (await request.json()) as {
      partnerId?: string;
      reason?: string;
    };

    if (!partnerId) {
      return NextResponse.json({ success: false, error: 'partnerId is required' }, { status: 400 });
    }

    const rejectionReason = reason?.trim() || 'Please contact us for more information.';
    const supabase = createSupabaseAdmin();

    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('user_id, name')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner?.user_id) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('partners')
      .update({
        approval_status: 'rejected',
        rejection_reason: rejectionReason,
        is_active: false,
      })
      .eq('id', partnerId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    await sendNotificationPayload(partner.user_id, {
      title: 'Application update',
      body: `Unfortunately we can't approve your account right now. Reason: ${rejectionReason}. Call us on 0405 290 710 to discuss.`,
      type: 'approval',
      data: { partner_id: partnerId, status: 'rejected' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reject partner';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
