export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
};

export async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (messages.length === 0) {
    return { data: [] };
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(Deno.env.get('EXPO_ACCESS_TOKEN')
        ? { Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}` }
        : {}),
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push failed: ${text}`);
  }

  return response.json();
}

export async function sendToUser(
  supabase: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2.49.1').createClient>,
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', userId)
    .maybeSingle();

  if (!profile?.push_token) {
    return { sent: false, reason: 'no_push_token' };
  }

  await sendExpoPush([
    {
      to: profile.push_token,
      title,
      body,
      data,
      sound: 'default',
    },
  ]);

  return { sent: true };
}

export async function sendToCustomers(
  supabase: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2.49.1').createClient>,
  title: string,
  body: string,
  data?: Record<string, unknown>,
  limit = 100,
) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('role', 'customer')
    .not('push_token', 'is', null)
    .limit(limit);

  const tokens = (profiles ?? [])
    .map((p) => p.push_token)
    .filter((token): token is string => Boolean(token));

  if (tokens.length === 0) {
    return { sent: 0 };
  }

  await sendExpoPush(
    tokens.map((to) => ({
      to,
      title,
      body,
      data,
      sound: 'default',
    })),
  );

  return { sent: tokens.length };
}

function assertWebhookSecret(req: Request) {
  const expected = Deno.env.get('WEBHOOK_SECRET');
  if (!expected) return;
  const provided = req.headers.get('x-webhook-secret');
  if (provided !== expected) {
    throw new Error('Unauthorized webhook');
  }
}

export function verifyWebhook(req: Request) {
  assertWebhookSecret(req);
}
