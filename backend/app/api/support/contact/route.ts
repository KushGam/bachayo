import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

import { createSupabaseAdmin } from '@/lib/supabase-admin';

type SupportContactBody = {
  subject?: string;
  message?: string;
  email?: string;
  userId?: string | null;
  role?: string | null;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  try {
    const { subject, message, email, userId, role } =
      (await request.json()) as SupportContactBody;

    if (!subject?.trim() || !message?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'subject, message, and email are required' },
        { status: 400 },
      );
    }

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    const trimmedEmail = email.trim();

    const supabase = createSupabaseAdmin();
    const { error: insertError } = await supabase.from('support_messages').insert({
      subject: trimmedSubject,
      message: trimmedMessage,
      email: trimmedEmail,
      user_id: userId || null,
      role: role || null,
      status: 'new',
    });

    if (insertError) {
      console.error('[support/contact] DB insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Could not save your message. Please try again.' },
        { status: 500 },
      );
    }

    // Email is best-effort — admin inbox is the source of truth.
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const safeSubject = escapeHtml(trimmedSubject);
        const safeMessage = escapeHtml(trimmedMessage).replace(/\n/g, '<br/>');
        const safeEmail = escapeHtml(trimmedEmail);
        const safeUserId = escapeHtml(userId ?? '—');
        const safeRole = escapeHtml(role ?? '—');

        const { error } = await resend.emails.send({
          from: 'LastBag Support <noreply@lastbag.app>',
          to: 'support@lastbag.app',
          replyTo: trimmedEmail,
          subject: `[LastBag Support] ${trimmedSubject}`,
          html: `
            <h2>New support message</h2>
            <p><b>From:</b> ${safeEmail}</p>
            <p><b>User ID:</b> ${safeUserId}</p>
            <p><b>Role:</b> ${safeRole}</p>
            <p><b>Subject:</b> ${safeSubject}</p>
            <hr/>
            <p>${safeMessage}</p>
            <p style="color:#6B7280;font-size:12px;margin-top:24px">Also saved in LastBag Admin → Support</p>
          `,
        });

        if (error) {
          console.error('[support/contact] Resend error:', error);
        }
      } catch (emailError) {
        console.error('[support/contact] email send failed:', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[support/contact]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
