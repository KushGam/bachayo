import { useEffect } from 'react';

import { fetchUserRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

const ROLE_TIMEOUT_MS = 6000;

export function useUserRole() {
  const role = useAuthStore((s) => s.role);
  const roleLoaded = useAuthStore((s) => s.roleLoaded);
  const setAuthRole = useAuthStore((s) => s.setAuthRole);

  useEffect(() => {
    let cancelled = false;

    const loadRole = async (userId: string | undefined) => {
      if (!userId) {
        if (!cancelled) {
          setAuthRole(null);
        }
        return;
      }

      if (useAuthStore.getState().roleLoaded) {
        return;
      }

      try {
        const nextRole = await fetchUserRole(userId);
        if (!cancelled) {
          setAuthRole(nextRole);
        }
      } catch (error) {
        console.error('[boot] useUserRole fetch failed:', error);
        if (!cancelled) {
          setAuthRole(null);
        }
      }
    };

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('[boot] useUserRole getSession error:', error.message);
        }
        void loadRole(data.session?.user?.id);
      })
      .catch((error) => {
        console.error('[boot] useUserRole getSession failed:', error);
        if (!cancelled) {
          setAuthRole(null);
        }
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (!cancelled) {
          setAuthRole(null);
        }
        return;
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        void loadRole(session?.user?.id);
      }
    });

    const timeout = setTimeout(() => {
      if (!cancelled && !useAuthStore.getState().roleLoaded) {
        console.warn('[boot] useUserRole timeout — defaulting role to null');
        setAuthRole(null);
      }
    }, ROLE_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.subscription.unsubscribe();
    };
  }, [setAuthRole]);

  return {
    role,
    roleLoaded,
    isPartner: role === 'partner',
    isCustomer: role === 'customer' || role === null,
  };
}
