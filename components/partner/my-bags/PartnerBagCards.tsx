import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Linking,
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
import { getInitials } from '@/lib/helpers';
import { hapticButtonPress, hapticHeavy, hapticWarning } from '@/lib/haptics';
import { normalizeOrderStatus } from '@/lib/orderStatus';
import { supabase } from '@/lib/supabase';
import type { OrderStatus } from '@/types/database';

const TERRACOTTA = '#D85A30';
const TEXT_SECONDARY = '#6B7280';
const TRACK = '#F0EDE8';

const AVATAR_COLORS = ['#D85A30', '#993C1D', '#B45309', '#065F46', '#1D4ED8', '#7C3AED'];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const BAG_STATUS_STYLES = {
  active: { bg: '#ECFDF5', text: '#065F46', label: '● Active' },
  sold_out: { bg: '#FEF3C7', text: '#92400E', label: 'Sold out' },
  expired: { bg: '#F3F4F6', text: '#6B7280', label: 'Expired' },
} as const;

const ORDER_STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  confirmed: { bg: '#ECFDF5', text: '#065F46', label: 'Confirmed' },
  picked_up: { bg: '#ECFDF5', text: '#065F46', label: 'Done ✓' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled' },
};

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
  const height = useSharedValue(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    height.value = withTiming(expanded ? measuredHeight : 0, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, [expanded, measuredHeight, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight > 0) {
            setMeasuredHeight(nextHeight);
          }
        }}>
        {children}
      </View>
    </Animated.View>
  );
}

