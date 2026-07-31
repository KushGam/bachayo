type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  /** Android only — must match a channel the app registered, or it won't show. */
  channelId?: string;
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (messages.length === 0) {
    return { data: [] as ExpoPushTicket[] };
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(process.env.EXPO_ACCESS_TOKEN
        ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push failed: ${response.status} ${await response.text()}`);
  }

  const result = (await response.json()) as { data?: ExpoPushTicket[] };

  // Expo returns 200 with per-message tickets, so delivery failures are only
  // visible here — most commonly DeviceNotRegistered for a stale token.
  for (const ticket of result.data ?? []) {
    if (ticket.status === 'error') {
      console.warn('[expo-push] ticket error:', ticket.details?.error, ticket.message);
    }
  }

  return { data: result.data ?? [] };
}
