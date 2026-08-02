import { getTodayIsoDateLocal } from '@/lib/helpers';
import { isRealizedRevenueOrderStatus, isRevenueOrderStatus } from '@/lib/orderStatus';
import { supabase } from '@/lib/supabase';

export type ReportPeriod = 'day' | 'week' | 'month' | 'custom';

export type PartnerPeriodStats = {
  bagsListed: number;
  reserved: number;
  pickedUp: number;
  cancelled: number;
  /** Confirmed + picked_up order value created in range (pipeline). */
  revenue: number;
  /** Picked-up order value by pickup date (cash collected). */
  realizedRevenue: number;
  avgRating: number | null;
  reviewCount: number;
  fulfillmentRate: number | null;
  cancelRate: number | null;
};

export type PartnerPeriodRange = {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  label: string;
  rangeLabel: string;
};

export type PartnerReportDayPoint = {
  date: string;
  label: string;
  reserved: number;
  pickedUp: number;
  revenue: number;
};

export type PartnerPeriodCompare = {
  revenueDeltaPct: number | null;
  pickedUpDeltaPct: number | null;
  bagsListedDeltaPct: number | null;
};

export type PartnerReportResult = {
  range: PartnerPeriodRange;
  stats: PartnerPeriodStats;
  previous: PartnerPeriodStats;
  compare: PartnerPeriodCompare;
  series: PartnerReportDayPoint[];
};

