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
import { formatBagServiceBadge, formatTime12h } from '@/lib/helpers';
import {
  type CountdownState,
  type PartnerBagOrder,
  type PartnerBagWithStats,
  deletePartnerBagListing,
  fetchPartnerBagOrders,
  formatBagDateLabel,
  formatNprFromPaisa,
  getBagCountdownState,
  getBagDisplayStatus,
  getBagPotentialRevenuePaisa,
  getSavingsPct,
  markBagUnavailableWithNotification,
  shouldShowBagEarnedRevenue,
} from '@/lib/partnerBags';
import { hapticButtonPress, hapticHeavy, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { applyFetchedOrdersWithPickupGuard, protectPendingPickup } from '@/lib/pendingPickups';
import { normalizeOrderStatus } from '@/lib/orderStatus';
import { confirmPartnerPickupWithOverridePrompt } from '@/lib/partnerPickupUi';
import { usePartnerStore } from '@/store/usePartnerStore';
import { useBagsStore } from '@/store/useBagsStore';

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
  onOpenChat?: (orderId: string) => void;
  unreadByOrder?: Record<string, number>;
  ordersRefreshKey?: number;
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
  onOpenChat,
  unreadByOrder,
  ordersRefreshKey = 0,
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

  useEffect(() => {
    if (!isOrdersExpanded) return;
    let cancelled = false;
    void (async () => {
      setOrdersLoading(true);
      try {
        const rows = await fetchPartnerBagOrders(bag.id);
        if (cancelled) return;
        setOrders((prev) =>
          applyFetchedOrdersWithPickupGuard(rows, pendingPickupIds.current, prev ?? []),
        );
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bag.id, isOrdersExpanded, ordersRefreshKey, pendingPickupIds]);

  const displayStatus = getBagDisplayStatus(bag);
  const statusStyle = BAG_STATUS_STYLES[displayStatus === 'active' ? 'active' : displayStatus];
  const savings = getSavingsPct(bag.original_price, bag.rescue_price);
  const serviceBadge = formatBagServiceBadge(bag);
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
    const partnerName = usePartnerStore.getState().partner?.name ?? 'The restaurant';
    const result = await markBagUnavailableWithNotification({
      bagId: bag.id,
      reason: status,
      partnerName,
    });

    if (!result.success) {
      Alert.alert('Error', result.error || 'Could not update bag.');
      return;
    }

    useBagsStore.getState().applyBagStock(bag.id, {
      status,
      quantity_reserved: 0,
    });

    Alert.alert(
      status === 'sold_out' ? 'Bag marked sold out' : 'Bag cancelled',
      result.notifiedCount > 0
        ? `${result.notifiedCount} customer(s) have been notified that their reservation was cancelled.`
        : 'Bag updated successfully.',
      [{ text: 'OK' }],
    );
    onRefresh();
  };

  const markSoldOut = async () => {
    closeSwipe();
    await hapticHeavy();
    await updateStatus('sold_out');
    onSoldOut?.();
  };

  const confirmDeleteBag = () => {
    const reservedGuess = Math.max(bag.quantity_reserved, bag.reserved_orders);
    Alert.alert(
      'Delete this bag?',
      reservedGuess > 0
        ? `${reservedGuess} customer${reservedGuess === 1 ? '' : 's'} reserved — they will be notified and their reservations cancelled.`
        : 'This removes the listing from customers. Past pickups stay in your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await hapticWarning();
              const partnerName = usePartnerStore.getState().partner?.name ?? 'The restaurant';
              const result = await deletePartnerBagListing({
                bagId: bag.id,
                partnerName,
              });

              if (!result.ok) {
                Alert.alert('Error', result.message);
                return;
              }

              useBagsStore.getState().applyBagStock(bag.id, {
                status: 'cancelled',
                quantity_reserved: 0,
              });

              Alert.alert(
                'Bag deleted',
                result.notifiedCount > 0
                  ? `${result.notifiedCount} customer(s) have been notified that their reservation was cancelled.`
                  : 'Bag removed successfully.',
                [{ text: 'OK' }],
              );

              onDeleted?.(bag.id);
              onRefresh();
            })();
          },
        },
      ],
    );
  };

  const deleteBag = () => {
    closeSwipe();
    confirmDeleteBag();
  };

  const toggleOrders = async () => {
    void hapticButtonPress();
    onToggleOrders(bag.id);
  };

  const markAsPickedUp = async (orderId: string) => {
    const order = orders?.find((row) => row.id === orderId);
    if (!order) return;
    if (normalizeOrderStatus(order.status) === 'picked_up') return;

    try {
      setMarkingPickup(orderId);

      const pickedUpAt = new Date().toISOString();
      const result = await confirmPartnerPickupWithOverridePrompt(
        { ...order, bag } as never,
        'partner_manual',
      );
      if (!result.ok) {
        if (result.errorMessage) {
          throw new Error(result.errorMessage);
        }
        return;
      }

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
        err instanceof Error ? err.message : 'Failed to confirm pickup. Please try again.';
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
          <Text style={styles.headerPrice}>{formatNprFromPaisa(bag.rescue_price)}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.pickupRow}>
          <Clock size={13} color={Palette.textSecondary} strokeWidth={2} />
          <Text style={styles.pickupPillText}>
            {formatPickupRange(bag.pickup_start, bag.pickup_end)}
          </Text>
        </View>
        <View style={styles.metaBadges}>
          {serviceBadge ? (
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>{serviceBadge}</Text>
            </View>
          ) : null}
          {savings > 0 ? (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>{savings}% off</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          {fullyReserved ? (
            <Text style={styles.soldOutCelebration}>Sold out</Text>
          ) : (
            <Text style={[styles.progressLabel, { color: progressLabel.color }]}>
              {progressLabel.text}
            </Text>
          )}
        </View>
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
      </View>

      <View style={styles.footerRow}>
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
          bag={{
            title: bag.title,
            quantity_available: bag.quantity_available,
            quantity_reserved: bag.quantity_reserved,
            max_per_customer: bag.max_per_customer,
          }}
          markingPickup={markingPickup}
          onMarkPickedUp={(orderId) => void markAsPickedUp(orderId)}
          onOpenChat={onOpenChat}
          onQuantityUpdated={(updated) => {
            setOrders((prev) =>
              (prev ?? []).map((row) => (row.id === updated.id ? { ...row, ...updated } : row)),
            );
          }}
          unreadByOrder={unreadByOrder}
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
  isOrdersExpanded = false,
  onToggleOrders,
  ordersRefreshKey = 0,
}: {
  bag: PartnerBagWithStats;
  onRelist: () => void;
  isOrdersExpanded?: boolean;
  onToggleOrders?: (bagId: string) => void;
  ordersRefreshKey?: number;
}) {
  const [orders, setOrders] = useState<PartnerBagOrder[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

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

  const orderCount = bag.total_orders;
  const canExpand = orderCount > 0;

  useEffect(() => {
    if (!isOrdersExpanded) return;
    let cancelled = false;
    void (async () => {
      setOrdersLoading(true);
      try {
        const rows = await fetchPartnerBagOrders(bag.id, { includeCancelled: true });
        if (!cancelled) setOrders(rows);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bag.id, isOrdersExpanded, ordersRefreshKey]);

  const toggleOrders = () => {
    if (!canExpand || !onToggleOrders) return;
    void hapticButtonPress();
    onToggleOrders(bag.id);
  };

  return (
    <View style={styles.pastCardWrap}>
      <Pressable
        onPress={toggleOrders}
        disabled={!canExpand}
        style={({ pressed }) => [styles.pastCard, pressed && canExpand && { opacity: 0.96 }]}>
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
          {canExpand ? (
            <Text style={styles.pastOrdersHint}>
              {orderCount} order{orderCount === 1 ? '' : 's'} · tap to view
            </Text>
          ) : (
            <Text style={styles.pastOrdersHint}>No orders</Text>
          )}
        </View>

        <View style={styles.pastRight}>
          {bag.avg_rating != null ? (
            <View style={styles.pastRatingRow}>
              <Star size={12} color={Palette.primary} fill={Palette.primary} strokeWidth={2} />
              <Text style={styles.pastRating}>{bag.avg_rating}</Text>
            </View>
          ) : null}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onRelist();
            }}
            hitSlop={8}>
            <Text style={styles.relistLink}>Relist →</Text>
          </Pressable>
          {canExpand ? (
            isOrdersExpanded ? (
              <ChevronUp size={16} color={Palette.textTertiary} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={16} color={Palette.textTertiary} strokeWidth={2.5} />
            )
          ) : null}
        </View>
      </Pressable>

      {isOrdersExpanded ? (
        <BagOrdersExpandedPanel
          orders={orders}
          loading={ordersLoading}
          historyMode
        />
      ) : null}
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
  const serviceBadge = formatBagServiceBadge(bag);

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
      {serviceBadge ? (
        <Text style={styles.relistService} numberOfLines={1}>
          {serviceBadge}
        </Text>
      ) : null}
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
    marginBottom: Spacing.md,
  },
  card: {
    ...CardChrome,
    borderRadius: 20,
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
    paddingBottom: 2,
    gap: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  titleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  titleMetaLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.primary,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  pickupRow: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  pickupPillText: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
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
  serviceBadge: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  serviceBadgeText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
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
  progressSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Palette.background,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md + 2,
    gap: Spacing.sm,
  },
  revenueStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexShrink: 1,
  },
  revenueStatsValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  revenueStatsPotential: {
    color: Palette.textPrimary,
  },
  revenueStatsEarned: {
    color: Palette.success,
  },
  revenueStatsLabel: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  revenueStatsEarnedLabel: {
    color: Palette.success,
  },
  progressLabel: { ...Type.caption, fontWeight: '600', flexShrink: 1 },
  soldOutCelebration: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.success,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: Palette.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
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
    paddingVertical: 5,
  },
  countdownAmber: { backgroundColor: Palette.warningBg },
  countdownUrgent: { backgroundColor: Palette.dangerSoft },
  countdownPillText: { ...Type.label, fontWeight: '700' },
  countdownAmberText: { color: Palette.warning },
  countdownUrgentText: { color: Palette.dangerText },
  ordersToggle: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    gap: Spacing.sm,
  },
  ordersTogglePressed: {
    backgroundColor: Palette.surfaceMuted,
  },
  ordersToggleText: {
    flex: 1,
    ...Type.caption,
    color: Palette.textSecondary,
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
  pastCardWrap: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    ...CardChrome,
    overflow: 'hidden',
  },
  pastCard: {
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
  pastOrdersHint: {
    ...Type.label,
    color: Palette.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
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
  relistService: {
    ...Type.label,
    fontWeight: '600',
    color: Palette.textSecondary,
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
