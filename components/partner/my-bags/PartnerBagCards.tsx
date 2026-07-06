import { useRouter } from 'expo-router';
import {
  Ban,
  ChevronDown,
  ChevronUp,
  Clock,
  MoreVertical,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react-native';
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
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { formatTime12h } from '@/lib/helpers';
import {
  type CountdownState,
  type PartnerBagOrder,
  type PartnerBagWithStats,
  fetchPartnerBagOrders,
  formatBagDateLabel,
  formatNprFromPaisa,
  getBagCountdownState,
  getBagDisplayStatus,
  getBagPotentialRevenuePaisa,
  getSavingsPct,
  shouldShowBagEarnedRevenue,
} from '@/lib/partnerBags';
import { hapticButtonPress, hapticHeavy, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { confirmPartnerPickup } from '@/lib/orders';
import { applyFetchedOrdersWithPickupGuard, protectPendingPickup } from '@/lib/pendingPickups';
import { normalizeOrderStatus } from '@/lib/orderStatus';
import { supabase } from '@/lib/supabase';

const BAG_STATUS_STYLES = {
  active: { bg: Palette.successBg, text: Palette.success, label: 'Active' },
  sold_out: { bg: Palette.warningBg, text: Palette.warning, label: 'Sold out' },
  expired: { bg: Palette.surfaceMuted, text: Palette.textSecondary, label: 'Expired' },
} as const;

function stripCountdownEmoji(label: string) {
  return label.replace(/^[🔴⏱🕐]\s*/, '');
}

function formatPickupRange(start: string, end: string) {
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}

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
    return (
      <View style={styles.countdownMutedRow}>
        <Clock size={13} color={Palette.textSecondary} strokeWidth={2} />
        <Text style={styles.countdownMuted}>{stripCountdownEmoji(state.label)}</Text>
      </View>
    );
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
        {stripCountdownEmoji(state.label)}
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
  icon: Icon,
  label,
  backgroundColor,
  onPress,
}: {
  icon: typeof Ban;
  label: string;
  backgroundColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.swipeActionBtn, { backgroundColor }]}>
      <Icon size={18} color={Palette.white} strokeWidth={2} />
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
  pendingPickupIdsRef?: MutableRefObject<Set<string>>;
  onPickupConfirmed?: (order: PartnerBagOrder) => void;
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
  pendingPickupIdsRef,
  onPickupConfirmed,
  onRefresh,
  onRelist,
  onSoldOut,
  onDeleted,
}: PartnerTodayBagCardProps) {
  const router = useRouter();
  const swipeRef = useRef<Swipeable>(null);
  const localLastPickupTime = useRef(0);
  const localPendingPickupIds = useRef(new Set<string>());
  const lastPickupTime = lastPickupTimeRef ?? localLastPickupTime;
  const pendingPickupIds = pendingPickupIdsRef ?? localPendingPickupIds;
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
  const potentialRevenue = getBagPotentialRevenuePaisa(bag, orders);
  const earnedRevenue = bag.revenue_earned;
  const showEarned = shouldShowBagEarnedRevenue(bag);
  const progressLabel = formatBagReservedProgressLabel(reserved, capacity, bag.reserved_orders);
  const collapsedSummary = formatCollapsedOrdersSummary(orders, {
    orderCount: bag.reserved_orders,
    bagCount: Math.max(bag.quantity_reserved, bag.reserved_orders),
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
    // Bags with ANY orders cannot be deleted due to `orders.bag_id` FK.
    // If there are active reservations, prefer "Sold out" to stop new reservations.
    if (bag.total_orders > 0) {
      const activeReserved = bag.quantity_reserved > 0 || bag.reserved_orders > 0;
      Alert.alert(
        "Can't delete",
        activeReserved
          ? 'This bag already has reservations. You can’t delete it — mark it as sold out instead.'
          : 'This bag has orders linked to it. You can’t delete it — cancel it instead.',
        activeReserved
          ? [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Mark sold out', onPress: () => void updateStatus('sold_out') },
            ]
          : [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Cancel bag', onPress: () => void updateStatus('cancelled') },
            ],
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
              const msg = error.message ?? 'Could not delete bag';
              if (msg.toLowerCase().includes('foreign key') || msg.includes('orders_bag_id_fkey')) {
                Alert.alert(
                  "Can't delete",
                  'This bag already has orders linked to it. Mark it as cancelled instead.',
                  [
                    { text: 'OK', style: 'cancel' },
                    { text: 'Cancel bag', onPress: () => void updateStatus('cancelled') },
                  ],
                );
                return;
              }
              Alert.alert('Error', msg);
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

    setOrdersLoading(true);
    try {
      const rows = await fetchPartnerBagOrders(bag.id);
      setOrders((prev) =>
        applyFetchedOrdersWithPickupGuard(rows, pendingPickupIds.current, prev ?? []),
      );
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const markAsPickedUp = async (orderId: string) => {
    const order = orders?.find((row) => row.id === orderId);
    if (!order) return;
    if (normalizeOrderStatus(order.status) === 'picked_up') return;

    try {
      setMarkingPickup(orderId);

      const pickedUpAt = new Date().toISOString();
      const result = await confirmPartnerPickup(
        { ...order, bag } as never,
        'partner_manual',
      );
      if (!result.ok) throw new Error(result.errorMessage ?? 'pickup failed');

      lastPickupTime.current = Date.now();
      protectPendingPickup(pendingPickupIds.current, orderId);

      setOrders((prev) =>
        prev?.map((row) =>
          row.id === orderId
            ? { ...row, status: 'picked_up' as const, picked_up_at: pickedUpAt }
            : row,
        ) ?? prev,
      );

      onPickupConfirmed?.(order);
      void hapticSuccess();
      setShowPickupToast(true);
    } catch (err) {
      const message =
        err instanceof Error && err.message !== 'pickup failed'
          ? err.message
          : 'Failed to confirm pickup. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setMarkingPickup(null);
    }
  };

  const showMenu = () => {
    void hapticButtonPress();
    const options = ['Edit bag', 'Mark as sold out', 'Relist tomorrow', 'Delete bag', 'Cancel'];
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
        { text: 'Edit bag', onPress: () => onSelect(0) },
        { text: 'Mark as sold out', onPress: () => onSelect(1) },
        { text: 'Relist tomorrow', onPress: () => onSelect(2) },
        { text: 'Delete bag', style: 'destructive', onPress: () => onSelect(3) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const cardBody = (
    <View style={styles.card}>
      <View
        style={[
          styles.topStrip,
          { backgroundColor: displayStatus === 'active' ? Palette.primary : Palette.textTertiary },
        ]}
      />
      {dateLabel ? <Text style={styles.dateLabel}>{dateLabel}</Text> : null}

      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {bag.title}
        </Text>
        <Pressable onPress={showMenu} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MoreVertical size={18} color={Palette.textSecondary} strokeWidth={2} />
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
        <View style={styles.pickupRow}>
          <Clock size={13} color={Palette.textSecondary} strokeWidth={2} />
          <Text style={styles.pickupPillText}>
            {formatPickupRange(bag.pickup_start, bag.pickup_end)}
          </Text>
        </View>
        {savings > 0 ? (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>{savings}% off</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.progressSection}>
        {fullyReserved ? (
          <Text style={styles.soldOutCelebration}>Sold out</Text>
        ) : null}
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: fullyReserved ? Palette.success : Palette.primary,
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

      <Pressable
        onPress={() => void toggleOrders()}
        style={({ pressed }) => [styles.ordersToggle, pressed && styles.ordersTogglePressed]}>
        <Text style={styles.ordersToggleText}>{collapsedSummary}</Text>
        {isOrdersExpanded ? (
          <ChevronUp size={16} color={Palette.textTertiary} strokeWidth={2.5} />
        ) : (
          <ChevronDown size={16} color={Palette.textTertiary} strokeWidth={2.5} />
        )}
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
            icon={Ban}
            label="Sold out"
            backgroundColor={Palette.amber}
            onPress={() => void markSoldOut()}
          />
          <SwipeActionButton
            icon={Trash2}
            label="Delete"
            backgroundColor={Palette.danger}
            onPress={() => void deleteBag()}
          />
        </View>
      )}
      renderLeftActions={() => (
        <SwipeActionButton
          icon={RefreshCw}
          label="Relist"
          backgroundColor={Palette.primary}
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
          <Text style={styles.pastPickups}> · {bag.picked_up_bags} bags picked up</Text>
        </View>
      </View>

      <View style={styles.pastRight}>
        {bag.avg_rating != null ? (
          <View style={styles.pastRatingRow}>
            <Star size={12} color={Palette.primary} fill={Palette.primary} strokeWidth={2} />
            <Text style={styles.pastRating}>{bag.avg_rating}</Text>
          </View>
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
    if (bag.status === 'sold_out' || bag.quantity_reserved >= bag.quantity_available) {
      return { label: 'Sold out', style: styles.relistBadgeGreen };
    }
    if (bag.picked_up_bags > 0) {
      return { label: `${bag.picked_up_bags} picked up`, style: styles.relistBadgeAmber };
    }
    if (bag.reserved_orders > 0) {
      return { label: `${bag.quantity_reserved} reserved`, style: styles.relistBadgeAmber };
    }
    return { label: 'No orders', style: styles.relistBadgeGray };
  })();

  return (
    <View style={styles.relistCard}>
      <Text style={styles.relistTitle} numberOfLines={2}>
        {bag.title}
      </Text>
      <Text style={styles.relistPrice}>
        {bag.revenue_earned > 0
          ? `${formatNprFromPaisa(bag.revenue_earned)} earned`
          : formatNprFromPaisa(bag.rescue_price)}
      </Text>
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
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 2,
  },
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  topStrip: {
    width: '100%',
    height: 3,
  },
  dateLabel: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md + 2,
    paddingBottom: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md + 2,
    paddingBottom: 4,
    gap: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  titleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  titleMetaLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerPrice: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  pickupRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupPillText: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  savingsBadge: {
    backgroundColor: Palette.warningBg,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  savingsText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.warning,
  },
  statusBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeActive: { backgroundColor: Palette.successBg },
  statusDot: { fontSize: 10, color: Palette.success, lineHeight: 12 },
  statusBadgeText: { ...Type.label, fontWeight: '700' },
  statusBadgeActiveText: { color: Palette.success },
  progressSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: 6 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  revenueStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  revenueStatsValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  revenueStatsPotential: {
    color: Palette.primary,
  },
  revenueStatsEarned: {
    color: Palette.success,
  },
  revenueStatsLabel: {
    ...Type.label,
    color: Palette.textSecondary,
  },
  revenueStatsEarnedLabel: {
    color: Palette.success,
  },
  progressLabel: { ...Type.label, fontWeight: '500', flexShrink: 0 },
  soldOutCelebration: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.success,
    marginBottom: 2,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.borderSubtle,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  countdownWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md + 2 },
  countdownMutedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownMuted: { ...Type.caption, color: Palette.textSecondary },
  countdownClosed: { ...Type.label, color: Palette.textTertiary },
  countdownPill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countdownAmber: { backgroundColor: Palette.warningBg },
  countdownUrgent: { backgroundColor: Palette.dangerSoft },
  countdownPillText: { ...Type.label, fontWeight: '600' },
  countdownAmberText: { color: Palette.warning },
  countdownUrgentText: { color: Palette.dangerText },
  ordersToggle: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.background,
    gap: Spacing.sm,
  },
  ordersTogglePressed: {
    backgroundColor: Palette.surfaceMuted,
  },
  ordersToggleText: {
    flex: 1,
    ...Type.caption,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  swipeActionsRow: { flexDirection: 'row', alignItems: 'stretch' },
  swipeActionBtn: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  swipeActionLabel: {
    ...Type.label,
    fontWeight: '600',
    color: Palette.white,
    textAlign: 'center',
  },
  pastCard: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  perfBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  perfSoldOut: { backgroundColor: Palette.successBg, borderColor: '#6EE7B7' },
  perfPartial: { backgroundColor: Palette.warningBg, borderColor: '#FDE68A' },
  perfNone: { backgroundColor: Palette.surfaceMuted, borderColor: Palette.border },
  perfBadgeText: { fontWeight: '700' },
  perfSoldOutText: { fontSize: 18, color: Palette.success },
  perfPartialText: { fontSize: 13, color: Palette.warning },
  perfNoneText: { fontSize: 16, color: Palette.textSecondary },
  pastCenter: { flex: 1, gap: 3 },
  pastTitle: { ...Type.bodyMedium, fontWeight: '600', color: Palette.textPrimary },
  pastDate: { ...Type.label, color: Palette.textSecondary },
  pastRevenueRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  pastRevenue: { ...Type.caption, fontWeight: '600', color: Palette.success },
  pastPickups: { ...Type.label, color: Palette.textSecondary },
  pastRight: { alignItems: 'flex-end', gap: 6 },
  pastRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pastRating: { ...Type.caption, fontWeight: '600', color: Palette.primary },
  relistLink: { ...Type.label, fontWeight: '600', color: Palette.primary },
  relistCard: {
    width: 200,
    ...CardChrome,
    borderRadius: Radius.md,
    padding: Spacing.md + 2,
    marginRight: Spacing.sm + 2,
  },
  relistTitle: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
    minHeight: 36,
  },
  relistPrice: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
    marginTop: 4,
  },
  relistBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: Spacing.sm,
  },
  relistBadgeGreen: { backgroundColor: Palette.successBg },
  relistBadgeAmber: { backgroundColor: Palette.warningBg },
  relistBadgeGray: { backgroundColor: Palette.surfaceMuted },
  relistBadgeText: { ...Type.label, fontWeight: '700', color: Palette.textPrimary },
  relistBtn: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: Spacing.sm + 2,
    alignItems: 'center',
  },
  relistBtnText: { ...Type.caption, fontWeight: '600', color: Palette.primary },
});
