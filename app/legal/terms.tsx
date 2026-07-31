import { LegalParagraph, LegalScreen, LegalSection, legalStyles } from '@/components/legal/LegalScreen';
import { Text } from 'react-native';

export default function TermsScreen() {
  return (
    <LegalScreen title="Terms of Service" lastUpdated="June 2026">
      <Text style={legalStyles.leadHeading}>WELCOME TO BACHAYO</Text>
      <LegalParagraph>
        These Terms of Service govern your use of the LastBag app ("LastBag", "we", "us"), a food
        rescue marketplace connecting restaurants, cafes, bakeries, hotels, and marts ("Partners")
        with customers in Nepal.
      </LegalParagraph>
      <LegalParagraph>
        By using LastBag, you agree to these terms. Please read them carefully.
      </LegalParagraph>

      <LegalSection title="1. What LastBag does">
        LastBag helps Partners list surplus food as discounted "rescue bags" and helps customers
        find and reserve them. LastBag is a reservation platform — we do not prepare, handle, or
        deliver food. All food transactions happen directly between the customer and the Partner at
        the Partner's location.
      </LegalSection>

      <LegalSection title="2. Accounts">
        You must provide accurate information when creating an account. You are responsible for
        keeping your login details secure. LastBag accounts are personal and non-transferable. We
        reserve the right to suspend accounts that violate these terms.
      </LegalSection>

      <LegalSection title="3. Reservations">
        {`When you reserve a rescue bag:
• Your reservation is confirmed immediately via QR code
• You are committed to picking up the bag during the stated pickup window
• Payment is made directly to the Partner at pickup — LastBag does not process payments
• The Partner determines accepted payment methods (cash, eSewa, Khalti, etc.)

CANCELLATION POLICY:
• Cancel more than 1 hour before pickup: Free, slot released immediately
• Cancel 30–60 minutes before pickup: Allowed but please avoid — restaurant may have prepared your bag
• Cancel within 30 minutes of pickup: Not allowed — please contact the restaurant directly if needed
• No-shows: Bags are forfeited after the pickup window closes

Uncollected bags are forfeited. Please cancel reservations you cannot fulfil so others can benefit.`}
      </LegalSection>

      <LegalSection title="4. For Partners (restaurant owners)">
        {`Partners agree to:
• List only food that is safe for consumption
• Honour all confirmed reservations during the stated pickup window
• Maintain accurate business information
• Pay the applicable subscription fee after the free trial period ends

LastBag may remove Partners who repeatedly fail to honour reservations or receive consistent complaints about food safety.`}
      </LegalSection>

      <LegalSection title="5. Subscription (Partners only)">
        {`Partners access LastBag through a monthly subscription:
• Small: NPR 1,000/month
• Medium: NPR 1,500/month
• Large: NPR 3,500/month

A 30-day free trial is provided on signup. After the trial, listings are paused until a subscription is active. Subscriptions renew monthly. Cancellation takes effect at the end of the current period.`}
      </LegalSection>

      <LegalSection title="6. Prohibited conduct">
        {`You may not:
• Create fake reservations or reviews
• Use LastBag to sell items other than surplus food
• Attempt to circumvent the platform by arranging off-app transactions after initial contact
• Upload false, misleading, or harmful content
• Misuse or reverse-engineer the LastBag app`}
      </LegalSection>

      <LegalSection title="7. Food safety">
        LastBag is not responsible for the quality, safety, or contents of food provided by Partners.
        If you have a food safety concern, contact the Partner directly and report the issue to us at
        support@lastbag.app.
      </LegalSection>

      <LegalSection title="8. Intellectual property">
        The LastBag name, logo, and app design are owned by LastBag. You may not reproduce or use
        them without written permission.
      </LegalSection>

      <LegalSection title="9. Limitation of liability">
        LastBag provides a platform service only. We are not liable for disputes between customers
        and Partners, food quality issues, missed pickups, or losses arising from use of the app.
      </LegalSection>

      <LegalSection title="10. Changes to these terms">
        We may update these terms from time to time. Continued use of LastBag after changes means you
        accept the updated terms. We will notify you of significant changes via the app.
      </LegalSection>

      <LegalSection title="11. Contact">
        {`Questions about these terms?
Email: legal@lastbag.app
Or use Help & Support in the app.`}
      </LegalSection>

      <LegalParagraph>
        LastBag is operated in Nepal. These terms are governed by the laws of Nepal.
      </LegalParagraph>
    </LegalScreen>
  );
}
