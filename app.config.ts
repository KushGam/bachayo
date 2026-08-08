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
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    '';

  const plugins = [...(config.plugins ?? [])];

  // Native Google Sign-In. Always register the plugin so Android binaries link
  // RNGoogleSignin; iosUrlScheme is required for iOS Google Sign-In.
  if (iosUrlScheme) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme },
    ]);
  } else {
    plugins.push('@react-native-google-signin/google-signin');
    console.warn(
      '[app.config] EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (or EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME) missing — iOS Google Sign-In URL scheme not configured.',
    );
  }

  if (!googleMapsApiKey) {
    console.warn(
      '[app.config] GOOGLE_MAPS_API_KEY missing — Android Explore map will crash without android.config.googleMaps.apiKey. Add the key and rebuild.',
    );
  }

  return {
    ...config,
    plugins,
    ios: {
      ...config.ios,
      config: {
        ...(typeof config.ios?.config === 'object' ? config.ios.config : {}),
        ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
      },
    },
    android: {
      ...config.android,
      config: {
        ...(typeof config.android?.config === 'object' ? config.android.config : {}),
        ...(googleMapsApiKey
          ? {
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            }
          : {}),
      },
    },
    extra: {
      ...config.extra,
      eas: {
        ...(typeof config.extra?.eas === 'object' ? config.extra.eas : {}),
        ...(projectId ? { projectId } : {}),
      },
      googleMapsApiKeyConfigured: Boolean(googleMapsApiKey),
    },
  } as ExpoConfig;
};
