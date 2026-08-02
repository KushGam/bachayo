import * as Linking from 'expo-linking';

export type ResetPasswordDeepLink = {
  token: string;
  email?: string;
};

function queryValue(
  params: Record<string, string | string[] | undefined> | null | undefined,
  key: string,
): string | undefined {
  const value = params?.[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0].trim();
  }
  return undefined;
}

/** Parse https://lastbag.app/reset-password?token=… or lastbag://reset-password?token=… */
export function parseResetPasswordDeepLink(url: string): ResetPasswordDeepLink | null {
  if (!url || !url.includes('reset-password')) return null;

  try {
    const parsed = Linking.parse(url);
    const token = queryValue(parsed.queryParams, 'token');
    if (!token) return null;
    const email = queryValue(parsed.queryParams, 'email');
    return email ? { token, email } : { token };
  } catch {
    const queryString = url.split('?')[1]?.split('#')[0] || '';
    const params = new URLSearchParams(queryString);
    const token = params.get('token')?.trim();
    if (!token) return null;
    const email = params.get('email')?.trim();
    return email ? { token, email } : { token };
  }
}
