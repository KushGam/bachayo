import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Delete your account',
  description:
    'Request deletion of your LastBag account and associated data. We process requests within 7 days.',
  alternates: {
    canonical: '/delete-account',
  },
};

const EMAIL_HREF =
  'mailto:lastbagnp@gmail.com?subject=' +
  encodeURIComponent('Delete my LastBag account') +
  '&body=' +
  encodeURIComponent('Please delete my account.\nMy registered email/phone is: ');

const WHATSAPP_HREF =
  'https://wa.me/9779716318840?text=' +
  encodeURIComponent('Please delete my LastBag account');

export default function DeleteAccountPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 15% 0%, rgba(216,90,48,0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 10%, rgba(216,90,48,0.06), transparent 50%)',
        }}
      />

      <div className="relative mx-auto max-w-xl px-6 pb-24 pt-28 md:pt-32">
        <p className="font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
          Account
        </p>
        <h1
          className="mt-4 font-display font-extrabold tracking-tight text-[var(--ink)]"
          style={{ fontSize: 'clamp(2.25rem, 5vw, 3.25rem)', lineHeight: 1.05 }}>
          Delete your account
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-[var(--text-secondary)]">
          To delete your LastBag account and all associated data, contact us below. We process
          requests within 7 days.
        </p>

        <div className="mt-10 space-y-3">
          <a
            href={EMAIL_HREF}
            className="group flex items-center gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[var(--primary)]/35 hover:shadow-[var(--shadow-md)]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 6.5h16v11H4v-11Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="m4 7 8 6 8-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[var(--ink)]">Email us</span>
              <span className="mt-0.5 block truncate text-sm text-[var(--text-muted)]">
                lastbagnp@gmail.com
              </span>
            </span>
            <span
              className="text-[var(--primary)] transition group-hover:translate-x-0.5"
              aria-hidden>
              →
            </span>
          </a>

          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#25D366]/40 hover:shadow-[var(--shadow-md)]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F8EE] text-[#128C7E]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.82c0 1.96.52 3.8 1.44 5.4L2 22l4.94-1.55a9.86 9.86 0 0 0 5.1 1.4h.01c5.46 0 9.89-4.4 9.89-9.82C21.94 6.4 17.5 2 12.04 2Zm5.5 13.96c-.23.64-1.33 1.18-1.84 1.26-.47.07-1.07.1-1.73-.11-.4-.12-.91-.28-1.57-.55-2.76-1.19-4.56-3.96-4.7-4.14-.13-.18-1.1-1.46-1.1-2.79 0-1.32.69-1.97.94-2.24.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.59.45.23.54.77 1.88.84 2.02.07.13.11.29.02.47-.09.18-.13.29-.26.45-.13.16-.28.35-.4.47-.13.13-.27.27-.12.53.16.27.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.13.43.11.59-.07.16-.18.69-.8.87-1.07.18-.27.36-.22.61-.13.24.09 1.55.73 1.82.86.27.13.45.2.51.31.07.11.07.64-.16 1.28Z" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[var(--ink)]">WhatsApp us</span>
              <span className="mt-0.5 block text-sm text-[var(--text-muted)]">9716318840</span>
            </span>
            <span
              className="text-[var(--primary)] transition group-hover:translate-x-0.5"
              aria-hidden>
              →
            </span>
          </a>

          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--bg-deep)] text-[var(--ink)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect
                    x="7"
                    y="2.5"
                    width="10"
                    height="19"
                    rx="2.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M10 5.5h4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[15px] font-semibold text-[var(--ink)]">Delete in app</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  You can also delete your account directly in the LastBag app:
                </p>
                <p className="mt-2 font-display text-sm font-semibold tracking-wide text-[var(--ink)]">
                  Profile → Settings → Delete account
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[20px] border border-[#E8D5C8] bg-[#FBF4EF] px-5 py-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-dark)]">
            Important
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            Deleting your account permanently removes your data — including orders, reviews, and
            profile information. This cannot be undone.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border)] pt-8 text-sm">
          <Link
            href="/legal/privacy"
            className="font-semibold text-[var(--primary)] transition hover:text-[var(--primary-dark)]">
            Privacy Policy
          </Link>
          <span className="text-[var(--border)]" aria-hidden>
            |
          </span>
          <Link
            href="/"
            className="font-semibold text-[var(--text-secondary)] transition hover:text-[var(--ink)]">
            Back to LastBag
          </Link>
        </div>
      </div>
    </main>
  );
}
