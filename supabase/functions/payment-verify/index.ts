import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ESEWA_STATUS_URL = 'https://rc.esewa.com.np/api/epay/transaction/status/';
const KHALTI_LOOKUP_URL = 'https://dev.khalti.com/api/v2/epayment/lookup/';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

function decodeEsewaData(dataParam: string) {
  try {
    const decoded = atob(decodeURIComponent(dataParam));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
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

    const body = await req.json();
    const { gateway, orderId, status, data, transactionUuid, pidx } = body;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_id, total_price, payment_ref, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return jsonResponse({ verified: false, orderId, message: 'Order not found' }, 404);
    }

    if (order.customer_id !== userData.user.id) {
      return jsonResponse({ verified: false, orderId, message: 'Forbidden' }, 403);
    }

    if (status === 'failure') {
      return jsonResponse({ verified: false, orderId, message: 'Payment cancelled or failed' });
    }

    if (gateway === 'esewa') {
      const merchantCode = Deno.env.get('ESEWA_MERCHANT_CODE') ?? 'EPAYTEST';
      const secretKey = Deno.env.get('ESEWA_SECRET_KEY');
      if (!secretKey) {
        return jsonResponse({ verified: false, orderId, message: 'eSewa not configured' }, 500);
      }

      const txnUuid = transactionUuid ?? order.payment_ref;
      const totalAmount = (order.total_price / 100).toFixed(2);

      if (data) {
        const decoded = decodeEsewaData(data);
        if (!decoded || decoded.status !== 'COMPLETE') {
          return jsonResponse({ verified: false, orderId, message: 'Invalid eSewa callback data' });
        }

        const signedFieldNames = decoded.signed_field_names as string;
        const parts = signedFieldNames
          .split(',')
          .map((field: string) => `${field}=${decoded[field]}`)
          .join(',');
        const expectedSignature = await hmacSha256Base64(parts, secretKey);
        if (expectedSignature !== decoded.signature) {
          return jsonResponse({ verified: false, orderId, message: 'eSewa signature mismatch' });
        }
      }

      const statusUrl = `${ESEWA_STATUS_URL}?product_code=${merchantCode}&total_amount=${totalAmount}&transaction_uuid=${encodeURIComponent(txnUuid ?? '')}`;
      const statusResponse = await fetch(statusUrl);
      const statusData = await statusResponse.json();

      if (statusData?.status !== 'COMPLETE') {
        return jsonResponse({ verified: false, orderId, message: 'eSewa payment not complete' });
      }

      await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_ref: statusData.transaction_uuid ?? txnUuid,
        })
        .eq('id', orderId);

      return jsonResponse({ verified: true, orderId });
    }

    if (gateway === 'khalti') {
      const secretKey = Deno.env.get('KHALTI_SECRET_KEY');
      if (!secretKey) {
        return jsonResponse({ verified: false, orderId, message: 'Khalti not configured' }, 500);
      }

      const lookupPidx = pidx ?? order.payment_ref;
      const lookupResponse = await fetch(KHALTI_LOOKUP_URL, {
        method: 'POST',
        headers: {
          Authorization: `Key ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx: lookupPidx }),
      });

      const lookupData = await lookupResponse.json();
      if (!lookupResponse.ok || lookupData.status !== 'Completed') {
        return jsonResponse({ verified: false, orderId, message: 'Khalti payment not completed' });
      }

      await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_ref: lookupPidx,
        })
        .eq('id', orderId);

      return jsonResponse({ verified: true, orderId });
    }

    return jsonResponse({ verified: false, orderId, message: 'Unsupported gateway' }, 400);
  } catch (error) {
    return jsonResponse(
      {
        verified: false,
        orderId: '',
        message: error instanceof Error ? error.message : 'Unexpected error',
      },
      500,
    );
  }
});
