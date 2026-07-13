import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Ban,
  CheckCircle2,
  ShoppingBag,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PartnerEditHeader } from '@/components/partner/PartnerEditHeader';
import { RetryState } from '@/components/ui/RetryState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { formatNprPaisa } from '@/lib/helpers';
import { hapticButtonPress } from '@/lib/haptics';
import {
  fetchPartnerPeriodStats,
  type PartnerPeriodStats,
  type ReportPeriod,
} from '@/lib/partnerReports';
import { supabase } from '@/lib/supabase';
import { usePartnerStore } from '@/store/usePartnerStore';

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

export default function PartnerReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const partner = usePartnerStore((s) => s.partner);
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [rangeLabel, setRangeLabel] = useState('');
  const [periodLabel, setPeriodLabel] = useState('Last 7 days');
  const [stats, setStats] = useState<PartnerPeriodStats | null>(null);

  const load = useCallback(
    async (nextPeriod: ReportPeriod, silent = false) => {
      if (!silent) setLoading(true);
      setErrorText(null);

      try {
        let partnerId = partner?.id;
        if (!partnerId) {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData.session?.user?.id;
          if (!userId) {
            setStats(null);
            setErrorText('Sign in to view reports');
            return;
          }
          const { data } = await supabase
            .from('partners')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          partnerId = data?.id;
        }
        if (!partnerId) {
          setStats(null);
          setErrorText('Partner profile not found');
          return;
        }

        const result = await fetchPartnerPeriodStats(partnerId, nextPeriod);
        setStats(result.stats);
        setRangeLabel(result.range.rangeLabel);
        setPeriodLabel(result.range.label);
      } catch (error) {
        setErrorText(error instanceof Error ? error.message : 'Failed to load reports');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [partner?.id],
  );

  useFocusEffect(
    useCallback(() => {
      void load(period);
    }, [load, period]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load(period, true);
  };

  const metrics = stats
    ? [
        {
          key: 'revenue',
          label: 'Revenue',
          value: formatNprPaisa(stats.revenue),
          icon: Wallet,
          accent: true,
        },
        {
          key: 'listed',
          label: 'Bags listed',
          value: String(stats.bagsListed),
          icon: ShoppingBag,
        },
        {
          key: 'reserved',
          label: 'Reserved',
          value: String(stats.reserved),
          icon: TrendingUp,
        },
        {
          key: 'picked',
          label: 'Picked up',
          value: String(stats.pickedUp),
          icon: CheckCircle2,
        },
        {
          key: 'cancelled',
          label: 'Cancelled',
          value: String(stats.cancelled),
          icon: Ban,
        },
        {
          key: 'rating',
          label: 'Avg rating',
          value: stats.avgRating != null ? stats.avgRating.toFixed(1) : '—',
          hint: stats.reviewCount > 0 ? `${stats.reviewCount} review${stats.reviewCount === 1 ? '' : 's'}` : 'No reviews',
          icon: Star,
        },
      ]
    : [];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <PartnerEditHeader title="Reports" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
        }>
        <View style={styles.periodRow}>
          {PERIODS.map((item) => {
            const active = period === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (period === item.key) return;
                  void hapticButtonPress();
                  setPeriod(item.key);
                }}
                style={[styles.periodChip, active && styles.periodChipActive]}>
                <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.rangeLabel}>
          {periodLabel}
          {rangeLabel ? ` · ${rangeLabel}` : ''}
        </Text>

        {errorText ? (
          <View style={styles.errorWrap}>
            <RetryState message={errorText} onRetry={() => void load(period)} />
          </View>
        ) : null}

        {loading && !stats ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={88} borderRadius={Radius.lg} />
            <Skeleton height={88} borderRadius={Radius.lg} style={{ marginTop: Spacing.sm }} />
            <Skeleton height={88} borderRadius={Radius.lg} style={{ marginTop: Spacing.sm }} />
          </View>
        ) : null}

        {!errorText && stats ? (
          <View style={styles.grid}>
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <View
                  key={metric.key}
                  style={[styles.metricCard, metric.accent && styles.metricCardAccent]}>
                  <View style={styles.metricTop}>
                    <View
                      style={[
                        styles.metricIcon,
                        metric.accent && styles.metricIconAccent,
                      ]}>
                      <Icon
                        size={16}
                        color={metric.accent ? Palette.primary : Palette.textSecondary}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[
                        styles.metricLabel,
                        metric.accent && styles.metricLabelAccent,
                      ]}>
                      {metric.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.metricValue,
                      metric.accent && styles.metricValueAccent,
                    ]}
                    numberOfLines={1}>
                    {metric.value}
                  </Text>
                  {metric.hint ? <Text style={styles.metricHint}>{metric.hint}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {!loading && !errorText && stats ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>How to read this</Text>
            <Text style={styles.noteBody}>
              Revenue counts active and completed reservations created in this period. Picked up
              uses the pickup date. Use this to decide how many bags to list next week.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/partner/my-bags')}
              style={styles.noteLink}>
              <Text style={styles.noteLinkText}>View My Bags →</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  periodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  periodChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  periodChipText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  periodChipTextActive: {
    color: Palette.white,
  },
  rangeLabel: {
    ...Type.caption,
    color: Palette.textTertiary,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  skeletonWrap: {
    paddingHorizontal: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  metricCard: {
    width: '48.5%',
    flexGrow: 1,
    ...CardChrome,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    minHeight: 108,
    ...FloatingShadow,
  },
  metricCardAccent: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.primaryLightAlt,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconAccent: {
    backgroundColor: Palette.white,
  },
  metricLabel: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  metricLabelAccent: {
    color: Palette.primaryDark,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  metricValueAccent: {
    color: Palette.primary,
  },
  metricHint: {
    ...Type.label,
    color: Palette.textTertiary,
    marginTop: 4,
  },
  noteCard: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
    padding: Spacing.lg,
  },
  noteTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  noteBody: {
    ...Type.caption,
    color: Palette.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  noteLink: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  noteLinkText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
});
