import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { PartnerCard } from '@/components/cards/PartnerCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { RetryState } from '@/components/ui/RetryState';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { getTodayIsoDateLocal } from '@/lib/helpers';
import { fetchPartnerOrders } from '@/lib/orders';
import { supabase } from '@/lib/supabase';
import type { PartnerOrderWithCustomer } from '@/types/app';

export default function PartnerOrdersScreen() {
  const [orders, setOrders] = useState<PartnerOrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const today = getTodayIsoDateLocal();

  const loadOrders = useCallback(async () => {
    setFetchError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setOrders([]);
        return;
      }

      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (partnerError) throw partnerError;
      if (!partner) {
        setOrders([]);
        return;
      }

      const rows = await fetchPartnerOrders(partner.id, today);
      setOrders(rows);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
      }>
      <StatusBar style="dark" />
      <Text style={styles.title}>Orders</Text>
      <Text style={styles.subtitle}>Today&apos;s pickups and reservations</Text>

      {fetchError ? <RetryState message={fetchError} onRetry={loadOrders} /> : null}

      {!loading && orders.length === 0 ? (
        <EmptyState title="No orders yet today" />
      ) : (
        <View style={styles.list}>
          {orders.map((order) => (
            <PartnerCard key={order.id} order={order} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    ...Type.display,
    color: Palette.textPrimary,
    marginTop: Spacing.lg,
  },
  subtitle: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  list: {
    marginTop: Spacing.xs,
  },
});
