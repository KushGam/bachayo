import { useURL } from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { BrandedLoading } from '@/components/brand/BrandedLoading';
import {
  createSessionFromUrl,
  fetchUserRole,
  hasUserProfile,
  isPasswordRecoveryUrl,
} from '@/lib/auth';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { hasAcceptedTerms } from '@/lib/terms';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Handles OAuth + password-recovery deep links (lastbag://auth/callback?...).
 * When Google or a reset email redirects back, the app often restarts here.
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
    const isRecovery = isPasswordRecoveryUrl(url);

    void (async () => {
      try {
        const session = await createSessionFromUrl(url);
        const userId = session?.user?.id;
        if (!userId) {
          throw new Error('Sign-in failed');
        }

        if (isRecovery) {
          router.replace('/(auth)/reset-password');
          return;
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
        router.replace(isRecovery ? '/(auth)/forgot-password' : '/(auth)/welcome');
      }
    })();
  }, [router, setAuthRole, url]);

  return <BrandedLoading />;
}