function BagOrderRow({ order, onScan }: { order: PartnerBagOrder; onScan: () => void }) {
  const customerName =
    order.customer_name || order.customer?.full_name || order.customer?.phone || 'Customer';
  const phone = order.customer_phone || order.customer?.phone;
  const normalizedStatus = normalizeOrderStatus(order.status);
  const statusStyle = ORDER_STATUS_STYLES[normalizedStatus];

  return (
    <View style={styles.orderRow}>
      <View style={[styles.orderAvatar, { backgroundColor: avatarColor(customerName) }]}>
        <Text style={styles.orderAvatarText}>{getInitials(customerName)}</Text>
      </View>

      <View style={styles.orderCenter}>
        <Text style={styles.orderName}>{customerName}</Text>
        {phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${phone}`)}>
            <Text style={styles.orderPhone}>{phone}</Text>
          </Pressable>
        ) : null}
        {order.customer_note ? (
          <Text style={styles.orderNote} numberOfLines={2}>
            Note: {order.customer_note}
          </Text>
        ) : null}
        {order.quantity > 1 ? (
          <Text style={styles.orderQty}>× {order.quantity} bag(s)</Text>
        ) : null}
      </View>

      <View style={styles.orderRight}>
        <View
          style={[
            styles.orderBadge,
            { backgroundColor: statusStyle.bg },
          ]}>
          <Text style={[styles.orderBadgeText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
        {normalizedStatus === 'confirmed' ? (
          <Pressable onPress={onScan} hitSlop={8}>
            <Text style={styles.scanLink}>Scan →</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

type PartnerTodayBagCardProps = {
  bag: PartnerBagWithStats;
  dateLabel?: string;
  onRefresh: () => void;
  onRelist?: () => void;
  onSoldOut?: () => void;
  onDeleted?: (bagId: string) => void;
};

export function PartnerTodayBagCard({
  bag,
  dateLabel,
  onRefresh,
  onRelist,
  onSoldOut,
  onDeleted,
}: PartnerTodayBagCardProps) {
  const router = useRouter();
  const swipeRef = useRef<Swipeable>(null);
  const [expanded, setExpanded] = useState(false);
  const [orders, setOrders] = useState<PartnerBagOrder[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState>(() =>
    getBagCountdownState(bag.available_date, bag.pickup_start, bag.pickup_end),
  );

  const chevronRotation = useSharedValue(0);

  useEffect(() => {
    const tick = () =>
      setCountdown(getBagCountdownState(bag.available_date, bag.pickup_start, bag.pickup_end));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [bag.available_date, bag.pickup_start, bag.pickup_end]);

  useEffect(() => {
    chevronRotation.value = withTiming(expanded ? 180 : 0, { duration: 200 });
  }, [chevronRotation, expanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const displayStatus = getBagDisplayStatus(bag);
  const statusStyle = BAG_STATUS_STYLES[displayStatus === 'active' ? 'active' : displayStatus];
  const savings = getSavingsPct(bag.original_price, bag.rescue_price);
  const reserved = bag.reserved_orders;
  const capacity = bag.quantity_available;
  const fullyReserved = reserved >= capacity && capacity > 0;
  const progressPct = capacity > 0 ? Math.min(100, (reserved / capacity) * 100) : 0;
  const waitingOrders = bag.total_orders;

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
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (orders === null) {
      setOrdersLoading(true);
      try {
        const rows = await fetchPartnerBagOrders(bag.id);
        setOrders(rows);
      } catch {
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
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

  const pickupEndLabel = (() => {
    const [h, m] = bag.pickup_end.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  })();

  const cardBody = (
    <View style={styles.card}>
      {dateLabel ? <Text style={styles.dateLabel}>{dateLabel}</Text> : null}

      <View style={styles.cardTop}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {bag.title}
          </Text>
          <View style={styles.pickupPill}>
            <Text style={styles.pickupPillText}>
              {formatPickupWindow(bag.pickup_start, bag.pickup_end)}
            </Text>
          </View>
        </View>
        <Pressable onPress={showMenu} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.menuDots}>⋮</Text>
        </Pressable>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceLeft}>
          <Text style={styles.rescuePrice}>{formatNprFromPaisa(bag.rescue_price)}</Text>
          <Text style={styles.originalPrice}>{formatNprFromPaisa(bag.original_price)}</Text>
          {savings > 0 ? (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>{savings}% off</Text>
            </View>
          ) : null}
        </View>
        {displayStatus === 'active' ? (
          <ActiveStatusBadge />
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.progressSection}>
        {fullyReserved ? (
          <Text style={styles.soldOutCelebration}>Sold out! 🎉</Text>
        ) : null}
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
        {!fullyReserved ? (
          <Text style={styles.progressLabel}>
            {reserved} of {capacity} reserved
          </Text>
        ) : null}
      </View>

      <View style={styles.countdownWrap}>
        <CountdownPill state={countdown} />
      </View>

      <Pressable onPress={() => void toggleOrders()} style={styles.ordersToggle}>
        <Text style={styles.ordersToggleText}>
          📋 {waitingOrders} active order{waitingOrders === 1 ? '' : 's'}
        </Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={16} color="#9CA3AF" strokeWidth={2} />
        </Animated.View>
      </Pressable>

      <ExpandableOrders expanded={expanded}>
        <View style={styles.ordersSection}>
          {ordersLoading ? (
            <ActivityIndicator color={TERRACOTTA} style={styles.ordersLoader} />
          ) : orders && orders.length > 0 ? (
            orders.map((order) => (
              <BagOrderRow
                key={order.id}
                order={order}
                onScan={() => router.push('/(tabs)/partner/scan')}
              />
            ))
          ) : (
            <Text style={styles.ordersEmpty}>
              No reservations yet — customers can still reserve until {pickupEndLabel}
            </Text>
          )}
        </View>
      </ExpandableOrders>
    </View>
  );

  return (
    <View style={styles.cardSwipeWrap}>
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
    paddingBottom: 10,
    gap: 8,
  },
  cardTitleWrap: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  pickupPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAECE7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pickupPillText: { fontSize: 12, color: '#993C1D', fontWeight: '500' },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDots: { fontSize: 22, color: TEXT_SECONDARY, lineHeight: 24 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  priceLeft: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, flex: 1 },
  rescuePrice: { fontSize: 18, fontWeight: '700', color: TERRACOTTA },
  originalPrice: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textDecorationLine: 'line-through',
  },
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
  progressLabel: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  soldOutCelebration: { fontSize: 13, fontWeight: '600', color: '#10B981', marginBottom: 2 },
  progressTrack: {
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
  ordersToggleText: { fontSize: 13, color: '#374151', fontWeight: '600' },
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
  ordersSection: { backgroundColor: '#FAFAF9' },
  ordersLoader: { paddingVertical: 20 },
  ordersEmpty: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    padding: 16,
    lineHeight: 20,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: TRACK,
  },
  orderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderAvatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  orderCenter: { flex: 1, gap: 2 },
  orderName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  orderPhone: { fontSize: 12, color: TEXT_SECONDARY },
  orderNote: { fontSize: 12, color: TEXT_SECONDARY, fontStyle: 'italic' },
  orderQty: { fontSize: 12, color: TEXT_SECONDARY },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  orderBadgeText: { fontSize: 11, fontWeight: '700' },
  scanLink: { fontSize: 11, fontWeight: '600', color: TERRACOTTA },
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
