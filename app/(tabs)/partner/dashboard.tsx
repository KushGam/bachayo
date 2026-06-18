import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PartnerCard } from '@/components/cards/PartnerCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { RetryState } from '@/components/ui/RetryState';
import { StatsSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { formatNprPaisa, getTodayIsoDateLocal } from '@/lib/helpers';
import { fetchPartnerOrders } from '@/lib/orders';
import { supabase } from '@/lib/supabase';
import type { PartnerOrderWithCustomer } from '@/types/app';
import type { Partner } from '@/types/database';

type TodayStats = {
  bagsListed: number;
  reserved: number;
  pickedUp: number;
  revenue: number;
};

export default function PartnerDashboardScreen() {
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [orders, setOrders] = useState<PartnerOrderWithCustomer[]>([]);
  const [stats, setStats] = useState<TodayStats>({
    bagsListed: 0,
    reserved: 0,
    pickedUp: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const today = getTodayIsoDateLocal();

  const loadData = useCallback(async () => {
    setFetchError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (partnerError) throw partnerError;

      if (!partnerData) {
        setPartner(null);
        setOrders([]);
        setLoading(false);
        return;
      }

      setPartner(partnerData);

      const [{ data: bags }, orderRows] = await Promise.all([
        supabase
          .from('rescue_bags')
          .select('id, quantity_available, quantity_reserved, rescue_price, status')
          .eq('partner_id', partnerData.id)
          .eq('available_date', today),
        fetchPartnerOrders(partnerData.id, today),
      ]);

      const bagList = bags ?? [];
      const reserved = bagList.reduce((sum, b) => sum + b.quantity_reserved, 0);
      const pickedUp = orderRows.filter((o) => o.status === 'picked_up').length;
      const revenue = orderRows
        .filter((o) => o.status === 'paid' || o.status === 'picked_up')
        .reduce((sum, o) => sum + o.total_price, 0);

      setStats({
        bagsListed: bagList.length,
        reserved,
        pickedUp,
        revenue,
      });
      setOrders(orderRows);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!partner) return;

    const channel = supabase
      .channel('partner-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_bags' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partner, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const statCards = useMemo(
    () => [
      { label: 'Bags listed', value: String(stats.bagsListed) },
      { label: 'Reserved', value: String(stats.reserved) },
      { label: 'Picked up', value: String(stats.pickedUp) },
      { label: 'Revenue', value: formatNprPaisa(stats.revenue) },
    ],
    [stats],
  );

  if (!loading && !partner) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Partner dashboard</Text>
        <Text style={styles.emptyText}>Complete partner onboarding to access this screen.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
      }>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle}>{partner?.name ?? 'Loading…'}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/partner/scan')}
          style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.9 }]}>
          <SymbolView
            name={{ ios: 'qrcode.viewfinder', android: 'qr_code_scanner', web: 'qr_code_scanner' }}
            size={20}
            tintColor={Palette.white}
          />
          <Text style={styles.scanBtnText}>Scan</Text>
        </Pressable>
      </View>

      {loading ? (
        <StatsSkeleton />
      ) : (
      <View style={styles.statsGrid}>
        {statCards.map((card) => (
          <View key={card.label} style={styles.statCard}>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
        ))}
      </View>
      )}

      {fetchError ? <RetryState message={fetchError} onRetry={loadData} /> : null}

      {!loading && partner && stats.bagsListed === 0 ? (
        <EmptyState
          title="Add your first rescue bag for today"
          actionLabel="Add bag"
          onAction={() => router.push('/partner/add-bag')}
        />
      ) : null}

      <Pressable
        onPress={() => router.push('/partner/add-bag')}
        style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}>
        <SymbolView
          name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
          size={20}
          tintColor={Palette.primary}
        />
        <Text style={styles.addBtnText}>Add rescue bag for today</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Today&apos;s orders</Text>
      {orders.length === 0 ? (
        <Text style={styles.emptyText}>{loading ? 'Loading…' : 'No orders yet today'}</Text>
      ) : (
        orders.map((item) => <PartnerCard key={item.id} order={item} />)
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
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Palette.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  scanBtnText: {
    color: Palette.white,
    fontWeight: '800',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: Palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 14,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Palette.textMuted,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.lightGreenBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  addBtnText: {
    color: Palette.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.textPrimary,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: Palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  customerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  qrStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  qrStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  qrStatusDone: {
    backgroundColor: Palette.lightGreenBg,
  },
  qrStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  qrStatusTextPending: {
    color: Palette.amber,
  },
  qrStatusTextDone: {
    color: Palette.primary,
  },
  orderMeta: {
    fontSize: 13,
    color: Palette.textMuted,
    fontWeight: '600',
  },
  emptyText: {
    color: Palette.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
