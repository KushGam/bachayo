import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { deliverNotification } from '@/lib/notifications';
import { supabaseUrl } from '@/lib/supabase-admin';

type SendNotificationBody = {
  user_id?: string;
  title?: string;
  body?: string;
  type?: string;
  data?: Record<string, unknown>;
};

/**
 * Two callers, two credentials:
 * - our own server code passes x-internal-secret
 * - the mobile app passes the signed-in user's Supabase access token
 *
 * The app path replaced the `send-notification` Edge Function, which relied on
 * Supabase's verify_jwt for exactly this check.
 */
async function authorize(request: NextRequest) {
  const internalSecret = process.env.INTERNAL_SECRET;
  const providedSecret = request.headers.get('x-internal-secret');
  if (internalSecret && providedSecret === internalSecret) {
    return;
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
}

export async function POST(request: NextRequest) {
  try {
    await authorize(request);

    const { user_id, title, body, type, data } = (await request.json()) as SendNotificationBody;

    if (!user_id || !title || !body) {
      return NextResponse.json(
        { success: false, error: 'user_id, title, and body are required' },
        { status: 400 },
      );
    }

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
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
