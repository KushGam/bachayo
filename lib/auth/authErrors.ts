/**
 * Supabase surfaces raw gateway strings ("Invalid login credentials").
 * Everything shown to a user should go through here first.
 */
const AUTH_ERROR_COPY: { match: RegExp; message: string }[] = [
  {
    match: /invalid login credentials|invalid credentials/i,
    message: 'Wrong email or password. Please try again.',
  },
  {
    match: /email not confirmed/i,
    message: 'Please verify your email first.',
  },
  {
    match: /user already registered|already been registered/i,
    message: 'Account already exists. Please login.',
  },
  {
    match: /phone.*(already|in use|registered)/i,
    message: 'This phone number is already registered.',
  },
  {
    match: /email.*(already|in use|registered)/i,
    message: 'This email is already registered. Please login.',
  },
  {
    match: /email rate limit|over_email_send_rate_limit|too many requests|rate limit/i,
    message: 'Too many attempts. Please wait a moment and try again.',
  },
  {
    match: /token has expired|otp_expired/i,
    message: 'Code expired. Request a new one.',
  },
  {
    match: /invalid token|token is invalid|otp is invalid/i,
    message: 'Wrong code. Please try again.',
  },
  {
    match: /password should be at least/i,
    message: 'Password must be at least 8 characters.',
  },
  {
    match: /network request failed|fetch failed|network error/i,
    message: 'No internet connection. Please check your network.',
  },
  {
    match: /user not found/i,
    message: 'No account found. Please sign up first.',
  },
];

export function friendlyAuthError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const raw =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === 'object' && error && 'message' in error
          ? String((error as { message: unknown }).message)
          : '';

  if (!raw) return fallback;

  const known = AUTH_ERROR_COPY.find((entry) => entry.match.test(raw));
  return known ? known.message : raw;
}
