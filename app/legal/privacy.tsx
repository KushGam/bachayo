import { LegalParagraph, LegalScreen, LegalSection, legalStyles } from '@/components/legal/LegalScreen';
import { Text } from 'react-native';

export default function PrivacyScreen() {
  return (
    <LegalScreen title="Privacy Policy" lastUpdated="July 2026">
      <Text style={legalStyles.leadHeading}>YOUR PRIVACY MATTERS</Text>
      <LegalParagraph>
        This Privacy Policy explains what information LastBag (&quot;LastBag&quot;, &quot;we&quot;,
        &quot;us&quot;) collects, how we use it, who we share it with, and your rights. LastBag is a
        food rescue app operated in Nepal. We keep this policy clear and honest.
      </LegalParagraph>
      <LegalParagraph>
        By creating an account or using LastBag, you agree to this Privacy Policy.
      </LegalParagraph>

      <LegalSection title="1. Who we are">
        {`LastBag is the controller of your personal data for the purposes described in this policy.

Contact for privacy questions:
Email: privacy@lastbag.app
Support: support@lastbag.app
Or use Help & Support → Contact us in the app.`}
      </LegalSection>

      <LegalSection title="2. What we collect">
        {`When you use LastBag, we may collect:

Account information:
• Name, phone number, and email address
• Account role (customer or restaurant partner)
• City and area you select as your home location
• Optional food preferences
• Profile photo (if you upload one)
• For partners: business name, address, coordinates, category, opening hours, cover photo, and subscription details

Usage information:
• Rescue bags you browse, reserve, cancel, miss, or pick up
• Order chat messages between you and a partner for a reservation
• Reviews, ratings, and partner replies
• Support messages you send through Help & Contact us
• In-app activity needed to operate and improve the service

Device and technical information:
• Device type, operating system, and app version
• Push notification token (to send alerts)
• Approximate diagnostics and crash/performance signals from our app platform
• Analytics events (for example screen views and feature usage) in aggregated or pseudonymous form where configured

Location:
• The city/area you choose in the app
• Precise location only if you grant permission (for example map or nearby features)

Photos and camera:
• Photos you choose to upload (for example review photos or partner cover images)
• Camera access only when you use features that need it (for example scanning a pickup QR code)

We do NOT collect:
• Payment card or wallet passwords — customers pay the partner directly at pickup (cash, eSewa, Khalti, or other methods the partner accepts)
• Contacts from your phone
• Microphone audio
• Precise GPS continuously in the background without a clear feature need and your permission`}
      </LegalSection>

      <LegalSection title="3. How we use your information">
        {`We use your information to:
• Create and manage your account (including Google sign-in if you choose it)
• Show rescue bags near your selected location
• Process reservations, cancellations, no-shows (missed pickups), and pickup confirmation
• Enable order chat between customers and partners
• Send push notifications (confirmations, reminders, messages, review replies, partner alerts)
• Notify partners of reservations and customers of partner replies or order updates
• Provide Help & Support and respond to Contact us messages
• Operate partner subscriptions and billing records
• Improve LastBag, fix bugs, and understand product usage
• Prevent fraud, abuse, and security incidents
• Comply with legal obligations in Nepal where applicable

We do NOT sell your personal data.
We do NOT show third-party advertisements in the app.`}
      </LegalSection>

      <LegalSection title="4. Who we share your data with">
        {`We share personal data only as needed to run LastBag:

A. Restaurant partners
When you reserve a bag, we share your name, phone number, reservation details, service type (takeaway/dine-in), and related order information with that partner so they can prepare your bag and contact you if needed. Chat messages on an order are visible to both participants.

B. Service providers (processors)
We use trusted providers who process data on our behalf to operate the app and website:

• Expo (Expo Application Services) — app builds, updates, and Expo Push Notification service for alerts
• Supabase — authentication, database, file storage, and realtime features (project data hosted in the Singapore region where configured)
• Vercel — hosting for our website and backend APIs
• Google — Google Sign-In if you choose to sign in with Google; map/directions links may open Google Maps
• Apple — if you use Sign in with Apple or Apple Maps / iOS system services where applicable
• Resend — transactional and support emails (for example Contact us notifications)
• PostHog — product analytics to understand how features are used (configured via our analytics settings)
• Apple App Store / Google Play — app distribution and, where relevant, store account identifiers for installs/updates
• Mapping providers — map tiles and location display via system or third-party map SDKs when you use map features

These providers may process data in countries outside Nepal. They may only use your data to provide services to us, under their terms and privacy policies, and appropriate safeguards where required.

C. Legal and safety
We may disclose information if required by law, regulation, legal process, or to protect the rights, safety, or property of LastBag, our users, or the public.

D. Business transfers
If LastBag is involved in a merger, acquisition, or asset sale, personal data may be transferred as part of that transaction, with notice where required.`}
      </LegalSection>

      <LegalSection title="5. Payments">
        {`LastBag does not process customer payments for rescue bags. You pay the partner at pickup.

Partner subscription fees (after trial) may be recorded in our systems. Payment method details for partner subscriptions are handled according to the payment channel used and are not stored as full card numbers in LastBag where we do not process cards ourselves.`}
      </LegalSection>

      <LegalSection title="6. Push notifications">
        {`With your permission, we send push notifications for things like:
• Reservation and pickup reminders
• New messages on an order
• Partner replies to your review
• Partner operational alerts (for partners)

Tokens are delivered through Expo’s push infrastructure. You can turn notifications off in your phone Settings or in LastBag under Profile → Notifications.`}
      </LegalSection>

      <LegalSection title="7. Data retention">
        {`We keep account data while your account is active.

If you delete your account, we delete or anonymise personal data within 30 days, except where we must keep records longer for legal, accounting, dispute, or fraud-prevention reasons (for example order history may be retained for up to 12 months or longer if required).

Support messages may be retained to handle your request and improve support quality.`}
      </LegalSection>

      <LegalSection title="8. Your rights">
        {`Subject to applicable law in Nepal, you may request to:
• Access the personal data we hold about you
• Correct inaccurate information
• Delete your account and associated personal data
• Withdraw consent for optional permissions (notifications, location, camera) at any time in device or app settings

To exercise these rights, email privacy@lastbag.app or use Help & Support in the app. We may need to verify your identity before fulfilling a request.`}
      </LegalSection>

      <LegalSection title="9. Security">
        {`We use industry-standard measures to protect your data (including encrypted connections and access controls). No method of transmission or storage is 100% secure; please keep your login details confidential.`}
      </LegalSection>

      <LegalSection title="10. Children">
        LastBag is not directed at children under 13. We do not knowingly collect personal data from
        children under 13. If you believe a child has provided data, contact privacy@lastbag.app and
        we will take appropriate steps.
      </LegalSection>

      <LegalSection title="11. International processing">
        {`Some providers listed above operate servers outside Nepal (for example Singapore, the EU, or the United States). By using LastBag you understand your information may be processed in those locations as needed to provide the service.`}
      </LegalSection>

      <LegalSection title="12. Changes to this policy">
        {`We may update this Privacy Policy from time to time. We will update the “Last updated” date and, for significant changes, notify you in the app or by email where appropriate. Continued use of LastBag after an update means you accept the revised policy.`}
      </LegalSection>

      <LegalSection title="13. Contact">
        {`Privacy questions or data requests:
Email: privacy@lastbag.app
Support: support@lastbag.app
In-app: Help & Support → Contact us`}
      </LegalSection>
    </LegalScreen>
  );
}
