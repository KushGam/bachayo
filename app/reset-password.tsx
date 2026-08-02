import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Universal-link entry for https://lastbag.app/reset-password?token=…
 * Forwards into the deep-link reset screen under /auth/reset-password.
 */
export default function ResetPasswordUniversalEntry() {
  const params = useLocalSearchParams<{ token?: string | string[]; email?: string | string[] }>();
  const token = typeof params.token === 'string' ? params.token : params.token?.[0];
  const email = typeof params.email === 'string' ? params.email : params.email?.[0];

  if (!token) {
    return <Redirect href="/(auth)/forgot-password" />;
  }

  const qs = new URLSearchParams({ token });
  if (email) qs.set('email', email);
  return <Redirect href={`/auth/reset-password?${qs.toString()}`} />;
}
