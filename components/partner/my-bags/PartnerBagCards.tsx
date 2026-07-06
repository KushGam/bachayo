import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  BagOrdersExpandedPanel,
  formatBagReservedProgressLabel,
  formatCollapsedOrdersSummary,
} from '@/components/partner/BagOrdersExpandedPanel';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { hapticButtonPress, hapticHeavy, hapticSuccess, hapticWarning } from '@/lib/haptics';
import {
  type CountdownState,
  type PartnerBagOrder,
  type PartnerBagWithStats,
  fetchPartnerBagOrders,
  formatBagDateLabel,
  formatNprFromPaisa,
  formatPickupWindow,
  getBagCountdownState,
  getBagDisplayStatus,
  getSavingsPct,
} from '@/lib/partnerBags';
import { confirmPartnerPickup } from '@/lib/orders';
import { applyFetchedOrdersWithPickupGuard, isPickupFetchBlocked } from '@/lib/pendingPickups';
import { supabase } from '@/lib/supabase';

const TERRACOTTA = '#D85A30';
const TEXT_SECONDARY = '#6B7280';
const TRACK = '#F0EDE8';

const BAG_STATUS_STYLES = {
  active: { bg: '#ECFDF5', text: '#065F46', label: '● Active' },
  sold_out: { bg: '#FEF3C7', text: '#92400E', label: 'Sold out' },
  expired: { bg: '#F3F4F6', text: '#6B7280', label: 'Expired' },
} as const;

function CountdownPill({ state }: { state: CountdownState }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (state.kind === 'urgent') {
      pulse.value = withRepeat(withTiming(0.6, { duration: 750 }), -1, true);
    } else {
      pulse.value = 1;
    }
  }, [pulse, state.kind]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: state.kind === 'urgent' ? pulse.value : 1,
  }));

  if (state.kind === 'closed') {
    return <Text style={styles.countdownClosed}>Pickup window closed</Text>;
  }

  if (state.kind === 'muted') {
    return <Text style={styles.countdownMuted}>{state.label}</Text>;
  }

  const isUrgent = state.kind === 'urgent';
  return (
    <Animated.View
      style={[
        styles.countdownPill,
        isUrgent ? styles.countdownUrgent : styles.countdownAmber,
        pulseStyle,
      ]}>
      <Text style={[styles.countdownPillText, isUrgent ? styles.countdownUrgentText : styles.countdownAmberText]}>
        {state.label}
      </Text>
    </Animated.View>
  );
}

function ActiveStatusBadge() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.4, { duration: 1000 }), -1, true);
  }, [pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View style={[styles.statusBadge, styles.statusBadgeActive]}>
      <Animated.Text style={[styles.statusDot, dotStyle]}>●</Animated.Text>
      <Text style={[styles.statusBadgeText, styles.statusBadgeActiveText]}>Active</Text>
    </View>
  );
}

function SwipeActionButton({
  emoji,
  label,
  backgroundColor,
  onPress,
}: {
  emoji: string;
  label: string;
  backgroundColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.swipeActionBtn, { backgroundColor }]}>
      <Text style={styles.swipeActionEmoji}>{emoji}</Text>
      <Text style={styles.swipeActionLabel}>{label}</Text>
    </Pressable>
  );
}

function ExpandableOrders({
  expanded,
  children,
}: {
  expanded: boolean;
  children: ReactNode;
}) {
  if (!expanded) return null;
  return <View>{children}</View>;
}

type PartnerTodayBagCardProps = {
  bag: PartnerBagWithStats;
  dateLabel?: string;
  isOrdersExpanded: boolean;
  onToggleOrders: (bagId: string) => void;
  lastPickupTimeRef?: MutableRefObject<number>;
  onRefresh: () => void;
  onRelist?: () => void;
  onSoldOut?: () => void;
  onDeleted?: (bagId: string) => void;
};

