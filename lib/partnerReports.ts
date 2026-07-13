import { getTodayIsoDateLocal } from '@/lib/helpers';
import { isRevenueOrderStatus } from '@/lib/orderStatus';
import { supabase } from '@/lib/supabase';

export type ReportPeriod = 'day' | 'week' | 'month';

export type PartnerPeriodStats = {
  bagsListed: number;
  reserved: number;
  pickedUp: number;
  cancelled: number;
  revenue: number;
  avgRating: number | null;
  reviewCount: number;
};

export type PartnerPeriodRange = {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  label: string;
  rangeLabel: string;
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

export function getPartnerReportRange(period: ReportPeriod): PartnerPeriodRange {
  const endDate = getTodayIsoDateLocal();

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
    period,
    startDate,
    endDate,
    label: 'This month',
    rangeLabel: formatRangeLabel(startDate, endDate),
  };
}

function inRange(localDateKey: string, startDate: string, endDate: string) {
  return localDateKey >= startDate && localDateKey <= endDate;
}

export async function fetchPartnerPeriodStats(
  partnerId: string,
  period: ReportPeriod,
): Promise<{ range: PartnerPeriodRange; stats: PartnerPeriodStats }> {
  const range = getPartnerReportRange(period);

  const [{ data: bags, error: bagsError }, { data: orders, error: ordersError }, { data: reviews, error: reviewsError }] =
    await Promise.all([
      supabase
        .from('rescue_bags')
        .select('id, status, quantity_reserved, available_date')
        .eq('partner_id', partnerId)
        .gte('available_date', range.startDate)
        .lte('available_date', range.endDate),
      supabase
        .from('orders')
        .select('total_price, status, quantity, created_at, picked_up_at')
        .eq('partner_id', partnerId),
      supabase
        .from('reviews')
        .select('rating, created_at')
        .eq('partner_id', partnerId),
    ]);

  if (bagsError) throw bagsError;
  if (ordersError) throw ordersError;
  if (reviewsError) throw reviewsError;

  const bagList = bags ?? [];
  const allOrders = orders ?? [];

  const bagsListed = bagList.filter(
    (bag) => bag.status === 'active' || bag.status === 'sold_out' || bag.status === 'expired',
  ).length;

  const createdInRange = allOrders.filter((order) =>
    inRange(toLocalDateKey(order.created_at), range.startDate, range.endDate),
  );

  const reserved = createdInRange
    .filter((order) => order.status === 'pending' || order.status === 'confirmed' || order.status === 'picked_up')
    .reduce((sum, order) => sum + (order.quantity ?? 1), 0);

  const pickedUp = allOrders
    .filter(
      (order) =>
        order.status === 'picked_up' &&
        order.picked_up_at &&
        inRange(toLocalDateKey(order.picked_up_at), range.startDate, range.endDate),
    )
    .reduce((sum, order) => sum + (order.quantity ?? 1), 0);

  const cancelled = createdInRange
    .filter((order) => order.status === 'cancelled')
    .reduce((sum, order) => sum + (order.quantity ?? 1), 0);

  const revenue = createdInRange
    .filter((order) => isRevenueOrderStatus(order.status))
    .reduce((sum, order) => sum + (order.total_price || 0), 0);

  const reviewsInRange = (reviews ?? []).filter((review) =>
    inRange(toLocalDateKey(review.created_at), range.startDate, range.endDate),
  );
  const reviewCount = reviewsInRange.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (reviewsInRange.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviewCount) * 10,
        ) / 10
      : null;

  return {
    range,
    stats: {
      bagsListed,
      reserved,
      pickedUp,
      cancelled,
      revenue,
      avgRating,
      reviewCount,
    },
  };
}
