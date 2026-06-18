import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { RetryState } from '@/components/ui/RetryState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import {
  formatNprPaisa,
  getPickupCountdownLabel,
  openMapsDirections,
} from '@/lib/helpers';
import { fetchCustomerOrders, submitReview } from '@/lib/orders';
import { supabase } from '@/lib/supabase';
import type { CustomerOrderWithDetails } from '@/types/app';
import type { OrderStatus } from '@/types/database';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TabKey = 'active' | 'past';

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'paid'];
const PAST_STATUSES: OrderStatus[] = ['picked_up', 'cancelled', 'refunded'];

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'paid':
      return 'Ready';
    case 'picked_up':
      return 'Picked up';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}

function statusColor(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return Palette.amber;
    case 'paid':
      return Palette.primary;
    case 'picked_up':
      return Palette.textMuted;
    case 'cancelled':
    case 'refunded':
      return '#DC2626';
    default:
      return Palette.textMuted;
  }
}

export default function MyBagsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('active');
  const [orders, setOrders] = useState<CustomerOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<CustomerOrderWithDetails | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => tick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const rows = await fetchCustomerOrders(userId);
      setOrders(rows);
    } catch (err) {
      setOrders([]);
      setFetchError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('my-bags-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const activeOrders = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)),
    [orders],
  );
  const pastOrders = useMemo(
    () => orders.filter((o) => PAST_STATUSES.includes(o.status)),
    [orders],
  );

  const listData = tab === 'active' ? activeOrders : pastOrders;

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    setReviewSubmitting(true);
    const { error } = await submitReview({
      orderId: reviewOrder.id,
      customerId: userId,
      partnerId: reviewOrder.partner_id,
      rating: reviewRating,
      comment: reviewComment,
    });
    setReviewSubmitting(false);

    if (!error) {
      setReviewOrder(null);
      setReviewComment('');
      setReviewRating(5);
      loadOrders();
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>My Bags</Text>
        <Text style={styles.subtitle}>Track pickups and leave reviews</Text>
      </View>

      <View style={styles.tabBar}>
        {(['active', 'past'] as TabKey[]).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {key === 'active' ? 'Active' : 'Past'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {fetchError ? <RetryState message={fetchError} onRetry={loadOrders} /> : null}

      {loading && listData.length === 0 ? (
        <ListSkeleton count={3} />
      ) : (
      <FlashList
        data={listData}
        keyExtractor={(item) => item.id}
        style={styles.listWrap}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && !fetchError ? (
            <EmptyState
              title="You haven't rescued any food yet! Start exploring."
              actionLabel="Find bags"
              onAction={() => router.push('/(tabs)/explore')}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          const isActive = ACTIVE_STATUSES.includes(item.status);

          return (
            <Pressable
              onPress={() => isActive && toggleExpand(item.id)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}>
              <View style={styles.cardRow}>
                <View style={styles.qrThumb}>
                  <QRCode value={item.qr_code} size={52} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.partnerName}>{item.partner.name}</Text>
                  {isActive ? (
                    <Text style={styles.countdown}>
                      {getPickupCountdownLabel(item.bag.available_date, item.bag.pickup_end)}
                    </Text>
                  ) : (
                    <Text style={styles.pastMeta}>
                      {item.bag.title} • {formatNprPaisa(item.total_price)}
                    </Text>
                  )}
                  <View style={[styles.badge, { backgroundColor: `${statusColor(item.status)}22` }]}>
                    <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                </View>
                {isActive ? (
                  <SymbolView
                    name={{
                      ios: expanded ? 'chevron.up' : 'chevron.down',
                      android: expanded ? 'expand_less' : 'expand_more',
                      web: expanded ? 'expand_less' : 'expand_more',
                    }}
                    size={18}
                    tintColor={Palette.textMuted}
                  />
                ) : null}
              </View>

              {expanded && isActive ? (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.expanded}>
                  <View style={styles.fullQr}>
                    <QRCode value={item.qr_code} size={180} />
                  </View>
                  <Text style={styles.scanHint}>Show this QR at pickup</Text>
                  <Pressable
                    onPress={() =>
                      openMapsDirections(
                        item.partner.latitude,
                        item.partner.longitude,
                        item.partner.name,
                      )
                    }
                    style={({ pressed }) => [styles.directionsBtn, pressed && { opacity: 0.9 }]}>
                    <SymbolView
                      name={{ ios: 'location.fill', android: 'navigation', web: 'navigation' }}
                      size={16}
                      tintColor={Palette.primary}
                    />
                    <Text style={styles.directionsText}>Get directions</Text>
                  </Pressable>
                </Animated.View>
              ) : null}

              {tab === 'past' && item.status === 'picked_up' && !item.review ? (
                <Pressable
                  onPress={() => setReviewOrder(item)}
                  style={({ pressed }) => [styles.reviewBtn, pressed && { opacity: 0.9 }]}>
                  <Text style={styles.reviewBtnText}>Leave a review</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        }}
      />
      )}

      <Modal visible={Boolean(reviewOrder)} transparent animationType="slide">
        <Pressable style={styles.sheetBackdrop} onPress={() => setReviewOrder(null)} />
        <View style={styles.reviewSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Rate your pickup</Text>
          <Text style={styles.sheetSubtitle}>{reviewOrder?.partner.name}</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setReviewRating(star)} style={styles.starBtn}>
                <SymbolView
                  name={{
                    ios: star <= reviewRating ? 'star.fill' : 'star',
                    android: 'star',
                    web: 'star',
                  }}
                  size={28}
                  tintColor={star <= reviewRating ? Palette.amber : Palette.textMuted}
                />
              </Pressable>
            ))}
          </View>

          <TextInput
            value={reviewComment}
            onChangeText={setReviewComment}
            placeholder="Optional comment"
            placeholderTextColor={Palette.textMuted}
            multiline
            style={styles.commentInput}
          />

          <Pressable
            onPress={handleSubmitReview}
            disabled={reviewSubmitting}
            style={({ pressed }) => [
              styles.submitReviewBtn,
              pressed && { opacity: 0.9 },
              reviewSubmitting && { opacity: 0.6 },
            ]}>
            <Text style={styles.submitReviewText}>
              {reviewSubmitting ? 'Submitting…' : 'Submit review'}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Palette.textMuted,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Palette.lightGreenBg,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  tabTextActive: {
    color: Palette.primary,
  },
  listWrap: {
    flex: 1,
  },
  list: {
    paddingBottom: 24,
    gap: 12,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Palette.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 14,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qrThumb: {
    padding: 6,
    backgroundColor: Palette.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  countdown: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.amber,
  },
  pastMeta: {
    fontSize: 13,
    color: Palette.textMuted,
    fontWeight: '600',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  expanded: {
    marginTop: 14,
    alignItems: 'center',
    gap: 10,
  },
  fullQr: {
    padding: 14,
    backgroundColor: Palette.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
  },
  scanHint: {
    color: Palette.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Palette.lightGreenBg,
  },
  directionsText: {
    color: Palette.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  reviewBtn: {
    marginTop: 12,
    backgroundColor: Palette.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewBtnText: {
    color: Palette.white,
    fontWeight: '800',
    fontSize: 14,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  reviewSheet: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: Palette.lightGreenBg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Palette.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starBtn: {
    padding: 4,
  },
  commentInput: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    borderRadius: 12,
    padding: 12,
    minHeight: 88,
    textAlignVertical: 'top',
    color: Palette.textPrimary,
    marginBottom: 14,
  },
  submitReviewBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitReviewText: {
    color: Palette.white,
    fontWeight: '900',
    fontSize: 15,
  },
});