function toLocalDateKey(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function shiftLocalIsoDate(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatRangeLabel(startDate: string, endDate: string) {
  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('en-NP', {
      day: 'numeric',
      month: 'short',
    });
  if (startDate === endDate) return fmt(startDate);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

function daysInclusive(startDate: string, endDate: string) {
  const [ys, ms, ds] = startDate.split('-').map(Number);
  const [ye, me, de] = endDate.split('-').map(Number);
  const start = new Date(ys, (ms ?? 1) - 1, ds ?? 1);
  const end = new Date(ye, (me ?? 1) - 1, de ?? 1);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(0, diff) + 1;
}

function enumerateDates(startDate: string, endDate: string) {
  const count = daysInclusive(startDate, endDate);
  return Array.from({ length: count }, (_, index) => shiftLocalIsoDate(startDate, index));
}

function shortDayLabel(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-NP', {
    weekday: 'narrow',
  });
}

function normalizeCustomRange(startDate: string, endDate: string) {
  if (startDate <= endDate) return { startDate, endDate };
  return { startDate: endDate, endDate: startDate };
}

export function getPartnerReportRange(
  period: ReportPeriod,
  custom?: { startDate: string; endDate: string } | null,
): PartnerPeriodRange {
  const endDate = getTodayIsoDateLocal();

  if (period === 'custom' && custom?.startDate && custom?.endDate) {
    const range = normalizeCustomRange(custom.startDate, custom.endDate);
    return {
      period: 'custom',
      startDate: range.startDate,
      endDate: range.endDate,
      label: 'Custom range',
      rangeLabel: formatRangeLabel(range.startDate, range.endDate),
    };
  }

  if (period === 'day') {
    return {
      period,
      startDate: endDate,
      endDate,
      label: 'Today',
      rangeLabel: formatRangeLabel(endDate, endDate),
    };
  }

  if (period === 'week') {
    const startDate = shiftLocalIsoDate(endDate, -6);
    return {
      period,
      startDate,
      endDate,
      label: 'Last 7 days',
      rangeLabel: formatRangeLabel(startDate, endDate),
    };
  }

  const [y, m] = endDate.split('-');
  const startDate = `${y}-${m}-01`;
  return {
    period: 'month',
    startDate,
    endDate,
    label: 'This month',
    rangeLabel: formatRangeLabel(startDate, endDate),
  };
}

function previousRangeFor(range: PartnerPeriodRange): { startDate: string; endDate: string } {
  const length = daysInclusive(range.startDate, range.endDate);
  const endDate = shiftLocalIsoDate(range.startDate, -1);
  const startDate = shiftLocalIsoDate(endDate, -(length - 1));
  return { startDate, endDate };
}

function inRange(localDateKey: string, startDate: string, endDate: string) {
  return localDateKey >= startDate && localDateKey <= endDate;
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0 && current <= 0) return null;
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

type OrderRow = {
  total_price: number;
  status: string;
  quantity: number | null;
  created_at: string;
  picked_up_at: string | null;
};

type BagRow = {
  id: string;
  status: string;
  quantity_reserved: number | null;
  available_date: string;
};

type ReviewRow = {
  rating: number | null;
  created_at: string;
};

function computeStats(
  bagList: BagRow[],
  allOrders: OrderRow[],
  reviews: ReviewRow[],
  startDate: string,
  endDate: string,
): PartnerPeriodStats {
  const bagsListed = bagList.filter(
    (bag) =>
      inRange(bag.available_date, startDate, endDate) &&
      (bag.status === 'active' || bag.status === 'sold_out' || bag.status === 'expired'),
  ).length;

  const createdInRange = allOrders.filter((order) =>
    inRange(toLocalDateKey(order.created_at), startDate, endDate),
  );

  const reserved = createdInRange
    .filter(
      (order) =>
        order.status === 'pending' ||
        order.status === 'confirmed' ||
        order.status === 'picked_up',
    )
    .reduce((sum, order) => sum + (order.quantity ?? 1), 0);

  const pickedUp = allOrders
    .filter(
      (order) =>
        order.status === 'picked_up' &&
        order.picked_up_at &&
        inRange(toLocalDateKey(order.picked_up_at), startDate, endDate),
    )
    .reduce((sum, order) => sum + (order.quantity ?? 1), 0);

  const cancelled = createdInRange
    .filter((order) => order.status === 'cancelled')
    .reduce((sum, order) => sum + (order.quantity ?? 1), 0);

  const revenue = createdInRange
    .filter((order) => isRevenueOrderStatus(order.status))
    .reduce((sum, order) => sum + (order.total_price || 0), 0);

  const realizedRevenue = allOrders
    .filter(
      (order) =>
        isRealizedRevenueOrderStatus(order.status) &&
        order.picked_up_at &&
        inRange(toLocalDateKey(order.picked_up_at), startDate, endDate),
    )
    .reduce((sum, order) => sum + (order.total_price || 0), 0);

  const reviewsInRange = reviews.filter((review) =>
    inRange(toLocalDateKey(review.created_at), startDate, endDate),
  );
  const reviewCount = reviewsInRange.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (reviewsInRange.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviewCount) *
            10,
        ) / 10
      : null;

  const decided = reserved + cancelled;
  const fulfillmentRate = reserved > 0 ? Math.round((pickedUp / reserved) * 100) : null;
  const cancelRate = decided > 0 ? Math.round((cancelled / decided) * 100) : null;

  return {
    bagsListed,
    reserved,
    pickedUp,
    cancelled,
    revenue,
    realizedRevenue,
    avgRating,
    reviewCount,
    fulfillmentRate,
    cancelRate,
  };
}

function buildSeries(
  allOrders: OrderRow[],
  startDate: string,
  endDate: string,
): PartnerReportDayPoint[] {
  const dates = enumerateDates(startDate, endDate);
  const dayCount = dates.length;
  return dates.map((date, index) => {
    const reserved = allOrders
      .filter(
        (order) =>
          toLocalDateKey(order.created_at) === date &&
          (order.status === 'pending' ||
            order.status === 'confirmed' ||
            order.status === 'picked_up'),
      )
      .reduce((sum, order) => sum + (order.quantity ?? 1), 0);

    const pickedUp = allOrders
      .filter(
        (order) =>
          order.status === 'picked_up' &&
          order.picked_up_at &&
          toLocalDateKey(order.picked_up_at) === date,
      )
      .reduce((sum, order) => sum + (order.quantity ?? 1), 0);

    const revenue = allOrders
      .filter(
        (order) =>
          order.picked_up_at &&
          toLocalDateKey(order.picked_up_at) === date &&
          isRealizedRevenueOrderStatus(order.status),
      )
      .reduce((sum, order) => sum + (order.total_price || 0), 0);

    const showLabel =
      dayCount <= 10 ||
      index === 0 ||
      index === dayCount - 1 ||
      index % Math.ceil(dayCount / 7) === 0;

    return {
      date,
      label: showLabel ? shortDayLabel(date) : '',
      reserved,
      pickedUp,
      revenue,
    };
  });
}

