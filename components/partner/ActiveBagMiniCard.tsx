import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
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
import { formatTime12h } from '@/lib/helpers';
import { formatNprFromPaisa, getSavingsPct, type PartnerBagOrder } from '@/lib/partnerBags';
import type { RescueBag } from '@/types/database';

type ActiveBagMiniCardProps = {
  bag: RescueBag;
  revenueEarned?: number;
  waitingCustomers?: number;
  summaryOrders?: PartnerBagOrder[] | null;
  summaryFallback?: { orderCount: number; bagCount: number; revenuePaisa: number };
  isOrdersExpanded?: boolean;
  bagOrders?: PartnerBagOrder[] | null;
  ordersLoading?: boolean;
  markingPickup?: string | null;
  onToggleOrders?: () => void;
  onMarkPickedUp?: (orderId: string) => void;
  onPress?: () => void;
};

function formatPickupRange(start: string, end: string) {
  const toLabel = (time: string) => {
    const formatted = formatTime12h(time);
    return formatted.replace(/(am|pm)$/i, (period) => ` ${period.toUpperCase()}`);
  };
  return `${toLabel(start)} – ${toLabel(end)}`;
}

function ActiveStatusBadge() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.4, { duration: 2000 }), -1, true);
  }, [pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View style={styles.statusBadgeActive}>
      <Animated.Text style={[styles.statusDot, dotStyle]}>●</Animated.Text>
      <Text style={styles.statusBadgeActiveText}>Active</Text>
    </View>
  );
}

export const ActiveBagMiniCard = memo(function ActiveBagMiniCard({
  bag,
  waitingCustomers = 0,
  summaryOrders,
  summaryFallback,
  isOrdersExpanded = false,
  bagOrders = null,
  ordersLoading = false,
  markingPickup,
  onToggleOrders,
  onMarkPickedUp,
  onPress,
}: ActiveBagMiniCardProps) {
  const reserved = bag.quantity_reserved;
  const total = bag.quantity_available;
  const progress = total > 0 ? reserved / total : 0;
  const soldOut = total > 0 && reserved >= total;
  const isActive = bag.status === 'active';
  const savings = getSavingsPct(bag.original_price, bag.rescue_price);
  const progressLabel = formatBagReservedProgressLabel(reserved, total, waitingCustomers);
  const collapsedSummary = formatCollapsedOrdersSummary(summaryOrders ?? bagOrders, summaryFallback);

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.96 }]}>
        <View style={[styles.topStrip, { backgroundColor: isActive ? '#D85A30' : '#9CA3AF' }]} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text numberOfLines={2} style={styles.title}>
              {bag.title}
            </Text>
            <View style={styles.titleRight}>
              {isActive ? (
                <ActiveStatusBadge />
              ) : (
                <View style={styles.statusBadgeExpired}>
                  <Text style={styles.statusBadgeExpiredText}>Expired</Text>
                </View>
              )}
              <Text style={styles.headerPrice}>{formatNprFromPaisa(bag.rescue_price)}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.pickupTime}>
              {formatPickupRange(bag.pickup_start, bag.pickup_end)}
            </Text>
            {savings > 0 ? (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>{savings}% off</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, progress * 100)}%`,
                    backgroundColor: soldOut ? '#10B981' : '#D85A30',
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: progressLabel.color }]}>
              {progressLabel.text}
            </Text>
          </View>
        </View>
      </Pressable>

      <Pressable onPress={onToggleOrders} style={styles.ordersRow}>
        <Text style={styles.ordersRowText}>{collapsedSummary}</Text>
        <Text style={styles.ordersChevron}>{isOrdersExpanded ? '▴' : '▾'}</Text>
      </Pressable>

      {isOrdersExpanded ? (
        <BagOrdersExpandedPanel
          orders={bagOrders}
          loading={ordersLoading}
          markingPickup={markingPickup}
          onMarkPickedUp={onMarkPickedUp}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  topStrip: {
    width: '100%',
    height: 3,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D85A30',
  },
  statusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: {
    fontSize: 8,
    color: '#10B981',
    lineHeight: 10,
  },
  statusBadgeActiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  statusBadgeExpired: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeExpiredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  pickupTime: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  savingsBadge: {
    backgroundColor: '#FAEEDA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 0,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0EDE8',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  ordersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAF9',
    borderTopWidth: 1,
    borderTopColor: '#F0EDE8',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ordersRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  ordersChevron: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginLeft: 8,
  },
});
