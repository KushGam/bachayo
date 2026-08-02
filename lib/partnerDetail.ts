import { enrichBagsWithLiveStock } from '@/lib/bagStock';
import { getTodayIsoDateLocal } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import type { Partner, RescueBag } from '@/types/database';

export type PartnerReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer: { full_name: string | null } | null;
  order: { bag: { title: string } | null } | null;
  partner_reply?: string | null;
  partner_replied_at?: string | null;
};

export type PartnerDetailStats = {
  totalPickups: number;
  avgRating: number;
  totalReviews: number;
  ratingBreakdown: Array<{ stars: number; count: number }>;
};

export type PartnerDetailPartner = Partner & {
  city_id?: string | null;
  area_id?: string | null;
};

export type PartnerDetailData = {
  partner: PartnerDetailPartner;
  bags: RescueBag[];
  reviews: PartnerReviewRow[];
  stats: PartnerDetailStats;
};

function emptyBreakdown() {
  return [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 }));
}

function breakdownFromRows(rows: Array<{ stars: number; review_count: number | string }> | null) {
  const base = emptyBreakdown();
  for (const row of rows ?? []) {
    const stars = Number(row.stars);
    const count = Number(row.review_count ?? 0);
    const slot = base.find((item) => item.stars === stars);
    if (slot) slot.count = count;
  }
  return base;
}

export async function fetchPartnerDetail(
  partnerId: string,
  today = getTodayIsoDateLocal(),
): Promise<PartnerDetailData> {
  const [
    { data: partner, error: partnerError },
    { data: bags, error: bagsError },
    { data: reviews, error: reviewsError },
    { count: pickupCount, error: pickupsError },
    { data: breakdownRows, error: breakdownError },
  ] = await Promise.all([
    supabase.from('partners').select('*').eq('id', partnerId).maybeSingle(),
    supabase
      .from('rescue_bags')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('available_date', today)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select(`
        id, rating, comment, created_at, partner_reply, partner_replied_at,
        customer:profiles(full_name),
        order:orders(bag:rescue_bags(title))
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerId)
      .eq('status', 'picked_up'),
    supabase.rpc('get_partner_rating_breakdown', { p_partner_id: partnerId }),
  ]);

  if (partnerError) throw partnerError;
  if (!partner) throw new Error('Partner not found');
  if (bagsError) throw bagsError;
  if (reviewsError) throw reviewsError;
  if (pickupsError) throw pickupsError;

  let ratingBreakdown = emptyBreakdown();
  if (!breakdownError && breakdownRows) {
    ratingBreakdown = breakdownFromRows(
      breakdownRows as Array<{ stars: number; review_count: number | string }>,
    );
  } else {
    // Fallback before migration 057: one light ratings query.
    const { data: ratingRows } = await supabase
      .from('reviews')
      .select('rating')
      .eq('partner_id', partnerId);
    const counts = [0, 0, 0, 0, 0];
    for (const row of ratingRows ?? []) {
      const rating = row.rating;
      if (rating >= 1 && rating <= 5) counts[rating - 1] += 1;
    }
    ratingBreakdown = counts
      .map((count, index) => ({ stars: index + 1, count }))
      .reverse();
  }

  const totalReviews = partner.total_reviews ?? 0;
  const avgRating =
    totalReviews > 0 && partner.rating > 0
      ? Math.round(partner.rating * 10) / 10
      : 0;

  const liveBags = await enrichBagsWithLiveStock(bags ?? []);

  return {
    partner: partner as PartnerDetailPartner,
    bags: liveBags,
    reviews: (reviews ?? []) as unknown as PartnerReviewRow[],
    stats: {
      totalPickups: pickupCount ?? 0,
      avgRating,
      totalReviews,
      ratingBreakdown,
    },
  };
}
