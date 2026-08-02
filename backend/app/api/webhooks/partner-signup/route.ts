import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

import { sendNotificationPayload } from '@/lib/notifications';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
};

function verifyWebhookSecret(request: NextRequest) {
  const expected = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!expected) {
    throw new Error('SUPABASE_WEBHOOK_SECRET is not configured');
  }

  const provided = request.headers.get('x-supabase-webhook-secret');
  if (provided !== expected) {
    throw new Error('Unauthorized webhook');
  }
}

function getAdminBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://lastbag.app';
}

export async function POST(request: NextRequest) {
  try {
    verifyWebhookSecret(request);

    const payload = (await request.json()) as WebhookPayload;
    if (payload.type !== 'INSERT' || payload.table !== 'partners') {
      return NextResponse.json({ skipped: true });
    }

    const partner = payload.record;
    const partnerId = String(partner.id ?? '');
    const name = String(partner.name ?? 'New partner');
    const category = String(partner.category ?? '—');
    const city = String(partner.city_id ?? '—');
    const phone = String(partner.phone ?? '—');
    const createdAt = String(partner.created_at ?? new Date().toISOString());

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? 'hello@lastbag.app';
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });

      await transporter.sendMail({
        from: `"LastBag" <${gmailUser}>`,
        to: adminEmail,
        subject: `New restaurant signup — ${name}`,
        html: `
          <h2>New restaurant signup</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>City:</strong> ${city}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Signed up:</strong> ${createdAt}</p>
          <p><a href="${getAdminBaseUrl()}/admin/partners?approval=pending">Review in admin panel</a></p>
        `,
      });
    } else {
      console.warn(
        '[partner-signup] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping admin email for',
        partnerId,
      );
    }

    const adminUserId = process.env.ADMIN_USER_ID;
    if (adminUserId) {
      await sendNotificationPayload(adminUserId, {
        title: 'New restaurant signup',
        body: `${name} signed up and needs approval.`,
        type: 'system',
        data: { partner_id: partnerId, type: 'system' },
      });
    } else {
      console.warn(
        '[partner-signup] ADMIN_USER_ID not set — skipping admin push for',
        partnerId,
      );
    }

    return NextResponse.json({ ok: true, partnerId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status =
      message === 'Unauthorized webhook' || message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
