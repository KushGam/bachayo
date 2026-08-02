import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Ban,
  CalendarRange,
  CheckCircle2,
  Download,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PartnerEditHeader } from '@/components/partner/PartnerEditHeader';
import { TimePickerSheet } from '@/components/partner/TimePickerSheet';
import { RetryState } from '@/components/ui/RetryState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { formatNprPaisa, getTodayIsoDateLocal } from '@/lib/helpers';
import { hapticButtonPress, hapticSuccess } from '@/lib/haptics';
import {
  buildPartnerReportShareText,
  fetchPartnerPeriodStats,
  type PartnerPeriodCompare,
  type PartnerPeriodRange,
  type PartnerPeriodStats,
  type PartnerReportDayPoint,
  type ReportPeriod,
} from '@/lib/partnerReports';
import { supabase } from '@/lib/supabase';
import { usePartnerStore } from '@/store/usePartnerStore';

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'custom', label: 'Custom' },
];

function isoFromDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dateFromIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatChipDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-NP', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDelta(pct: number | null) {
  if (pct == null) return null;
  if (pct === 0) return 'Same as last period';
  const arrow = pct > 0 ? '↑' : '↓';
  return `${arrow} ${Math.abs(pct)}% vs last period`;
}

function DeltaText({
  pct,
  goodWhenUp = true,
  onDark = false,
}: {
  pct: number | null;
  goodWhenUp?: boolean;
  onDark?: boolean;
}) {
  const label = formatDelta(pct);
  if (!label || pct == null) return null;
  const positive = pct > 0;
  const good = goodWhenUp ? positive : !positive;
  if (onDark) {
    return (
      <Text style={[styles.deltaOnDark, good ? styles.deltaOnDarkGood : styles.deltaOnDarkBad]}>
        {label}
      </Text>
    );
  }
  return (
    <Text style={[styles.delta, good ? styles.deltaGood : styles.deltaBad]}>{label}</Text>
  );
}