export function PartnerTodayBagCard({
  bag,
  dateLabel,
  isOrdersExpanded,
  onToggleOrders,
  lastPickupTimeRef,
  onRefresh,
  onRelist,
  onSoldOut,
  onDeleted,
}: PartnerTodayBagCardProps) {
  const router = useRouter();
  const swipeRef = useRef<Swipeable>(null);
  const localLastPickupTime = useRef(0);
  const lastPickupTime = lastPickupTimeRef ?? localLastPickupTime;
  const [orders, setOrders] = useState<PartnerBagOrder[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [markingPickup, setMarkingPickup] = useState<string | null>(null);
  const [showPickupToast, setShowPickupToast] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState>(() =>
    getBagCountdownState(bag.available_date, bag.pickup_start, bag.pickup_end),
  );

  useEffect(() => {
    const tick = () =>
      setCountdown(getBagCountdownState(bag.available_date, bag.pickup_start, bag.pickup_end));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [bag.available_date, bag.pickup_start, bag.pickup_end]);

  const displayStatus = getBagDisplayStatus(bag);
  const statusStyle = BAG_STATUS_STYLES[displayStatus === 'active' ? 'active' : displayStatus];
  const savings = getSavingsPct(bag.original_price, bag.rescue_price);
  const reserved = bag.quantity_reserved;
  const capacity = bag.quantity_available;
  const fullyReserved = reserved >= capacity && capacity > 0;
  const progressPct = capacity > 0 ? Math.min(100, (reserved / capacity) * 100) : 0;
  const potentialRevenue = bag.rescue_price * Math.max(0, bag.quantity_reserved);
  const earnedRevenue = bag.rescue_price * bag.picked_up_orders;
  const showEarned = bag.quantity_reserved === 0 && bag.picked_up_orders > 0;
  const progressLabel = formatBagReservedProgressLabel(reserved, capacity, bag.reserved_orders);
  const collapsedSummary = formatCollapsedOrdersSummary(orders, {
    orderCount: bag.confirmed_orders,
    bagCount: bag.quantity_reserved,
    revenuePaisa: potentialRevenue,
  });

  const closeSwipe = () => swipeRef.current?.close();

  const updateStatus = async (status: 'sold_out' | 'cancelled') => {
    const { error } = await supabase.from('rescue_bags').update({ status }).eq('id', bag.id);
    if (error) Alert.alert('Error', error.message);
    else onRefresh();
  };

  const markSoldOut = async () => {
    closeSwipe();
    await hapticHeavy();
    await updateStatus('sold_out');
    onSoldOut?.();
  };

  const confirmDeleteBag = () => {
    if (bag.confirmed_orders > 0) {
      Alert.alert(
        "Can't delete",
        `${bag.confirmed_orders} customer${bag.confirmed_orders === 1 ? '' : 's'} reserved. Mark as sold out instead.`,
      );
      return;
    }

    Alert.alert('Delete this bag?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await hapticWarning();
            const { error } = await supabase.from('rescue_bags').delete().eq('id', bag.id);
            if (error) {
              Alert.alert('Error', error.message);
              return;
            }
            onDeleted?.(bag.id);
            onRefresh();
          })();
        },
      },
    ]);
  };

  const deleteBag = () => {
    closeSwipe();
    confirmDeleteBag();
  };

  const toggleOrders = async () => {
    void hapticButtonPress();
    const willExpand = !isOrdersExpanded;
    onToggleOrders(bag.id);

    if (!willExpand) return;

    if (isPickupFetchBlocked(lastPickupTime.current)) {
      console.log('[fetchOrders] blocked — pickup just confirmed');
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    try {
      const rows = await fetchPartnerBagOrders(bag.id);
      setOrders((prev) => applyFetchedOrdersWithPickupGuard(rows, new Set(), prev ?? []));
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const markAsPickedUp = async (orderId: string) => {
    const order = orders?.find((row) => row.id === orderId);
    if (!order) return;

    try {
      setMarkingPickup(orderId);

      const pickedUpAt = new Date().toISOString();
      const result = await confirmPartnerPickup(
        { ...order, bag } as never,
        'partner_manual',
      );
      if (!result.ok) throw new Error('pickup failed');

      lastPickupTime.current = Date.now();

      setOrders((prev) =>
        prev?.map((row) =>
          row.id === orderId
            ? { ...row, status: 'picked_up' as const, picked_up_at: pickedUpAt }
            : row,
        ) ?? prev,
      );

      void hapticSuccess();
      setShowPickupToast(true);
    } catch {
      Alert.alert('Error', 'Failed to confirm pickup. Please try again.');
    } finally {
      setMarkingPickup(null);
    }
  };

  const showMenu = () => {
    void hapticButtonPress();
    const options = [
      '✏️ Edit bag',
      '🚫 Mark as sold out',
      '🔁 Relist tomorrow',
      '🗑 Delete bag',
      'Cancel',
    ];
    const destructiveIndex = 3;
    const cancelIndex = 4;

    const onSelect = (index: number) => {
      if (index === 0) router.push(`/partner/edit-bag/${bag.id}`);
      else if (index === 1) void updateStatus('sold_out');
      else if (index === 2) onRelist?.();
      else if (index === 3) confirmDeleteBag();
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
        onSelect,
      );
    } else {
      Alert.alert('Bag actions', undefined, [
        { text: '✏️ Edit bag', onPress: () => onSelect(0) },
        { text: '🚫 Mark as sold out', onPress: () => onSelect(1) },
        { text: '🔁 Relist tomorrow', onPress: () => onSelect(2) },
        { text: '🗑 Delete bag', style: 'destructive', onPress: () => onSelect(3) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const cardBody = (
    <View style={styles.card}>
      {dateLabel ? <Text style={styles.dateLabel}>{dateLabel}</Text> : null}

      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {bag.title}
        </Text>
        <Pressable onPress={showMenu} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.menuDots}>⋮</Text>
        </Pressable>
      </View>

      <View style={styles.titleMetaRow}>
        <View style={styles.titleMetaLeft}>
          {displayStatus === 'active' ? (
            <ActiveStatusBadge />
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerPrice}>{formatNprFromPaisa(bag.rescue_price)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.pickupPillText}>
          {formatPickupWindow(bag.pickup_start, bag.pickup_end).replace('🕐 ', '')}
        </Text>
        {savings > 0 ? (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>{savings}% off</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.progressSection}>
        {fullyReserved ? (
          <Text style={styles.soldOutCelebration}>Sold out! 🎉</Text>
        ) : null}
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: fullyReserved ? '#10B981' : TERRACOTTA,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: progressLabel.color }]}>
            {progressLabel.text}
          </Text>
        </View>
      </View>

      <View style={styles.revenueStatsRow}>
        <Text
          style={[
            styles.revenueStatsValue,
            showEarned ? styles.revenueStatsEarned : styles.revenueStatsPotential,
          ]}>
          {formatNprFromPaisa(showEarned ? earnedRevenue : potentialRevenue)}
        </Text>
        <Text style={[styles.revenueStatsLabel, showEarned && styles.revenueStatsEarnedLabel]}>
          {showEarned ? 'earned' : 'potential'}
        </Text>
      </View>

      <View style={styles.countdownWrap}>
        <CountdownPill state={countdown} />
      </View>

      <Pressable onPress={() => void toggleOrders()} style={styles.ordersToggle}>
        <Text style={styles.ordersToggleText}>{collapsedSummary}</Text>
        <Text style={styles.ordersChevron}>{isOrdersExpanded ? '▴' : '▾'}</Text>
      </Pressable>

      <ExpandableOrders expanded={isOrdersExpanded}>
        <BagOrdersExpandedPanel
          orders={orders}
          loading={ordersLoading}
          markingPickup={markingPickup}
          onMarkPickedUp={(orderId) => void markAsPickedUp(orderId)}
        />
      </ExpandableOrders>
    </View>
  );

  return (
    <View style={styles.cardSwipeWrap}>
      <SuccessToast
        visible={showPickupToast}
        title="Pickup confirmed! ✓"
        onHide={() => setShowPickupToast(false)}
      />
      <Swipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
      overshootRight={false}
      overshootLeft={false}
      renderRightActions={() => (
        <View style={styles.swipeActionsRow}>
          <SwipeActionButton
            emoji="🚫"
            label="Sold out"
            backgroundColor="#EF9F27"
            onPress={() => void markSoldOut()}
          />
          <SwipeActionButton
            emoji="🗑"
            label="Delete"
            backgroundColor="#E24B4A"
            onPress={() => void deleteBag()}
          />
        </View>
      )}
      renderLeftActions={() => (
        <SwipeActionButton
          emoji="🔁"
          label="Relist"
          backgroundColor={TERRACOTTA}
          onPress={() => {
            closeSwipe();
            void hapticButtonPress();
            onRelist?.();
          }}
        />
      )}>
      {cardBody}
    </Swipeable>
    </View>
  );
}

export function PartnerPastBagCard({
  bag,
  onRelist,
}: {
  bag: PartnerBagWithStats;
  onRelist: () => void;
}) {
  const badge = (() => {
    if (bag.quantity_available > 0 && bag.picked_up_orders >= bag.quantity_available) {
      return { kind: 'sold_out' as const };
    }
    if (bag.picked_up_orders > 0) {
      const pct = Math.round((bag.picked_up_orders / bag.quantity_available) * 100);
      return { kind: 'partial' as const, label: `${pct}%` };
    }
    return { kind: 'none' as const };
  })();

  const dateStr = new Date(`${bag.available_date}T12:00:00`).toLocaleDateString('en-NP', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.pastCard}>
      <View
        style={[
          styles.perfBadge,
          badge.kind === 'sold_out' && styles.perfSoldOut,
          badge.kind === 'partial' && styles.perfPartial,
          badge.kind === 'none' && styles.perfNone,
        ]}>
        <Text
          style={[
            styles.perfBadgeText,
            badge.kind === 'sold_out' && styles.perfSoldOutText,
            badge.kind === 'partial' && styles.perfPartialText,
            badge.kind === 'none' && styles.perfNoneText,
          ]}>
          {badge.kind === 'sold_out' ? '✓' : badge.kind === 'partial' ? badge.label : '0'}
        </Text>
      </View>

      <View style={styles.pastCenter}>
        <Text style={styles.pastTitle} numberOfLines={2}>
          {bag.title}
        </Text>
        <Text style={styles.pastDate}>{dateStr}</Text>
        <View style={styles.pastRevenueRow}>
          <Text style={styles.pastRevenue}>{formatNprFromPaisa(bag.revenue_earned)} earned</Text>
          <Text style={styles.pastPickups}> · {bag.picked_up_orders} pickups</Text>
        </View>
      </View>

      <View style={styles.pastRight}>
        {bag.avg_rating != null ? (
          <Text style={styles.pastRating}>★ {bag.avg_rating}</Text>
        ) : null}
        <Pressable onPress={onRelist} hitSlop={8}>
          <Text style={styles.relistLink}>Relist →</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function RelistCard({ bag, onRelist }: { bag: PartnerBagWithStats; onRelist: () => void }) {
  const badge = (() => {
    if (bag.status === 'sold_out' || bag.reserved_orders >= bag.quantity_available) {
      return { label: '🎉 Sold out', style: styles.relistBadgeGreen };
    }
    if (bag.picked_up_orders > 0 || bag.reserved_orders > 0) {
      const sold = bag.picked_up_orders || bag.reserved_orders;
      return { label: `⚡ ${sold} sold`, style: styles.relistBadgeAmber };
    }
    return { label: '0 orders', style: styles.relistBadgeGray };
  })();

  return (
    <View style={styles.relistCard}>
      <Text style={styles.relistTitle} numberOfLines={2}>
        {bag.title}
      </Text>
      <Text style={styles.relistPrice}>{formatNprFromPaisa(bag.rescue_price)}</Text>
      <View style={[styles.relistBadge, badge.style]}>
        <Text style={styles.relistBadgeText}>{badge.label}</Text>
      </View>
      <Pressable onPress={onRelist} style={styles.relistBtn}>
        <Text style={styles.relistBtnText}>Relist today →</Text>
      </Pressable>
    </View>
  );
}

export function formatUpcomingDateLabel(isoDate: string) {
  return formatBagDateLabel(isoDate);
}

const styles = StyleSheet.create({
  cardSwipeWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  titleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  titleMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: TERRACOTTA,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDots: { fontSize: 22, color: TEXT_SECONDARY, lineHeight: 24 },
  pickupPillText: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: '400' },
  savingsBadge: {
    backgroundColor: '#FAEEDA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  savingsText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeActive: { backgroundColor: '#ECFDF5' },
  statusDot: { fontSize: 10, color: '#065F46', lineHeight: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statusBadgeActiveText: { color: '#065F46' },
  progressSection: { paddingHorizontal: 16, marginBottom: 12, gap: 6 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  revenueStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  revenueStatsValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  revenueStatsPotential: {
    color: TERRACOTTA,
  },
  revenueStatsEarned: {
    color: '#065F46',
  },
  revenueStatsLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  revenueStatsEarnedLabel: {
    color: '#065F46',
  },
  progressLabel: { fontSize: 12, fontWeight: '500', flexShrink: 0 },
  soldOutCelebration: { fontSize: 13, fontWeight: '600', color: '#10B981', marginBottom: 2 },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: TRACK,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  countdownWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  countdownMuted: { fontSize: 13, color: TEXT_SECONDARY },
  countdownClosed: { fontSize: 12, color: '#9CA3AF' },
  countdownPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countdownAmber: { backgroundColor: '#FEF3C7' },
  countdownUrgent: { backgroundColor: '#FEE2E2' },
  countdownPillText: { fontSize: 12, fontWeight: '600' },
  countdownAmberText: { color: '#92400E' },
  countdownUrgentText: { color: '#991B1B' },
  ordersToggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: TRACK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAF9',
  },
  ordersToggleText: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '600' },
  ordersChevron: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginLeft: 8 },
  swipeActionsRow: { flexDirection: 'row', alignItems: 'stretch' },
  swipeActionBtn: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  swipeActionEmoji: { fontSize: 18 },
  swipeActionLabel: { fontSize: 11, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  pastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  perfBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  perfSoldOut: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  perfPartial: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  perfNone: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  perfBadgeText: { fontWeight: '700' },
  perfSoldOutText: { fontSize: 20, color: '#065F46' },
  perfPartialText: { fontSize: 14, color: '#92400E' },
  perfNoneText: { fontSize: 18, color: '#6B7280' },
  pastCenter: { flex: 1, gap: 3 },
  pastTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  pastDate: { fontSize: 12, color: TEXT_SECONDARY },
  pastRevenueRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  pastRevenue: { fontSize: 13, fontWeight: '600', color: '#065F46' },
  pastPickups: { fontSize: 12, color: TEXT_SECONDARY },
  pastRight: { alignItems: 'flex-end', gap: 6 },
  pastRating: { fontSize: 13, fontWeight: '600', color: TERRACOTTA },
  relistLink: { fontSize: 12, fontWeight: '600', color: TERRACOTTA },
  relistCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: TRACK,
    marginRight: 10,
  },
  relistTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', minHeight: 36 },
  relistPrice: { fontSize: 13, fontWeight: '700', color: TERRACOTTA, marginTop: 4 },
  relistBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  relistBadgeGreen: { backgroundColor: '#ECFDF5' },
  relistBadgeAmber: { backgroundColor: '#FEF3C7' },
  relistBadgeGray: { backgroundColor: '#F3F4F6' },
  relistBadgeText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  relistBtn: {
    backgroundColor: '#FAECE7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  relistBtnText: { fontSize: 13, fontWeight: '600', color: TERRACOTTA },
});
