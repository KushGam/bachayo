import PostHog from 'posthog-react-native';

type AnalyticsEvent =
  | 'bag_viewed'
  | 'bag_reserved'
  | 'pickup_completed'
  | 'partner_onboarded';

type EventProperties = Record<string, string | number | boolean | null>;

let client: PostHog | null = null;
let initialized = false;

function getClient() {
  if (initialized) return client;

  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

  if (!apiKey) {
    initialized = true;
    return null;
  }

  client = new PostHog(apiKey, { host });
  initialized = true;
  return client;
}

export function initAnalytics() {
  getClient();
}

export function track(event: AnalyticsEvent, properties?: EventProperties) {
  const posthog = getClient();

  if (posthog) {
    posthog.capture(event, properties);
    return;
  }

  if (__DEV__) {
    console.log('[analytics]', event, properties ?? {});
  }
}

export function identifyUser(userId: string, traits?: EventProperties) {
  getClient()?.identify(userId, traits);
}
