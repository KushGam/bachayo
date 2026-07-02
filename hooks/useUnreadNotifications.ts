import { useEffect } from 'react';

import { fetchUnreadNotificationCount } from '@/lib/notificationsInbox';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

export function useUnreadNotifications() {
  const setUnreadNotifications = useAppStore((s) => s.setUnreadNotifications);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let userId: string | null = null;

    const refreshCount = async () => {
      if (!userId) {
        setUnreadNotifications(0);
        return;
      }
      try {
        const count = await fetchUnreadNotificationCount(userId);
        setUnreadNotifications(count);
      } catch (error) {
        console.warn('[notifications] unread count failed:', error);
      }
    };

    const setup = async () => {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id ?? null;
      await refreshCount();

      if (!userId) return;

      channel = supabase
        .channel(`unread-notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            void refreshCount();
          },
        )
        .subscribe();
    };

    void setup();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      userId = session?.user?.id ?? null;
      void refreshCount();
    });

    return () => {
      authListener.subscription.unsubscribe();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [setUnreadNotifications]);
}
