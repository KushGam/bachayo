import { useURL } from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { BrandedLoading } from '@/components/brand/BrandedLoading';
import {
  createSessionFromUrl,
  fetchUserRole,
  hasUserProfile,
} from '@/lib/auth';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { hasAcceptedTerms } from '@/lib/terms';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Handles OAuth deep links (lastbag://auth/callback?code=...).
 * When Google redirects back, the app often restarts here instead of
 * returning to WebBrowser.openAuthSessionAsync on the welcome screen.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = useURL();
  const setAuthRole = useAuthStore((s) => s.setAuthRole);
  const handled = useRef(false);

  useEffect(() => {
    if (!url || handled.current) return;
    if (!url.includes('auth/callback')) return;

    handled.current = true;

    void (async () => {
      try {
        const session = await createSessionFromUrl(url);
        const userId = session?.user?.id;
        if (!userId) {
          throw new Error('Sign-in failed');
        }

        const hasProfile = await hasUserProfile(userId);
        if (!hasProfile) {
          router.replace('/(auth)/complete-profile');
          return;
        }

        const accepted = await hasAcceptedTerms(userId);
        if (!accepted) {
          router.replace('/(auth)/accept-terms');
          return;
        }

        const role = await fetchUserRole(userId);
        setAuthRole(role ?? 'customer');
        router.replace(await resolveAuthenticatedRoute(userId, role ?? 'customer'));
      } catch (error) {
        console.error('[auth] OAuth callback failed:', error);
        router.replace('/(auth)/welcome');
      }
    })();
  }, [router, setAuthRole, url]);

  return <BrandedLoading />;
}
