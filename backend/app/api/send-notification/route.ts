import { createClient, type User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { deliverNotification } from '@/lib/notifications';
import { createSupabaseAdmin, supabaseUrl } from '@/lib/supabase-admin';

type SendNotificationBody = {
  user_id?: string;
  title?: string;
  body?: string;
  type?: string;
  data?: Record<string, unknown>;
};

type AuthContext =
  | { kind: 'internal' }
  | { kind: 'user'; user: User };

/**
 * Two callers, two credentials:
 * - our own server code passes x-internal-secret
 * - the mobile app passes the signed-in user's Supabase access token
 *
 * The app path replaced the `send-notification` Edge Function, which relied on
 * Supabase's verify_jwt for exactly this check.
 */
async function authorize(request: NextRequest): Promise<AuthContext> {
  const internalSecret = process.env.INTERNAL_SECRET;
  const providedSecret = request.headers.get('x-internal-secret');
  if (internalSecret && providedSecret === internalSecret) {
    return { kind: 'internal' };
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    throw new Error('Unauthorized');
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
  }

  const supabase = createClient(supabaseUrl(), anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  return { kind: 'user', user: data.user };
}

function readId(data: Record<string, unknown> | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/**
 * App clients may only notify users they have a real relationship with
 * (shared order, review, or partner ownership). Internal secret bypasses.
 */
async function assertCallerMayNotify(
  auth: AuthContext,
  targetUserId: string,
  data?: Record<string, unknown>,
) {
  if (auth.kind === 'internal') return;

  const callerId = auth.user.id;
  if (callerId === targetUserId) return;

  const admin = createSupabaseAdmin();
  const orderId = readId(data, 'order_id', 'orderId');
  if (orderId) {
    const { data: order } = await admin
      .from('orders')
      .select('customer_id, partner:partners!inner(user_id)')
      .eq('id', orderId)
      .maybeSingle();

    const partnerUserId =
      order && typeof order.partner === 'object' && order.partner && 'user_id' in order.partner
        ? String((order.partner as { user_id: string }).user_id)
        : null;

    if (
      order &&
      ((order.customer_id === callerId && partnerUserId === targetUserId) ||
        (partnerUserId === callerId && order.customer_id === targetUserId))
    ) {
      return;
    }
  }

  const reviewId = readId(data, 'review_id');
  if (reviewId) {
    const { data: review } = await admin
      .from('reviews')
      .select('customer_id, partner:partners!inner(user_id)')
      .eq('id', reviewId)
      .maybeSingle();

    const partnerUserId =
      review && typeof review.partner === 'object' && review.partner && 'user_id' in review.partner
        ? String((review.partner as { user_id: string }).user_id)
        : null;

    if (
      review &&
      ((review.customer_id === callerId && partnerUserId === targetUserId) ||
        (partnerUserId === callerId && review.customer_id === targetUserId))
    ) {
      return;
    }
  }

  const partnerId = readId(data, 'partner_id');
  if (partnerId) {
    const { data: partner } = await admin
      .from('partners')
      .select('user_id')
      .eq('id', partnerId)
      .maybeSingle();

    // Partner notifying a customer who reviewed them / customer notifying the partner.
    if (partner?.user_id === callerId) {
      const { data: relatedReview } = await admin
        .from('reviews')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('customer_id', targetUserId)
        .limit(1)
        .maybeSingle();
      if (relatedReview) return;

      const { data: relatedOrder } = await admin
        .from('orders')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('customer_id', targetUserId)
        .limit(1)
        .maybeSingle();
      if (relatedOrder) return;
    }

    if (partner?.user_id === targetUserId) {
      const { data: relatedReview } = await admin
        .from('reviews')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('customer_id', callerId)
        .limit(1)
        .maybeSingle();
      if (relatedReview) return;

      const { data: relatedOrder } = await admin
        .from('orders')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('customer_id', callerId)
        .limit(1)
        .maybeSingle();
      if (relatedOrder) return;
    }
  }

  throw new Error('Forbidden');
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request);

    const { user_id, title, body, type, data } = (await request.json()) as SendNotificationBody;

    if (!user_id || !title || !body) {
      return NextResponse.json(
        { success: false, error: 'user_id, title, and body are required' },
        { status: 400 },
      );
    }

    await assertCallerMayNotify(auth, user_id, data);

    const result = await deliverNotification(user_id, title, body, {
      type: type || 'system',
      data: data ?? undefined,
    });

    if (result.skipped) {
      return NextResponse.json({ success: true, skipped: true, reason: result.reason });
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
