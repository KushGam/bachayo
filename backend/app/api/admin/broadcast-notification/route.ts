import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { deliverNotification } from '@/lib/notifications';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const valid = token ? await verifyAdminSession(token).catch(() => false) : false;
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, body, type } = (await request.json()) as {
    title?: string;
    body?: string;
    type?: string;
  };

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, push_token')
    .not('push_token', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const profile of profiles ?? []) {
    try {
      await deliverNotification(profile.id, title.trim(), body.trim(), {
        type: type || 'announcement',
        data: { type: type || 'announcement' },
      });
      sent += 1;
    } catch (err) {
      console.error(`[broadcast] failed for ${profile.id}:`, err);
    }
  }

  return NextResponse.json({ success: true, sent, total: profiles?.length ?? 0 });
}