function MiniBars({ series }: { series: PartnerReportDayPoint[] }) {
  const max = Math.max(1, ...series.map((point) => Math.max(point.pickedUp, point.reserved)));
  const hasActivity = series.some((point) => point.pickedUp > 0 || point.reserved > 0);

  if (!hasActivity) {
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily activity</Text>
        <Text style={styles.chartEmpty}>No reservations or pickups in this range.</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHead}>
        <Text style={styles.chartTitle}>Daily activity</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendReserved]} />
            <Text style={styles.legendText}>Reserved</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendPicked]} />
            <Text style={styles.legendText}>Picked</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barsScroll}>
        {series.map((point) => {
          const reservedH = Math.max(point.reserved > 0 ? 8 : 0, (point.reserved / max) * 84);
          const pickedH = Math.max(point.pickedUp > 0 ? 8 : 0, (point.pickedUp / max) * 84);
          return (
            <View key={point.date} style={[styles.barCol, series.length <= 8 && styles.barColFlex]}>
              <View style={styles.barTrack}>
                <View style={[styles.barReserved, { height: reservedH }]} />
                <View style={[styles.barPicked, { height: pickedH }]} />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {point.label || '·'}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function PartnerReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const partner = usePartnerStore((s) => s.partner);
  const todayIso = getTodayIsoDateLocal();
  const todayDate = useMemo(() => dateFromIso(todayIso), [todayIso]);

  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [customStart, setCustomStart] = useState(() => {
    const d = dateFromIso(todayIso);
    d.setDate(d.getDate() - 6);
    return isoFromDate(d);
  });
  const [customEnd, setCustomEnd] = useState(todayIso);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [stats, setStats] = useState<PartnerPeriodStats | null>(null);
  const [compare, setCompare] = useState<PartnerPeriodCompare | null>(null);
  const [series, setSeries] = useState<PartnerReportDayPoint[]>([]);
  const [activeRange, setActiveRange] = useState<PartnerPeriodRange | null>(null);
  const loadTokenRef = useRef(0);

  const load = useCallback(
    async (
      nextPeriod: ReportPeriod,
      nextCustom?: { startDate: string; endDate: string },
      silent = false,
    ) => {
      const token = ++loadTokenRef.current;
      if (!silent) setLoading(true);
      setErrorText(null);

      try {
        let partnerId = partner?.id;
        if (!partnerId) {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData.session?.user?.id;
          if (!userId) {
            if (token !== loadTokenRef.current) return;
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
          if (token !== loadTokenRef.current) return;
          setStats(null);
          setErrorText('Partner profile not found');
          return;
        }

        const custom =
          nextPeriod === 'custom'
            ? nextCustom ?? { startDate: customStart, endDate: customEnd }
            : null;
        const result = await fetchPartnerPeriodStats(partnerId, nextPeriod, custom);
        if (token !== loadTokenRef.current) return;

        setStats(result.stats);
        setCompare(result.compare);
        setSeries(result.series);
        setActiveRange(result.range);
      } catch (error) {
        if (token !== loadTokenRef.current) return;
        setErrorText(error instanceof Error ? error.message : 'Failed to load reports');
      } finally {
        if (token === loadTokenRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [customEnd, customStart, partner?.id],
  );

  useFocusEffect(
    useCallback(() => {
      void load(period);
    }, [load, period]),
  );

  const selectPeriod = (next: ReportPeriod) => {
    void hapticButtonPress();
    setPeriod(next);
    if (next !== 'custom') {
      void load(next);
    } else {
      void load('custom', { startDate: customStart, endDate: customEnd });
    }
  };

  const applyCustomDate = (target: 'start' | 'end', nextDate: Date) => {
    let nextStart = customStart;
    let nextEnd = customEnd;
    const nextIso = isoFromDate(nextDate);

    if (target === 'start') {
      nextStart = nextIso > customEnd ? customEnd : nextIso;
      setCustomStart(nextStart);
    } else {
      const capped = nextIso > todayIso ? todayIso : nextIso;
      nextEnd = capped < customStart ? customStart : capped;
      setCustomEnd(nextEnd);
    }

    setPeriod('custom');
    void load('custom', { startDate: nextStart, endDate: nextEnd });
  };

  const onRefresh = () => {
    setRefreshing(true);
    void load(period, undefined, true);
  };

  const pullReport = async () => {
    if (!stats || !activeRange) return;
    void hapticButtonPress();
    setSharing(true);
    try {
      const message = buildPartnerReportShareText({
        partnerName: partner?.name,
        range: activeRange,
        stats,
        compare,
      });
      await Share.share({
        title: 'LastBag report',
        message,
      });
      void hapticSuccess();
    } catch (error) {
      Alert.alert(
        'Couldn’t share report',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSharing(false);
    }
  };

  const isEmpty = useMemo(() => {
    if (!stats) return false;
    return (
      stats.bagsListed === 0 &&
      stats.reserved === 0 &&
      stats.pickedUp === 0 &&
      stats.cancelled === 0 &&
      stats.revenue === 0 &&
      stats.realizedRevenue === 0 &&
      stats.reviewCount === 0
    );
  }, [stats]);

  const opsMetrics = stats
    ? [
        {
          key: 'listed',
          label: 'Bags listed',
          value: String(stats.bagsListed),
          icon: Package,
          delta: compare?.bagsListedDeltaPct ?? null,
        },
        {
          key: 'reserved',
          label: 'Reserved',
          value: String(stats.reserved),
          icon: ShoppingBag,
          delta: null,
        },
        {
          key: 'picked',
          label: 'Picked up',
          value: String(stats.pickedUp),
          icon: CheckCircle2,
          delta: compare?.pickedUpDeltaPct ?? null,
        },
        {
          key: 'cancelled',
          label: 'Cancelled',
          value: String(stats.cancelled),
          icon: Ban,
          delta: null,
          warn: stats.cancelled > 0,
        },
      ]
    : [];

  const showChart =
    Boolean(stats) && !isEmpty && series.length > 0 && period !== 'day' && period !== 'custom';
  const rangeCaption = activeRange
    ? `${activeRange.label} · ${activeRange.rangeLabel}`
    : period === 'custom'
      ? `Custom · ${formatChipDate(customStart)} – ${formatChipDate(customEnd)}`
      : '';

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <PartnerEditHeader
        title="Reports"
        onSave={stats ? () => void pullReport() : undefined}
        saving={sharing}
        saveLabel="Export"
      />

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
                onPress={() => selectPeriod(item.key)}
                style={[styles.periodChip, active && styles.periodChipActive]}>
                <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {period === 'custom' ? (
          <View style={styles.customCard}>
            <View style={styles.customHead}>
              <CalendarRange size={16} color={Palette.primary} strokeWidth={2.2} />
              <Text style={styles.customTitle}>Date range</Text>
            </View>
            <View style={styles.customRow}>
              <Pressable
                onPress={() => {
                  void hapticButtonPress();
                  setPickerTarget('start');
                }}
                style={styles.dateChip}>
                <Text style={styles.dateChipLabel}>From</Text>
                <Text style={styles.dateChipValue}>{formatChipDate(customStart)}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void hapticButtonPress();
                  setPickerTarget('end');
                }}
                style={styles.dateChip}>
                <Text style={styles.dateChipLabel}>To</Text>
                <Text style={styles.dateChipValue}>{formatChipDate(customEnd)}</Text>
              </Pressable>
            </View>
            <Text style={styles.customHint}>Changes apply as soon as you pick a date.</Text>
          </View>
        ) : (
          <Text style={styles.rangeLabel}>{rangeCaption}</Text>
        )}

        {period === 'custom' && rangeCaption ? (
          <Text style={[styles.rangeLabel, styles.rangeLabelTight]}>{rangeCaption}</Text>
        ) : null}

        {errorText ? (
          <View style={styles.errorWrap}>
            <RetryState message={errorText} onRetry={() => void load(period)} />
          </View>
        ) : null}

        {loading && !stats ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={168} borderRadius={22} />
            <Skeleton height={72} borderRadius={Radius.lg} style={{ marginTop: Spacing.md }} />
            <Skeleton height={160} borderRadius={Radius.lg} style={{ marginTop: Spacing.md }} />
          </View>
        ) : null}

        {!errorText && stats ? (
          <>
            <LinearGradient
              colors={[Palette.primary, Palette.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}>
              <View style={styles.heroGlow} />
              <View style={styles.heroTop}>
                <View style={styles.heroIcon}>
                  <Wallet size={18} color={Palette.white} strokeWidth={2.2} />
                </View>
                <Text style={styles.heroEyebrow}>Collected revenue</Text>
              </View>
              <Text style={styles.heroValue}>{formatNprPaisa(stats.realizedRevenue)}</Text>
              <DeltaText pct={compare?.revenueDeltaPct ?? null} onDark />
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMeta}>
                  <Text style={styles.heroMetaLabel}>Pipeline</Text>
                  <Text style={styles.heroMetaValue}>{formatNprPaisa(stats.revenue)}</Text>
                </View>
                <View style={styles.heroMetaDivider} />
                <View style={styles.heroMeta}>
                  <Text style={styles.heroMetaLabel}>Fulfillment</Text>
                  <Text style={styles.heroMetaValue}>
                    {stats.fulfillmentRate != null ? `${stats.fulfillmentRate}%` : '—'}
                  </Text>
                </View>
                <View style={styles.heroMetaDivider} />
                <View style={styles.heroMeta}>
                  <Text style={styles.heroMetaLabel}>Cancel rate</Text>
                  <Text style={styles.heroMetaValue}>
                    {stats.cancelRate != null ? `${stats.cancelRate}%` : '—'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <Pressable
              onPress={() => void pullReport()}
              disabled={sharing}
              style={({ pressed }) => [
                styles.pullCard,
                pressed && { opacity: 0.92 },
                sharing && { opacity: 0.7 },
              ]}>
              <View style={styles.pullIcon}>
                <Download size={16} color={Palette.primary} strokeWidth={2.3} />
              </View>
              <View style={styles.pullCopy}>
                <Text style={styles.pullTitle}>Pull report</Text>
                <Text style={styles.pullSubtitle}>Share a summary for this date range</Text>
              </View>
              <Text style={styles.pullCta}>{sharing ? '…' : 'Share'}</Text>
            </Pressable>

            {isEmpty ? (
              <View style={styles.emptyCard}>
                <TrendingUp size={22} color={Palette.primary} strokeWidth={2.2} />
                <Text style={styles.emptyTitle}>No activity in this period</Text>
                <Text style={styles.emptyBody}>
                  List a rescue bag to start tracking reservations, pickups, and revenue here.
                </Text>
                <Pressable onPress={() => router.push('/partner/add-bag')} style={styles.emptyCta}>
                  <Text style={styles.emptyCtaText}>List a bag →</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Operations</Text>
                <View style={styles.grid}>
                  {opsMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <View
                        key={metric.key}
                        style={[styles.metricCard, metric.warn && styles.metricCardWarn]}>
                        <View style={styles.metricTop}>
                          <View style={[styles.metricIcon, metric.warn && styles.metricIconWarn]}>
                            <Icon
                              size={15}
                              color={metric.warn ? Palette.danger : Palette.primary}
                              strokeWidth={2.2}
                            />
                          </View>
                          <Text style={styles.metricLabel}>{metric.label}</Text>
                        </View>
                        <Text style={styles.metricValue}>{metric.value}</Text>
                        {metric.delta != null ? (
                          <DeltaText pct={metric.delta} goodWhenUp={metric.key !== 'cancelled'} />
                        ) : (
                          <Text style={styles.metricHint}>This period</Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {showChart ? <MiniBars series={series} /> : null}

                <View style={styles.ratingCard}>
                  <View style={styles.ratingLeft}>
                    <View style={styles.metricIcon}>
                      <Star size={15} color={Palette.primary} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.metricLabel}>Customer rating</Text>
                      <Text style={styles.ratingHint}>
                        {stats.reviewCount > 0
                          ? `${stats.reviewCount} review${stats.reviewCount === 1 ? '' : 's'} in period`
                          : 'No reviews in this period'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.ratingValue}>
                    {stats.avgRating != null ? stats.avgRating.toFixed(1) : '—'}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>How to read this</Text>
              <Text style={styles.noteBody}>
                Collected revenue is from pickups. Pipeline includes confirmed reservations not
                picked up yet. Fulfillment is picked ÷ reserved for the period.
              </Text>
              <View style={styles.noteLinks}>
                <Pressable
                  onPress={() => router.push('/(tabs)/partner/my-bags')}
                  style={styles.noteLink}>
                  <Text style={styles.noteLinkText}>View My Bags →</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/(tabs)/partner/reviews')}
                  style={styles.noteLink}>
                  <Text style={styles.noteLinkText}>View Reviews →</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      <TimePickerSheet
        visible={pickerTarget === 'start'}
        title="Start date"
        mode="date"
        value={dateFromIso(customStart)}
        maximumDate={dateFromIso(customEnd)}
        onClose={() => setPickerTarget(null)}
        onChange={(date) => applyCustomDate('start', date)}
      />
      <TimePickerSheet
        visible={pickerTarget === 'end'}
        title="End date"
        mode="date"
        value={dateFromIso(customEnd)}
        minimumDate={dateFromIso(customStart)}
        maximumDate={todayDate}
        onClose={() => setPickerTarget(null)}
        onChange={(date) => applyCustomDate('end', date)}
      />
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
    gap: 6,
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
    fontSize: 12,
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
    fontWeight: '500',
  },
  rangeLabelTight: {
    marginTop: 0,
  },
  customCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...CardChrome,
    ...FloatingShadow,
  },
  customHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  customRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateChip: {
    flex: 1,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 2,
    minHeight: 58,
    justifyContent: 'center',
  },
  dateChipLabel: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
  },
  dateChipValue: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  customHint: {
    ...Type.label,
    color: Palette.textTertiary,
  },
  errorWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  skeletonWrap: {
    paddingHorizontal: Spacing.lg,
  },
  heroCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: 22,
    padding: Spacing.lg,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -40,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    ...Type.label,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroValue: {
    fontSize: 34,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.8,
  },
  heroMetaRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.22)',
  },
  heroMeta: {
    flex: 1,
    gap: 2,
  },
  heroMetaDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: Spacing.sm,
  },
  heroMetaLabel: {
    ...Type.label,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
  },
  heroMetaValue: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '700',
    fontSize: 13,
  },
  pullCard: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...CardChrome,
    ...FloatingShadow,
  },
  pullIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pullCopy: {
    flex: 1,
    gap: 2,
  },
  pullTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  pullSubtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  pullCta: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
  sectionLabel: {
    ...Type.label,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Palette.textTertiary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
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
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 6,
    ...CardChrome,
    ...FloatingShadow,
  },
  metricCardWarn: {
    borderColor: Palette.dangerBorder,
    backgroundColor: '#FFF8F7',
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconWarn: {
    backgroundColor: '#FCEBEA',
  },
  metricLabel: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textSecondary,
    flexShrink: 1,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.4,
  },
  metricHint: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  delta: {
    ...Type.label,
    fontWeight: '700',
    marginTop: 2,
  },
  deltaGood: {
    color: Palette.success,
  },
  deltaBad: {
    color: Palette.danger,
  },
  deltaOnDark: {
    ...Type.label,
    fontWeight: '700',
    marginTop: 4,
  },
  deltaOnDarkGood: {
    color: 'rgba(255,255,255,0.92)',
  },
  deltaOnDarkBad: {
    color: '#FFD4C8',
  },
  chartCard: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...CardChrome,
    ...FloatingShadow,
  },
  chartHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  chartTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  chartEmpty: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginTop: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendReserved: {
    backgroundColor: Palette.primaryMid,
  },
  legendPicked: {
    backgroundColor: Palette.primary,
  },
  legendText: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
  },
  barsScroll: {
    alignItems: 'flex-end',
    gap: 8,
    minHeight: 110,
    paddingRight: 4,
  },
  barCol: {
    width: 28,
    alignItems: 'center',
    gap: 6,
  },
  barColFlex: {
    width: undefined,
    minWidth: 28,
    flexGrow: 1,
  },
  barTrack: {
    width: '100%',
    height: 92,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 3,
  },
  barReserved: {
    width: '70%',
    borderRadius: 6,
    backgroundColor: Palette.primaryMid,
    minHeight: 0,
  },
  barPicked: {
    width: '70%',
    borderRadius: 6,
    backgroundColor: Palette.primary,
    minHeight: 0,
  },
  barLabel: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
    minHeight: 14,
    fontSize: 10,
  },
  ratingCard: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    ...CardChrome,
    ...FloatingShadow,
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  ratingHint: {
    ...Type.label,
    color: Palette.textTertiary,
    marginTop: 2,
  },
  ratingValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.4,
  },
  emptyCard: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'flex-start',
    gap: Spacing.sm,
    ...CardChrome,
  },
  emptyTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  emptyBody: {
    ...Type.body,
    color: Palette.textSecondary,
  },
  emptyCta: {
    marginTop: Spacing.sm,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  emptyCtaText: {
    color: Palette.white,
    fontWeight: '700',
  },
  noteCard: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  noteTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  noteBody: {
    ...Type.caption,
    color: Palette.primaryDarker,
    lineHeight: 18,
  },
  noteLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: 2,
  },
  noteLink: {
    paddingVertical: 2,
  },
  noteLinkText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
});
