import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Reverse an iOS OAuth client ID into the URL scheme Google requires.
 * e.g. 123-abc.apps.googleusercontent.com → com.googleusercontent.apps.123-abc
 */
function iosUrlSchemeFromClientId(iosClientId: string): string | undefined {
  const trimmed = iosClientId.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('com.googleusercontent.apps.')) return trimmed;
  const suffix = '.apps.googleusercontent.com';
  if (!trimmed.endsWith(suffix)) return undefined;
  const id = trimmed.slice(0, -suffix.length);
  return `com.googleusercontent.apps.${id}`;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
  const iosUrlScheme =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim() ||
    iosUrlSchemeFromClientId(iosClientId);

  const plugins = [...(config.plugins ?? [])];

  // Native Google Sign-In (replaces browser OAuth that showed supabase.co).
  if (iosUrlScheme) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme },
    ]);
  } else {
    console.warn(
      '[app.config] EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (or EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME) missing — iOS Google Sign-In URL scheme not configured.',
    );
  }

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      eas: {
        ...(typeof config.extra?.eas === 'object' ? config.extra.eas : {}),
        ...(projectId ? { projectId } : {}),
      },
    },
  } as ExpoConfig;
};
