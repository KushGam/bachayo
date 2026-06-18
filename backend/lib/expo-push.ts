import axios from 'axios';

type ExpoPushMessage = {
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

  const response = await axios.post('https://exp.host/--/api/v2/push/send', messages, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(process.env.EXPO_ACCESS_TOKEN
        ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
        : {}),
    },
  });

  return response.data;
}
