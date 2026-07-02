import { config } from '@/constants/config';

export type SupportContactPayload = {
  subject: string;
  message: string;
  email: string;
  userId: string | null;
  role: string | null;
};

export async function submitSupportContact(payload: SupportContactPayload): Promise<void> {
  const baseUrl = config.apiUrl.replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('Support API is not configured');
  }

  const response = await fetch(`${baseUrl}/api/support/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Failed to send message';
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
}
