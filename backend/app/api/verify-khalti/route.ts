import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseAdmin } from '@/lib/supabase-admin';

const KHALTI_LOOKUP_URL = 'https://a.khalti.com/api/v2/epayment/lookup/';

type VerifyKhaltiBody = {
  pidx?: string;
  order_id?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyKhaltiBody;
    const { pidx, order_id } = body;

    if (!pidx || !order_id) {
      return NextResponse.json(
        { success: false, error: 'pidx and order_id are required' },
        { status: 400 },
      );
    }

    const secretKey = process.env.KHALTI_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: 'KHALTI_SECRET_KEY is not configured' },
        { status: 500 },
      );
    }

    const supabase = createSupabaseAdmin();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const { data: lookupData } = await axios.post(
      KHALTI_LOOKUP_URL,
      { pidx },
      {
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (lookupData?.status !== 'Completed') {
      return NextResponse.json({
        success: false,
        error: lookupData?.status ?? 'Khalti payment not completed',
      });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_ref: pidx,
      })
      .eq('id', order_id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
