import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { sendToUser } from '../_shared/expo-push.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

    const { user_id, title, body, type, data } = await req.json();

    if (!user_id || !title || !body) {
      return jsonResponse({ error: 'user_id, title, and body are required' }, 400);
    }

    const result = await sendToUser(supabase, user_id, title, body, {
      type: type || 'system',
      data: data ?? undefined,
    });
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});
