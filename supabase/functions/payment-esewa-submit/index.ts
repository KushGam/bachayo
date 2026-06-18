import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const ESEWA_TEST_FORM_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const orderId = url.searchParams.get('orderId');

  if (!orderId) {
    return new Response('Missing orderId', { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: session, error } = await supabase
    .from('payment_sessions')
    .select('payload')
    .eq('order_id', orderId)
    .eq('gateway', 'esewa')
    .maybeSingle();

  if (error || !session?.payload) {
    return new Response('Payment session not found', { status: 404 });
  }

  const fields = session.payload as Record<string, string>;
  const inputs = Object.entries(fields)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${key}" value="${String(value).replace(/"/g, '&quot;')}" />`,
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Redirecting to eSewa…</title></head>
  <body onload="document.forms[0].submit()">
    <p>Redirecting to eSewa…</p>
    <form method="POST" action="${ESEWA_TEST_FORM_URL}">
      ${inputs}
    </form>
  </body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});
