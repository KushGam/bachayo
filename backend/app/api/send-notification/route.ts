import { NextRequest, NextResponse } from 'next/server';

import { deliverNotification, verifyInternalSecret } from '@/lib/notifications';

type SendNotificationBody = {
  user_id?: string;
  title?: string;
  body?: string;
};

export async function POST(request: NextRequest) {
  try {
    verifyInternalSecret(request.headers.get('x-internal-secret'));

    const { user_id, title, body } = (await request.json()) as SendNotificationBody;

    if (!user_id || !title || !body) {
      return NextResponse.json(
        { success: false, error: 'user_id, title, and body are required' },
        { status: 400 },
      );
    }

    const result = await deliverNotification(user_id, title, body);

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