export async function fetchPartnerPeriodStats(
  partnerId: string,
  period: ReportPeriod,
  custom?: { startDate: string; endDate: string } | null,
): Promise<PartnerReportResult> {
  const range = getPartnerReportRange(period, custom);
  const previousWindow = previousRangeFor(range);
  const bagsFrom =
    previousWindow.startDate < range.startDate ? previousWindow.startDate : range.startDate;

  const [
    { data: bags, error: bagsError },
    { data: orders, error: ordersError },
    { data: reviews, error: reviewsError },
  ] = await Promise.all([
    supabase
      .from('rescue_bags')
      .select('id, status, quantity_reserved, available_date')
      .eq('partner_id', partnerId)
      .gte('available_date', bagsFrom)
      .lte('available_date', range.endDate),
    supabase
      .from('orders')
      .select('total_price, status, quantity, created_at, picked_up_at')
      .eq('partner_id', partnerId),
    supabase.from('reviews').select('rating, created_at').eq('partner_id', partnerId),
  ]);

  if (bagsError) throw bagsError;
  if (ordersError) throw ordersError;
  if (reviewsError) throw reviewsError;

  const bagList = (bags ?? []) as BagRow[];
  const allOrders = (orders ?? []) as OrderRow[];
  const reviewList = (reviews ?? []) as ReviewRow[];

  const stats = computeStats(bagList, allOrders, reviewList, range.startDate, range.endDate);
  const previous = computeStats(
    bagList,
    allOrders,
    reviewList,
    previousWindow.startDate,
    previousWindow.endDate,
  );
  const series = buildSeries(allOrders, range.startDate, range.endDate);

  return {
    range,
    stats,
    previous,
    compare: {
      revenueDeltaPct: pctChange(stats.realizedRevenue, previous.realizedRevenue),
      pickedUpDeltaPct: pctChange(stats.pickedUp, previous.pickedUp),
      bagsListedDeltaPct: pctChange(stats.bagsListed, previous.bagsListed),
    },
    series,
  };
}

export function buildPartnerReportShareText(input: {
  partnerName?: string | null;
  range: PartnerPeriodRange;
  stats: PartnerPeriodStats;
  compare?: PartnerPeriodCompare | null;
}) {
  const { partnerName, range, stats, compare } = input;
  const lines = [
    `LastBag report${partnerName ? ` — ${partnerName}` : ''}`,
    `${range.label} · ${range.rangeLabel}`,
    '',
    `Collected revenue: NPR ${Math.round(stats.realizedRevenue / 100).toLocaleString('en-NP')}`,
    `Pipeline: NPR ${Math.round(stats.revenue / 100).toLocaleString('en-NP')}`,
    `Fulfillment: ${stats.fulfillmentRate != null ? `${stats.fulfillmentRate}%` : '—'}`,
    `Cancel rate: ${stats.cancelRate != null ? `${stats.cancelRate}%` : '—'}`,
    '',
    `Bags listed: ${stats.bagsListed}`,
    `Reserved: ${stats.reserved}`,
    `Picked up: ${stats.pickedUp}`,
    `Cancelled: ${stats.cancelled}`,
    `Avg rating: ${stats.avgRating != null ? stats.avgRating.toFixed(1) : '—'} (${stats.reviewCount} reviews)`,
  ];

  if (compare?.revenueDeltaPct != null) {
    lines.push(
      '',
      `Collected vs last period: ${compare.revenueDeltaPct > 0 ? '+' : ''}${compare.revenueDeltaPct}%`,
    );
  }

  lines.push('', 'Generated in LastBag');
  return lines.join('\n');
}
