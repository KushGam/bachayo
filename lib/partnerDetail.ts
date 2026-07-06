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

function buildRatingBreakdown(ratings: number[]) {
  const counts = [0, 0, 0, 0, 0];
  for (const rating of ratings) {
    if (rating >= 1 && rating <= 5) counts[rating - 1] += 1;
  }
  return counts
    .map((count, index) => ({ stars: index + 1, count }))
    .reverse();
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
    { data: ratingRows, error: ratingsError },
    { count: reviewCount, error: reviewCountError },
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
        *,
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
    supabase.from('reviews').select('rating').eq('partner_id', partnerId),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('partner_id', partnerId),
  ]);

  if (partnerError) throw partnerError;
  if (!partner) throw new Error('Partner not found');
  if (bagsError) throw bagsError;
  if (reviewsError) throw reviewsError;
  if (pickupsError) throw pickupsError;
  if (ratingsError) throw ratingsError;
  if (reviewCountError) throw reviewCountError;

  const ratings = (ratingRows ?? []).map((row) => row.rating);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : partner.rating ?? 0;

  const liveBags = await enrichBagsWithLiveStock(bags ?? []);

  return {
    partner: partner as PartnerDetailPartner,
    bags: liveBags,
    reviews: (reviews ?? []) as unknown as PartnerReviewRow[],
    stats: {
      totalPickups: pickupCount ?? 0,
      avgRating,
      totalReviews: reviewCount ?? 0,
      ratingBreakdown: buildRatingBreakdown(ratings),
    },
  };
}
