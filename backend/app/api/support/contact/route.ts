import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Email service is not configured' },
        { status: 503 },
      );
    }

    const { subject, message, email, userId, role } =
      (await request.json()) as SupportContactBody;

    if (!subject?.trim() || !message?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'subject, message, and email are required' },
        { status: 400 },
      );
    }

    const safeSubject = escapeHtml(subject.trim());
    const safeMessage = escapeHtml(message.trim()).replace(/\n/g, '<br/>');
    const safeEmail = escapeHtml(email.trim());
    const safeUserId = escapeHtml(userId ?? '—');
    const safeRole = escapeHtml(role ?? '—');

    const { error } = await resend.emails.send({
      from: 'Bachayo Support <noreply@bachayo.app>',
      to: 'support@bachayo.app',
      replyTo: email.trim(),
      subject: `[Support] ${subject.trim()}`,
      html: `
        <h2>New support message</h2>
        <p><b>From:</b> ${safeEmail}</p>
        <p><b>User ID:</b> ${safeUserId}</p>
        <p><b>Role:</b> ${safeRole}</p>
        <p><b>Subject:</b> ${safeSubject}</p>
        <hr/>
        <p>${safeMessage}</p>
      `,
    });

    if (error) {
      console.error('[support/contact] Resend error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[support/contact]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
