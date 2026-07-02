import { getAreaById, getCityById } from '@/lib/locations';
import { decodePartnerMeta } from '@/lib/partnerMeta';
import type { PartnerSubscriptionFields } from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';
import type { Partner } from '@/types/database';

export type PartnerProfileRow = Partner &
  PartnerSubscriptionFields & {
    city_id?: string | null;
    area_id?: string | null;
  };

export type OwnerProfileRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

export type PartnerProfileStats = {
  bagsSold: number;
  totalRevenue: number;
  foodRescuedKg: number;
};

export async function fetchPartnerProfileStats(partnerId: string): Promise<PartnerProfileStats> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_price')
    .eq('partner_id', partnerId)
    .eq('status', 'picked_up');

  if (error) throw error;

  const list = orders ?? [];
  const bagsSold = list.length;
  const totalRevenue = list.reduce((sum, order) => sum + order.total_price, 0);

  return {
    bagsSold,
    totalRevenue,
    foodRescuedKg: Math.round(bagsSold * 0.5 * 10) / 10,
  };
}

export function formatFoodRescued(kg: number) {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} t`;
  }
  return `${kg} kg`;
}

export function formatRatingDisplay(rating: number) {
  if (rating <= 0) return '0.0';
  return `${rating.toFixed(1)} ★`;
}

export function formatOpeningHours(description: string | null | undefined) {
  const meta = decodePartnerMeta(description);
  if (!meta.opening_start || !meta.opening_end) return 'Not set';

  const format = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return `${format(meta.opening_start)} – ${format(meta.opening_end)}`;
}

export function formatPartnerLocationLabel(
  partner: Pick<PartnerProfileRow, 'area_id' | 'city_id' | 'address'>,
  locale: 'en' | 'np' = 'en',
) {
  const area = partner.area_id ? getAreaById(partner.area_id) : undefined;
  const city = partner.city_id ? getCityById(partner.city_id) : undefined;
  const areaLabel = area ? (locale === 'np' ? area.nameNp : area.name) : null;
  const cityLabel = city ? (locale === 'np' ? city.nameNp : city.name) : null;

  if (areaLabel && cityLabel) return `${areaLabel}, ${cityLabel}`;
  if (partner.address) {
    const parts = partner.address.split(',').map((part) => part.trim());
    if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    return partner.address;
  }
  return 'Set your location';
}

export function formatAcceptedPaymentsLabel(payments: string[] | undefined) {
  if (!payments?.length) return 'Cash, eSewa, Khalti';
  return payments.join(', ');
}

export const PAYMENT_METHOD_OPTIONS = [
  'Cash',
  'eSewa',
  'Khalti',
  'Bank transfer',
  'Other',
] as const;
