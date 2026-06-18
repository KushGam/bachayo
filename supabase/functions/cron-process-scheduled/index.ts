import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { sendExpoPush } from '../_shared/expo-push.ts';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
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

    const { data: pending, error } = await supabase
      .from('scheduled_notifications')
      .select('id, user_id, title, body, data')
      .is('sent_at', null)
      .lte('send_at', new Date().toISOString())
      .limit(50);

    if (error) throw error;
    if (!pending?.length) {
      return jsonResponse({ ok: true, sent: 0 });
    }

    const userIds = [...new Set(pending.map((row) => row.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, push_token')
      .in('id', userIds);

    const tokenByUser = new Map(
      (profiles ?? [])
        .filter((p) => p.push_token)
        .map((p) => [p.id, p.push_token as string]),
    );

    const messages = pending
      .map((row) => {
        const token = tokenByUser.get(row.user_id);
        if (!token) return null;
        return {
          to: token,
          title: row.title,
          body: row.body,
          data: (row.data as Record<string, unknown>) ?? {},
          sound: 'default' as const,
        };
      })
      .filter((msg): msg is NonNullable<typeof msg> => Boolean(msg));

    if (messages.length > 0) {
      await sendExpoPush(messages);
    }

    const sentIds = pending.map((row) => row.id);
    await supabase
      .from('scheduled_notifications')
      .update({ sent_at: new Date().toISOString() })
      .in('id', sentIds);

    return jsonResponse({ ok: true, sent: messages.length });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});
