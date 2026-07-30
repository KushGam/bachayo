import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function launchEmailHtml() {
  return `
          <!DOCTYPE html>
          <html>
          <body style="
            margin:0; padding:0;
            background:#F5F3EF;
            font-family:-apple-system,sans-serif;
          ">
            <table width="100%" cellpadding="0"
              cellspacing="0">
              <tr>
                <td align="center"
                  style="padding:40px 20px;">
                  <table width="480"
                    cellpadding="0"
                    cellspacing="0" style="
                    background:white;
                    border-radius:24px;
                    overflow:hidden;
                    box-shadow:0 4px 24px
                      rgba(0,0,0,0.06);
                  ">
                    <tr>
                      <td style="
                        background:#D85A30;
                        padding:40px;
                        text-align:center;
                      ">
                        <div style="
                          font-size:52px;
                          margin-bottom:8px;
                        ">🛍</div>
                        <div style="
                          color:white;
                          font-size:28px;
                          font-weight:900;
                          letter-spacing:-1px;
                        ">
                          LastBag is live!
                        </div>
                        <div style="
                          color:rgba(255,255,255,0.8);
                          font-size:16px;
                          margin-top:8px;
                        ">
                          You're among the first
                          to know 🎉
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="
                          margin:0 0 16px;
                          font-size:22px;
                          font-weight:700;
                          color:#1A1A1A;
                        ">
                          Rescue bags are
                          now live in Kathmandu!
                        </h2>
                        <p style="
                          margin:0 0 24px;
                          font-size:15px;
                          color:#6B7280;
                          line-height:1.7;
                        ">
                          You signed up to be
                          notified when LastBag
                          launches — and today
                          is that day! 🇳🇵
                        </p>
                        <div style="
                          background:#FAECE7;
                          border-radius:16px;
                          padding:20px;
                          margin-bottom:28px;
                        ">
                          <div style="
                            font-size:13px;
                            font-weight:700;
                            color:#993C1D;
                            text-transform:uppercase;
                            letter-spacing:0.06em;
                            margin-bottom:14px;
                          ">
                            WHAT YOU CAN DO
                          </div>
                          <div style="font-size:14px;color:#374151;margin-bottom:10px;">
                            🛍 Find rescue bags from restaurants near you
                          </div>
                          <div style="font-size:14px;color:#374151;margin-bottom:10px;">
                            💰 Save up to 70% on great food
                          </div>
                          <div style="font-size:14px;color:#374151;margin-bottom:10px;">
                            📱 Reserve for free — pay at pickup
                          </div>
                          <div style="font-size:14px;color:#374151;">
                            🌱 Help reduce food waste in Nepal
                          </div>
                        </div>
                        <div style="text-align:center;margin-bottom:28px;">
                          <a href="https://lastbag.app"
                            style="
                              display:inline-block;
                              background:#D85A30;
                              color:white;
                              font-size:17px;
                              font-weight:800;
                              text-decoration:none;
                              padding:18px 48px;
                              border-radius:999px;
                              letter-spacing:-0.3px;
                            ">
                            Rescue food now →
                          </a>
                        </div>
                        <div style="
                          border:1px solid #F0EDE8;
                          border-radius:14px;
                          padding:16px;
                          text-align:center;
                          margin-bottom:8px;
                        ">
                          <p style="margin:0 0 12px;font-size:13px;color:#6B7280;">
                            Know someone who'd love LastBag?
                          </p>
                          <a href="https://wa.me/?text=LastBag%20is%20live%20in%20Kathmandu!%20Find%20rescue%20bags%20from%20restaurants%20near%20you%20at%20up%20to%2070%25%20off.%20Check%20it%20out%20at%20lastbag.app%20%F0%9F%9B%8D"
                            style="
                              display:inline-block;
                              background:#25D366;
                              color:white;
                              font-size:13px;
                              font-weight:700;
                              text-decoration:none;
                              padding:10px 24px;
                              border-radius:999px;
                            ">
                            Share on WhatsApp 📲
                          </a>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="
                        background:#F9F9F7;
                        padding:24px 40px;
                        border-top:1px solid #F0EDE8;
                        text-align:center;
                      ">
                        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1A1A1A;">
                          🛍 LastBag
                        </p>
                        <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;">
                          Rescue food. Save money. Nepal 🇳🇵
                        </p>
                        <a href="https://lastbag.app" style="font-size:12px;color:#D85A30;text-decoration:none;">
                          lastbag.app
                        </a>
                        <p style="margin:12px 0 0;font-size:11px;color:#C4C0B8;">
                          © 2026 LastBag · Mamta Technologies<br/>
                          You received this because you joined our waitlist.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const valid = token ? await verifyAdminSession(token).catch(() => false) : false;
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    return NextResponse.json(
      { error: 'Gmail credentials are not configured' },
      { status: 500 },
    );
  }

  const supabase = createSupabaseAdmin();
  const { data: waitlist, error } = await supabase
    .from('waitlist')
    .select('email')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!waitlist || waitlist.length === 0) {
    return NextResponse.json({ error: 'No waitlist emails found' }, { status: 400 });
  }

  const emails = waitlist.map((w) => w.email).filter(Boolean);
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const html = launchEmailHtml();

  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: `"LastBag Nepal" <${gmailUser}>`,
        to: email,
        subject: 'LastBag is live in Kathmandu! 🎉🛍',
        html,
      });
      sent += 1;
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      console.error(`Failed to send to ${email}:`, err);
      failed += 1;
      errors.push(email);
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: emails.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
