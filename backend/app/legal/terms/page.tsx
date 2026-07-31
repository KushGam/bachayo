import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Terms of Service — LastBag',
  description: 'The terms that govern your use of the LastBag app and website.',
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

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            Legal
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-[var(--ink)]">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Last updated: July 2026</p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-12 pb-24">
        <p className="text-lg font-semibold text-[var(--ink)]">Welcome to LastBag</p>
        <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
          These Terms of Service govern your use of the LastBag app and website (“LastBag”, “we”,
          “us”), a food rescue marketplace connecting restaurants, cafés, bakeries, hotels, and
          marts (“Partners”) with customers. By using LastBag, you agree to these terms. Please
          read them carefully.
        </p>

        <Section title="1. What LastBag does">
          <p>
            LastBag helps Partners list surplus food as discounted “rescue bags” and helps
            customers find and reserve them. LastBag is a reservation platform — we do not prepare,
            handle, or deliver food. All food transactions happen directly between the customer and
            the Partner at the Partner&apos;s location.
          </p>
        </Section>

        <Section title="2. Accounts">
          <p>
            You must provide accurate information when creating an account. You are responsible for
            keeping your login details secure. LastBag accounts are personal and non-transferable.
            We reserve the right to suspend accounts that violate these terms.
          </p>
        </Section>

        <Section title="3. Reservations">
          <p>When you reserve a rescue bag:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Your reservation is confirmed immediately via QR code</li>
            <li>You are committed to picking up the bag during the stated pickup window</li>
            <li>
              Payment is made directly to the Partner at pickup — LastBag does not process payments
            </li>
            <li>The Partner determines accepted payment methods (cash, eSewa, Khalti, etc.)</li>
          </ul>
          <p>
            <strong className="text-[var(--ink)]">Cancellation policy:</strong>
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Cancel more than 1 hour before pickup: free, slot released immediately</li>
            <li>
              Cancel 30–60 minutes before pickup: allowed but please avoid — the restaurant may
              have prepared your bag
            </li>
            <li>
              Cancel within 30 minutes of pickup: not allowed — please contact the restaurant
              directly if needed
            </li>
            <li>No-shows: bags are forfeited after the pickup window closes</li>
          </ul>
          <p>
            Uncollected bags are forfeited. Please cancel reservations you cannot fulfil so others
            can benefit.
          </p>
        </Section>

        <Section title="4. For Partners (business owners)">
          <p>Partners agree to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>List only food that is safe for consumption</li>
            <li>Honour all confirmed reservations during the stated pickup window</li>
            <li>Maintain accurate business information</li>
            <li>Pay the applicable subscription fee after the free trial period ends</li>
          </ul>
          <p>
            LastBag may remove Partners who repeatedly fail to honour reservations or receive
            consistent complaints about food safety.
          </p>
        </Section>

        <Section title="5. Subscription (Partners only)">
          <p>Partners access LastBag through a monthly subscription:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Small: NPR 1,000/month</li>
            <li>Medium: NPR 1,500/month</li>
            <li>Large: NPR 3,500/month</li>
          </ul>
          <p>
            A 30-day free trial is provided on signup. After the trial, listings are paused until a
            subscription is active. Subscriptions renew monthly. Cancellation takes effect at the
            end of the current period.
          </p>
        </Section>

        <Section title="6. Prohibited conduct">
          <p>You may not:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Create fake reservations or reviews</li>
            <li>Use LastBag to sell items other than surplus food</li>
            <li>
              Attempt to circumvent the platform by arranging off-app transactions after initial
              contact
            </li>
            <li>Upload false, misleading, or harmful content</li>
            <li>Misuse or reverse-engineer the LastBag app</li>
          </ul>
        </Section>

        <Section title="7. Food safety">
          <p>
            LastBag is not responsible for the quality, safety, or contents of food provided by
            Partners. If you have a food safety concern, contact the Partner directly and report
            the issue to us at{' '}
            <a className="text-[var(--primary)] underline" href="mailto:support@lastbag.app">
              support@lastbag.app
            </a>
            .
          </p>
        </Section>

        <Section title="8. Intellectual property">
          <p>
            The LastBag name, logo, and app design are owned by LastBag. You may not reproduce or
            use them without written permission.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>
            LastBag provides a platform service only. We are not liable for disputes between
            customers and Partners, food quality issues, missed pickups, or losses arising from use
            of the app.
          </p>
        </Section>

        <Section title="10. Changes to these terms">
          <p>
            We may update these terms from time to time. Continued use of LastBag after changes
            means you accept the updated terms. We will notify you of significant changes via the
            app.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about these terms? Email{' '}
            <a className="text-[var(--primary)] underline" href="mailto:legal@lastbag.app">
              legal@lastbag.app
            </a>{' '}
            or use Help &amp; Support in the app.
          </p>
          <p>LastBag is operated in Nepal. These terms are governed by the laws of Nepal.</p>
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
