import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ESEWA_TEST_FORM_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const KHALTI_TEST_INITIATE_URL = 'https://dev.khalti.com/api/v2/epayment/initiate/';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toNprAmount(amountPaisa: number) {
  return (amountPaisa / 100).toFixed(2);
}

async function hmacSha256Base64(message: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { gateway, orderId, amountPaisa } = await req.json();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_id, total_price, status, payment_method')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return jsonResponse({ error: 'Order not found' }, 404);
    }

    if (order.customer_id !== userData.user.id) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    if (gateway === 'esewa') {
      const merchantCode = Deno.env.get('ESEWA_MERCHANT_CODE') ?? 'EPAYTEST';
      const secretKey = Deno.env.get('ESEWA_SECRET_KEY');
      if (!secretKey) {
        return jsonResponse({ error: 'ESEWA_SECRET_KEY not configured' }, 500);
      }

      const totalAmount = toNprAmount(amountPaisa ?? order.total_price);
      const transactionUuid = `${orderId}-${crypto.randomUUID()}`;
      const signedFieldNames = 'total_amount,transaction_uuid,product_code';
      const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${merchantCode}`;
      const signature = await hmacSha256Base64(message, secretKey);

      const callbackBase = 'bachayo://payment/callback';
      const successUrl = `${callbackBase}?gateway=esewa&status=success&orderId=${orderId}&transaction_uuid=${encodeURIComponent(transactionUuid)}`;
      const failureUrl = `${callbackBase}?gateway=esewa&status=failure&orderId=${orderId}&transaction_uuid=${encodeURIComponent(transactionUuid)}`;

      await supabase
        .from('orders')
        .update({
          payment_method: 'esewa',
          payment_ref: transactionUuid,
          status: 'pending',
        })
        .eq('id', orderId);

      const formFields = {
        amount: totalAmount,
        tax_amount: '0',
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: merchantCode,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url: successUrl,
        failure_url: failureUrl,
        signed_field_names: signedFieldNames,
        signature,
      };

      const submitUrl = `${supabaseUrl}/functions/v1/payment-esewa-submit?orderId=${encodeURIComponent(orderId)}`;

      await supabase.from('payment_sessions').upsert({
        order_id: orderId,
        gateway: 'esewa',
        transaction_ref: transactionUuid,
        payload: formFields,
      });

      return jsonResponse({
        gateway: 'esewa',
        orderId,
        paymentUrl: submitUrl,
        transactionRef: transactionUuid,
      });
    }

    if (gateway === 'khalti') {
      const secretKey = Deno.env.get('KHALTI_SECRET_KEY');
      if (!secretKey) {
        return jsonResponse({ error: 'KHALTI_SECRET_KEY not configured' }, 500);
      }

      const returnUrl = `bachayo://payment/callback?gateway=khalti&status=success&orderId=${orderId}`;
      const websiteUrl = Deno.env.get('APP_WEBSITE_URL') ?? 'https://bachayo.app';

      const response = await fetch(KHALTI_TEST_INITIATE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: returnUrl,
          website_url: websiteUrl,
          amount: amountPaisa ?? order.total_price,
          purchase_order_id: orderId,
          purchase_order_name: 'Bachayo rescue bag',
        }),
      });

      const khaltiData = await response.json();
      if (!response.ok || !khaltiData.payment_url) {
        return jsonResponse({ error: khaltiData.detail ?? 'Khalti initiate failed' }, 400);
      }

      await supabase
        .from('orders')
        .update({
          payment_method: 'khalti',
          payment_ref: khaltiData.pidx,
          status: 'pending',
        })
        .eq('id', orderId);

      return jsonResponse({
        gateway: 'khalti',
        orderId,
        paymentUrl: khaltiData.payment_url,
        transactionRef: khaltiData.pidx,
      });
    }

    return jsonResponse({ error: 'Unsupported gateway' }, 400);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});
