import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { deliverNotification } from '@/lib/notifications';
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

    const body = (await request.json()) as {
      partnerId?: string;
      amount?: number;
      tier?: 'small' | 'medium' | 'large';
      paymentMethod?: string;
      transactionRef?: string;
      months?: number;
      notes?: string;
    };

    const {
      partnerId,
      amount,
      tier: inputTier,
      paymentMethod,
      transactionRef,
      months: inputMonths,
      notes,
    } = body;

    if (!partnerId || !amount || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'partnerId, amount, and paymentMethod are required' },
        { status: 400 },
      );
    }

    const months = Math.max(1, inputMonths ?? 1);
    const supabase = createSupabaseAdmin();

    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('subscription_tier, current_period_end, name, user_id')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    const tier = (inputTier ?? partner.subscription_tier ?? 'small') as
      | 'small'
      | 'medium'
      | 'large';

    const now = new Date();
    const currentExpiry = partner.current_period_end
      ? new Date(partner.current_period_end)
      : now;
    const startFrom = currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
    const newExpiry = new Date(startFrom);
    newExpiry.setMonth(newExpiry.getMonth() + months);

    const refNote = [transactionRef, notes].filter(Boolean).join(' · ') || null;

    const { error: paymentError } = await supabase.from('subscription_payments').insert({
      partner_id: partnerId,
      tier,
      amount,
      status: 'paid',
      payment_method: paymentMethod,
      payment_ref: refNote,
      period_start: now.toISOString().slice(0, 10),
      period_end: newExpiry.toISOString().slice(0, 10),
    });

    if (paymentError) {
      return NextResponse.json({ success: false, error: paymentError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from('partners')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: newExpiry.toISOString(),
        is_active: true,
        payment_method_on_file: false,
        payment_method_type: paymentMethod,
        payment_method_mask: paymentMethod,
      })
      .eq('id', partnerId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    if (partner.user_id) {
      try {
        await deliverNotification(
          partner.user_id,
          '✅ Payment received!',
          `Your LastBag ${tier} plan is now active until ${newExpiry.toLocaleDateString('en-NP')}. Keep rescuing food!`,
          {
            type: 'subscription',
            data: { partner_id: partnerId, type: 'subscription' },
          },
        );
      } catch (err) {
        console.warn('[admin/payments/record] notify failed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      newExpiry: newExpiry.toISOString(),
      partnerName: partner.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record payment';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
