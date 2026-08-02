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
  encodeURIComponent(
    'Please delete my account.\nMy registered email/phone is: ',
  );

const WHATSAPP_HREF =
  'https://wa.me/9779716318840?text=' +
  encodeURIComponent('Please delete my LastBag account');

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-xl px-6 py-10 md:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            Account
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-[var(--ink)]">
            Delete your account
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-6 py-12 pb-24">
        <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
          To delete your LastBag account and all associated data, please contact us using one of
          the methods below. We will process your request within 7 days.
        </p>

        <div className="mt-8 space-y-3">
          <a
            href={EMAIL_HREF}
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-[15px] font-semibold text-[var(--ink)] shadow-[var(--shadow-sm)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--primary-light)]">
            <span className="text-xl" aria-hidden>
              📧
            </span>
            Email us
            <span className="ml-auto text-sm font-medium text-[var(--primary)]">→</span>
          </a>

          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-[15px] font-semibold text-[var(--ink)] shadow-[var(--shadow-sm)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--primary-light)]">
            <span className="text-xl" aria-hidden>
              💬
            </span>
            WhatsApp us
            <span className="ml-auto text-sm font-medium text-[var(--primary)]">9716318840</span>
          </a>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-sm)]">
            <p className="flex items-center gap-3 text-[15px] font-semibold text-[var(--ink)]">
              <span className="text-xl" aria-hidden>
                📱
              </span>
              Delete in app
            </p>
            <p className="mt-2 pl-9 text-sm leading-relaxed text-[var(--text-secondary)]">
              You can also delete your account directly in the LastBag app:
              <br />
              Profile → Settings → Delete account
            </p>
          </div>
        </div>

        <p className="mt-10 rounded-2xl border border-[var(--border)] bg-[#FAFAF8] px-5 py-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          Deleting your account will permanently remove all your data including orders, reviews,
          and profile information. This action cannot be undone.
        </p>

        <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
          <Link href="/legal/privacy" className="text-[var(--primary)] underline">
            Privacy Policy
          </Link>
          {' · '}
          <Link href="/" className="text-[var(--primary)] underline">
            Back to LastBag
          </Link>
        </p>
      </div>
    </main>
  );
}
