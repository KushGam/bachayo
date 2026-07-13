import { AppState } from 'react-native';
import { useEffect } from 'react';

import { fetchUnreadMessagesCountForOrders } from '@/lib/orderMessages';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

export function useUnreadMessages() {
  const setUnreadMessages = useAppStore((s) => s.setUnreadMessages);

  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const refresh = async () => {
      if (!userId) {
        setUnreadMessages(0);
        return;
      }

      const { data: asPartner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: customerOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', userId);
      const { data: partnerOrders } = asPartner
        ? await supabase.from('orders').select('id').eq('partner_id', asPartner.id)
        : { data: [] as Array<{ id: string }> };

      const ids = [...(customerOrders ?? []), ...(partnerOrders ?? [])].map((row) => row.id);
      const uniqueIds = Array.from(new Set(ids));
      const count = await fetchUnreadMessagesCountForOrders(uniqueIds, userId);
      setUnreadMessages(count);
    };

    const setup = async () => {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id ?? null;
      await refresh();
      if (!userId) return;

      channel = supabase
        .channel(`unread-messages-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'order_messages' }, () => {
          void refresh();
        })
        .subscribe();
    };

    void setup();

    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      userId = session?.user?.id ?? null;
      void refresh();
    });

    return () => {
      appSub.remove();
      authSub.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [setUnreadMessages]);
}
