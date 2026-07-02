import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  return {
    ...config,
    extra: {
      ...config.extra,
      eas: {
        ...(typeof config.extra?.eas === 'object' ? config.extra.eas : {}),
        ...(projectId ? { projectId } : {}),
      },
    },
  } as ExpoConfig;
};
