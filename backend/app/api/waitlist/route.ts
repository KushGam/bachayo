import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseAdmin } from '@/lib/supabase-admin';

type WaitlistBody = {
  email?: string;
  city?: string | null;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return email.includes('@') && email.includes('.');
}

function confirmationHtml(city: string | null) {
  const cityLine = city ? ` from ${city}` : '';
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
                <table width="480" cellpadding="0"
                  cellspacing="0" style="
                  background:white;
                  border-radius:24px;
                  overflow:hidden;
                  box-shadow:0 4px 24px
                    rgba(0,0,0,0.06);
                ">
                  <!-- HEADER -->
                  <tr>
                    <td style="
                      background:#D85A30;
                      padding:32px 40px;
                      text-align:center;
                    ">
                      <div style="font-size:40px">
                        🛍
                      </div>
                      <div style="
                        color:white;
                        font-size:24px;
                        font-weight:800;
                        margin-top:8px;
                      ">LastBag</div>
                      <div style="
                        color:rgba(255,255,255,0.7);
                        font-size:13px;
                        margin-top:4px;
                      ">
                        Rescue food. Save money.
                      </div>
                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="padding:40px;">

                      <h1 style="
                        margin:0 0 12px;
                        font-size:24px;
                        font-weight:700;
                        color:#1A1A1A;
                      ">
                        You're on the list! 🎉
                      </h1>

                      <p style="
                        margin:0 0 24px;
                        font-size:15px;
                        color:#6B7280;
                        line-height:1.7;
                      ">
                        Thanks for joining the LastBag
                        waitlist${cityLine}.
                        We're launching in Kathmandu
                        first and will email you the
                        moment we go live near you.
                      </p>

                      <!-- BENEFITS -->
                      <div style="
                        background:#FAECE7;
                        border-radius:16px;
                        padding:20px;
                        margin-bottom:24px;
                      ">
                        <div style="
                          font-size:12px;
                          font-weight:700;
                          color:#993C1D;
                          text-transform:uppercase;
                          letter-spacing:0.06em;
                          margin-bottom:12px;
                        ">
                          WHAT YOU'LL GET
                        </div>
                        <div style="
                          font-size:14px;
                          color:#374151;
                          margin-bottom:8px;
                        ">
                          🛍 Rescue bags up to 70% off
                        </div>
                        <div style="
                          font-size:14px;
                          color:#374151;
                          margin-bottom:8px;
                        ">
                          📱 Free to reserve —
                          pay at pickup only
                        </div>
                        <div style="
                          font-size:14px;
                          color:#374151;
                        ">
                          🌱 Help reduce food waste
                          in Nepal
                        </div>
                      </div>

                      <!-- SHARE -->
                      <div style="
                        border:1px solid #F0EDE8;
                        border-radius:12px;
                        padding:16px;
                        text-align:center;
                      ">
                        <p style="
                          margin:0 0 12px;
                          font-size:13px;
                          color:#6B7280;
                        ">
                          Know a restaurant that
                          should join LastBag?
                        </p>
                        <a href="https://wa.me/?text=Check%20out%20LastBag%20-%20Nepal's%20first%20food%20rescue%20app!%20lastbag.app%20🛍"
                          style="
                            display:inline-block;
                            background:#25D366;
                            color:white;
                            font-size:13px;
                            font-weight:600;
                            text-decoration:none;
                            padding:10px 20px;
                            border-radius:999px;
                          ">
                          Share on WhatsApp 📲
                        </a>
                      </div>

                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="
                      background:#F9F9F7;
                      padding:24px 40px;
                      border-top:1px solid #F0EDE8;
                      text-align:center;
                    ">
                      <p style="
                        margin:0 0 4px;
                        font-size:13px;
                        font-weight:600;
                        color:#1A1A1A;
                      ">🛍 LastBag</p>
                      <p style="
                        margin:0 0 8px;
                        font-size:12px;
                        color:#9CA3AF;
                      ">
                        Rescue food. Save money.
                        Nepal 🇳🇵
                      </p>
                      <a href="https://lastbag.app"
                        style="
                          font-size:12px;
                          color:#D85A30;
                          text-decoration:none;
                        ">
                        lastbag.app
                      </a>
                      <p style="
                        margin:12px 0 0;
                        font-size:11px;
                        color:#C4C0B8;
                      ">
                        © 2026 LastBag ·
                        Mamta Technologies
                        <br/>
                        Kathmandu, Nepal
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
  try {
    const { email } = (await request.json()) as WaitlistBody;
    const normalizedEmail = email ? normalizeEmail(email) : '';

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { error: dbError } = await supabaseAdmin.from('waitlist').insert({
      email: normalizedEmail,
      city: null,
    });

    if (dbError?.code === '23505') {
      return NextResponse.json({
        success: true,
        message: "You're already on the list! We'll notify you when we launch.",
      });
    }

    if (dbError) {
      console.error('Waitlist insert failed:', dbError);
      return NextResponse.json(
        { error: 'Something went wrong. Try again.' },
        { status: 500 },
      );
    }

    try {
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_APP_PASSWORD;

      if (gmailUser && gmailPass) {
        await transporter.sendMail({
          from: `"LastBag Nepal" <${gmailUser}>`,
          to: normalizedEmail,
          subject: "You're on the LastBag waitlist! 🛍",
          html: confirmationHtml(null),
        });

        await transporter.sendMail({
          from: `"LastBag" <${gmailUser}>`,
          to: gmailUser,
          subject: `🔔 New waitlist signup: ${normalizedEmail}`,
          html: `
        <h2>New waitlist signup! 🎉</h2>
        <p>
          <strong>Email:</strong> ${normalizedEmail}<br/>
          <strong>Time:</strong>
            ${new Date().toLocaleString('en-NP', {
              timeZone: 'Asia/Kathmandu',
            })}
        </p>
        <hr/>
        <p>
          <a href="https://lastbag.app/admin">
            View all signups in admin →
          </a>
        </p>
      `,
        });
      } else {
        console.warn('GMAIL_USER or GMAIL_APP_PASSWORD missing — skipped waitlist emails');
      }
    } catch (emailError) {
      // Don't fail the request if email fails — user is already saved to DB
      console.error('Email send failed:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: "✅ You're on the list! We'll notify you when LastBag launches near you.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not join waitlist';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
