import { LegalParagraph, LegalScreen, LegalSection, legalStyles } from '@/components/legal/LegalScreen';
import { Text } from 'react-native';

export default function PrivacyScreen() {
  return (
    <LegalScreen title="Privacy Policy" lastUpdated="June 2026">
      <Text style={legalStyles.leadHeading}>YOUR PRIVACY MATTERS</Text>
      <LegalParagraph>
        This Privacy Policy explains what information Bachayo collects, how we use it, and your
        rights. We keep this simple and honest.
      </LegalParagraph>

      <LegalSection title="1. What we collect">
        {`When you use Bachayo, we collect:

Account information:
• Your name, phone number, and email address
• Your location (city and area you select)
• Food preferences (if you choose to add them)

Usage information:
• Rescue bags you browse, reserve, and pick up
• Reviews you write
• App activity (to improve the experience)

Device information:
• Device type and operating system
• Push notification token (to send you alerts)

We do NOT collect:
• Payment card details (payments happen at the counter)
• Precise real-time GPS location without your permission
• Any data from your contacts, camera, or microphone beyond what you explicitly share`}
      </LegalSection>

      <LegalSection title="2. How we use your information">
        {`We use your information to:
• Create and manage your account
• Show you rescue bags near your selected location
• Send pickup reminders and order confirmations
• Notify restaurant partners of your reservations
• Improve the Bachayo app and fix issues
• Prevent fraud and abuse

We do NOT sell your personal data to anyone.
We do NOT show you third-party advertisements.`}
      </LegalSection>

      <LegalSection title="3. Who we share your data with">
        {`When you make a reservation, we share your name and phone number with the Partner so they can prepare your bag and contact you if needed.

We use the following services to operate Bachayo:
• Supabase (database and authentication) — data stored in Singapore region
• Expo (push notifications)
• Vercel (backend infrastructure)

These providers process data only as needed to run Bachayo and are bound by their own privacy policies.`}
      </LegalSection>

      <LegalSection title="4. Push notifications">
        {`We send push notifications for:
• Reservation confirmations
• Pickup reminders
• New rescue bags in your area

You can disable notifications at any time in your phone Settings or inside the Bachayo app under Profile → Notifications.`}
      </LegalSection>

      <LegalSection title="5. Data retention">
        {`We keep your account data for as long as your account is active. If you delete your account, we delete your personal data within 30 days, except where we are legally required to retain it.

Order history is retained for 12 months for record-keeping purposes.`}
      </LegalSection>

      <LegalSection title="6. Your rights">
        {`You have the right to:
• Access the personal data we hold about you
• Correct inaccurate information
• Delete your account and associated data
• Withdraw consent for notifications at any time

To exercise these rights, contact us at:
privacy@bachayo.app`}
      </LegalSection>

      <LegalSection title="7. Children">
        Bachayo is not intended for children under 13. We do not knowingly collect data from
        children.
      </LegalSection>

      <LegalSection title="8. Changes to this policy">
        We may update this Privacy Policy. We will notify you of significant changes via the app.
        Continued use of Bachayo after changes means you accept the updated policy.
      </LegalSection>

      <LegalSection title="9. Contact">
        {`Privacy questions or data requests:
Email: privacy@bachayo.app
Or use Help & Support in the app.`}
      </LegalSection>
    </LegalScreen>
  );
}
