import { ChevronDown, ChevronUp } from 'lucide-react-native';
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
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
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
        <View style={[styles.topStrip, { backgroundColor: isActive ? Palette.primary : Palette.textTertiary }]} />

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
                    backgroundColor: soldOut ? Palette.success : Palette.primary,
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

      <Pressable
        onPress={onToggleOrders}
        style={({ pressed }) => [styles.ordersRow, pressed && styles.ordersRowPressed]}>
        <Text style={styles.ordersRowText}>{collapsedSummary}</Text>
        {isOrdersExpanded ? (
          <ChevronUp size={16} color={Palette.textTertiary} strokeWidth={2.5} />
        ) : (
          <ChevronDown size={16} color={Palette.textTertiary} strokeWidth={2.5} />
        )}
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
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm + 2,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  topStrip: {
    width: '100%',
    height: 3,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md + 2,
    paddingBottom: Spacing.md + 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
    lineHeight: 20,
  },
  titleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerPrice: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.primary,
  },
  statusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.successBg,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: {
    fontSize: 8,
    color: Palette.success,
    lineHeight: 10,
  },
  statusBadgeActiveText: {
    ...Type.label,
    fontWeight: '600',
    color: Palette.success,
  },
  statusBadgeExpired: {
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeExpiredText: {
    ...Type.label,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  pickupTime: {
    flex: 1,
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
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressLabel: {
    ...Type.label,
    fontWeight: '500',
    flexShrink: 0,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.borderSubtle,
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
    backgroundColor: Palette.background,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  ordersRowPressed: {
    backgroundColor: Palette.surfaceMuted,
  },
  ordersRowText: {
    flex: 1,
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
});
