import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret) {
      const provided = req.headers.get('x-cron-secret');
      if (provided !== cronSecret) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase.rpc('mark_missed_orders_after_pickup');
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ ok: true, marked: data ?? 0 });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});
