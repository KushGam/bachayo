import { sendNotification } from '@/lib/sendNotification';
import { supabase } from '@/lib/supabase';
import type { Order, Partner, RescueBag } from '@/types/database';

export type ReviewOrderContext = Order & {
  bag: Pick<RescueBag, 'title' | 'title_np'>;
  partner: Pick<Partner, 'name' | 'cover_image_url' | 'category'>;
};

type ReviewOrderRow = Order & {
  bag: Pick<RescueBag, 'title' | 'title_np'> | null;
  partner: Pick<Partner, 'name' | 'cover_image_url' | 'category'> | null;
};

function normalizeReviewOrder(row: ReviewOrderRow): ReviewOrderContext {
  return {
    ...row,
    bag: row.bag ?? { title: 'Rescue bag', title_np: null },
    partner: row.partner ?? {
      name: 'Restaurant',
      cover_image_url: null,
      category: 'restaurant',
    },
  };
}

export async function fetchOrderForReview(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      bag:rescue_bags(title, title_np),
      partner:partners(name, cover_image_url, category)
    `)
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return normalizeReviewOrder(data as unknown as ReviewOrderRow);
}

export type SubmitCustomerReviewInput = {
  orderId: string;
  customerId: string;
  partnerId: string;
  rating: number;
  comment?: string;
  quantityFeedback?: string | null;
  valueFeedback?: string | null;
  wouldReturn?: string | null;
  photoUrl?: string | null;
};

export async function recalculatePartnerRating(partnerId: string) {
  const { error } = await supabase.rpc('recalculate_partner_rating', {
    p_partner_id: partnerId,
  });

  if (error) throw error;
}

async function notifyPartnerNewReview(input: {
  partnerId: string;
  rating: number;
  comment?: string;
}) {
  const { data: partner } = await supabase
    .from('partners')
    .select('user_id')
    .eq('id', input.partnerId)
    .maybeSingle();

  const partnerUserId = (partner as { user_id?: string } | null)?.user_id;
  if (!partnerUserId) return;

  const comment = input.comment?.trim() ?? '';
  const body =
    comment.length > 0
      ? `${input.rating}-star review: "${comment.slice(0, 50)}${comment.length > 50 ? '…' : ''}"`
      : `You received a new ${input.rating}-star review!`;

  await sendNotification({
    userId: partnerUserId,
    title: input.rating === 5 ? 'New 5-star review! ⭐' : 'New review received! ⭐',
    body,
    type: 'new_review',
    data: {
      partner_id: input.partnerId,
      type: 'new_review',
    },
  });
}

export async function submitCustomerReview(input: SubmitCustomerReviewInput) {
  const { error } = await supabase.from('reviews').insert({
    order_id: input.orderId,
    customer_id: input.customerId,
    partner_id: input.partnerId,
    rating: input.rating,
    comment: input.comment?.trim() || null,
    quantity_feedback: input.quantityFeedback ?? null,
    value_feedback: input.valueFeedback ?? null,
    would_return: input.wouldReturn ?? null,
    photo_url: input.photoUrl ?? null,
  } as never);

  if (error) return { error };

  // Best-effort flag (migration 058). Failures must not block a successful review.
  await supabase
    .from('orders')
    .update({ review_submitted: true } as never)
    .eq('id', input.orderId);

  try {
    await recalculatePartnerRating(input.partnerId);
  } catch (recalcError) {
    return {
      error: recalcError instanceof Error ? recalcError : new Error('Failed to update partner rating'),
    };
  }

  void notifyPartnerNewReview({
    partnerId: input.partnerId,
    rating: input.rating,
    comment: input.comment,
  });

  return { error: null };
}

export function formatPickedUpLabel(pickedUpAt: string | null | undefined) {
  if (!pickedUpAt) return 'Picked up recently';

  const diffMs = Date.now() - new Date(pickedUpAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return 'Picked up today';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return 'Picked up today';
  if (hrs < 48) return 'Picked up yesterday';
  const days = Math.floor(hrs / 24);
  return `Picked up ${days} days ago`;
}

export const RATING_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: "😔 Poor — we're sorry to hear that", color: '#DC2626' },
  2: { text: '😐 Fair — room for improvement', color: '#DC2626' },
  3: { text: '🙂 Good — decent experience', color: '#D97706' },
  4: { text: '😊 Great — really enjoyed it!', color: '#059669' },
  5: { text: '🤩 Amazing — absolutely loved it!', color: '#059669' },
};

export const QUICK_REVIEW_TAGS = [
  'Great value!',
  'Generous portions',
  'Friendly staff',
  'On time',
  'Tasty food',
  'Well packed',
] as const;

export type MiniRatingOption = {
  key: string;
  label: string;
};

export const QUANTITY_OPTIONS: MiniRatingOption[] = [
  { key: 'too_little', label: '👎 Too little' },
  { key: 'just_right', label: '👌 Just right' },
  { key: 'plenty', label: '👍 Plenty' },
];

export const VALUE_OPTIONS: MiniRatingOption[] = [
  { key: 'not_worth', label: '😕 Not worth it' },
  { key: 'fair', label: '👌 Fair' },
  { key: 'great_value', label: '💯 Great value' },
];

export const RETURN_OPTIONS: MiniRatingOption[] = [
  { key: 'no', label: 'No' },
  { key: 'maybe', label: 'Maybe' },
  { key: 'definitely', label: 'Definitely!' },
];
