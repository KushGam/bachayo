import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Privacy Policy — LastBag',
  description: 'How LastBag collects, uses, and shares personal data.',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-[var(--ink)]">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            Legal
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-[var(--ink)]">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Last updated: July 2026</p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-12 pb-24">
        <p className="text-lg font-semibold text-[var(--ink)]">Your privacy matters</p>
        <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
          This Privacy Policy explains what information LastBag (“LastBag”, “we”, “us”) collects,
          how we use it, who we share it with, and your rights. LastBag is a food rescue app
          operated in Nepal. By creating an account or using LastBag, you agree to this policy.
        </p>

        <Section title="1. Who we are">
          <p>
            LastBag is the controller of your personal data for the purposes described here.
            Privacy: <a className="text-[var(--primary)] underline" href="mailto:privacy@lastbag.app">privacy@lastbag.app</a>
            {' · '}
            Support: <a className="text-[var(--primary)] underline" href="mailto:support@lastbag.app">support@lastbag.app</a>
          </p>
        </Section>

        <Section title="2. What we collect">
          <p>
            Account details (name, phone, email, role, city/area, optional preferences and photos);
            partner business details and subscription records; reservations, cancellations, missed
            pickups, chat messages, reviews; support Contact us messages; device/app info and push
            tokens; analytics events; location and camera only when you grant permission for a
            feature.
          </p>
          <p>
            We do not collect payment card details for rescue bags — customers pay partners at
            pickup (cash, eSewa, Khalti, or other methods the partner accepts).
          </p>
        </Section>

        <Section title="3. How we use your information">
          <p>
            To run accounts and Google sign-in, show nearby bags, process orders and pickup
            confirmation, enable chat, send notifications, support partners and customers, operate
            subscriptions, improve the product, prevent abuse, and meet legal obligations. We do
            not sell personal data or show third-party ads in the app.
          </p>
        </Section>

        <Section title="4. Who we share your data with">
          <p>
            <strong className="text-[var(--ink)]">Partners:</strong> for a reservation we share your
            name, phone, and order details with that restaurant so they can prepare and contact you.
            Order chat is visible to both sides.
          </p>
          <p>
            <strong className="text-[var(--ink)]">Service providers:</strong> we use providers that
            process data to operate LastBag, including:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[var(--ink)]">Expo</strong> — app builds/updates and Expo Push
              Notification delivery
            </li>
            <li>
              <strong className="text-[var(--ink)]">Supabase</strong> — auth, database, storage, and
              realtime (Singapore region where configured)
            </li>
            <li>
              <strong className="text-[var(--ink)]">Vercel</strong> — website and API hosting
            </li>
            <li>
              <strong className="text-[var(--ink)]">Google</strong> — Google Sign-In (if used) and
              Google Maps links/directions
            </li>
            <li>
              <strong className="text-[var(--ink)]">Apple</strong> — App Store / iOS system services
              and Apple Maps where applicable
            </li>
            <li>
              <strong className="text-[var(--ink)]">Resend</strong> — transactional and support email
            </li>
            <li>
              <strong className="text-[var(--ink)]">PostHog</strong> — product analytics
            </li>
            <li>
              <strong className="text-[var(--ink)]">Apple App Store / Google Play</strong> — app
              distribution
            </li>
            <li>Map SDKs / system maps when you use map features</li>
          </ul>
          <p>
            Providers may process data outside Nepal under their own privacy terms, only as needed
            to provide services to us. We may also disclose data for legal/safety reasons or in a
            business transfer.
          </p>
        </Section>

        <Section title="5. Payments">
          <p>
            LastBag does not process customer payments for rescue bags. Partner subscription records
            may be stored in our systems; we do not store full card numbers where we are not the
            card processor.
          </p>
        </Section>

        <Section title="6. Push notifications">
          <p>
            With permission, alerts are sent via Expo Push (confirmations, reminders, messages,
            partner alerts). You can disable them in device settings or Profile → Notifications.
          </p>
        </Section>

        <Section title="7. Retention & your rights">
          <p>
            We keep account data while active. After account deletion we delete or anonymise
            personal data within 30 days, except where longer retention is required for legal or
            fraud reasons (order history may be kept around 12 months or longer if required).
          </p>
          <p>
            You may request access, correction, or deletion by emailing privacy@lastbag.app. You can
            withdraw optional permissions (notifications, location, camera) in device or app
            settings.
          </p>
        </Section>

        <Section title="8. Security, children & changes">
          <p>
            We use standard security measures (including encrypted connections). LastBag is not for
            children under 13. We may update this policy and will change the “Last updated” date;
            significant changes may also be announced in the app.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Email{' '}
            <a className="text-[var(--primary)] underline" href="mailto:privacy@lastbag.app">
              privacy@lastbag.app
            </a>{' '}
            or{' '}
            <a className="text-[var(--primary)] underline" href="mailto:support@lastbag.app">
              support@lastbag.app
            </a>
            . In the app: Help & Support → Contact us.
          </p>
        </Section>

        <p className="mt-14 text-sm text-[var(--text-muted)]">
          <Link href="/" className="text-[var(--primary)] hover:underline">
            ← Back to LastBag
          </Link>
        </p>
      </article>
    </main>
  );
}
