import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseAdmin } from '@/lib/supabase-admin';

const ESEWA_STATUS_URL = 'https://rc-epay.esewa.com.np/api/epay/transaction/status/';

type VerifyEsewaBody = {
  transaction_uuid?: string;
  amount?: number | string;
  order_id?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyEsewaBody;
    const { transaction_uuid, amount, order_id } = body;

    if (!transaction_uuid || amount == null || !order_id) {
      return NextResponse.json(
        { success: false, error: 'transaction_uuid, amount, and order_id are required' },
        { status: 400 },
      );
    }

    const productCode = process.env.ESEWA_PRODUCT_CODE;
    if (!productCode) {
      return NextResponse.json(
        { success: false, error: 'ESEWA_PRODUCT_CODE is not configured' },
        { status: 500 },
      );
    }

    const supabase = createSupabaseAdmin();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_price, status, payment_ref')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const expectedAmount = (order.total_price / 100).toFixed(2);
    const requestAmount =
      typeof amount === 'number' ? amount.toFixed(2) : Number(amount).toFixed(2);

    if (requestAmount !== expectedAmount) {
      return NextResponse.json(
        { success: false, error: 'Amount does not match order total' },
        { status: 400 },
      );
    }

    const { data: statusData } = await axios.get(ESEWA_STATUS_URL, {
      params: {
        product_code: productCode,
        total_amount: expectedAmount,
        transaction_uuid,
      },
    });

    if (statusData?.status !== 'COMPLETE') {
      return NextResponse.json({
        success: false,
        error: statusData?.status ?? 'eSewa payment not complete',
      });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_ref: statusData.transaction_uuid ?? transaction_uuid,
      })
      .eq('id', order_id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
