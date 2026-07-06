export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  audience: 'customer' | 'partner' | 'all';
};

export const CUSTOMER_FAQ: FaqItem[] = [
  {
    id: 'how-it-works',
    audience: 'customer',
    question: 'How does LastBag work?',
    answer:
      'LastBag connects you with restaurants, cafes, bakeries, marts, and hotels that have surplus food at the end of the day. Browse rescue bags near you, reserve one for free, then pick it up during the stated time window and pay at the counter.',
  },
  {
    id: 'cost',
    audience: 'customer',
    question: 'How much does it cost?',
    answer:
      'Rescue bags are sold at 50–70% off the original price. The exact price is shown on each bag before you reserve. You pay directly at the restaurant — cash, eSewa, Khalti, or whatever the restaurant accepts.',
  },
  {
    id: 'whats-in-bag',
    audience: 'customer',
    question: "What's in a rescue bag?",
    answer:
      'Each bag is a surprise — that\'s part of what makes it fun! The restaurant describes what kind of food to expect (e.g. "dal bhat set", "bakery mix"). Contents vary day to day based on what\'s surplus.',
  },
  {
    id: 'cancel',
    audience: 'customer',
    question: 'Can I cancel a reservation?',
    answer:
      'Yes. Go to My Bags, find your reservation, and tap "Cancel reservation". Please cancel as early as possible so the bag can be offered to someone else.',
  },
  {
    id: 'late-pickup',
    audience: 'customer',
    question: "What if I'm late to pick up?",
    answer:
      'Try to arrive within the pickup window. If you\'ll be late, you can call the restaurant directly using the phone number on your confirmation screen. Uncollected bags after the window closes are forfeited.',
  },
  {
    id: 'food-quality',
    audience: 'customer',
    question: 'What if the food quality is bad?',
    answer:
      'We\'re sorry to hear that. Please tap "Report an issue" in your order details or contact us at support@lastbag.app. We take food safety seriously and will follow up with the restaurant.',
  },
  {
    id: 'cities',
    audience: 'customer',
    question: 'Is LastBag available outside Kathmandu?',
    answer:
      "We're currently launching in Kathmandu, Lalitpur, Pokhara, and Bharatpur. More cities coming soon!",
  },
  {
    id: 'change-location',
    audience: 'customer',
    question: 'How do I change my location?',
    answer: 'Go to Profile → Home location and select your area.',
  },
  {
    id: 'otp',
    audience: 'customer',
    question: "I didn't receive my OTP. What do I do?",
    answer:
      'Check that you entered the correct phone number. OTPs can take up to 60 seconds. If you still don\'t receive it, tap "Resend OTP". If the problem persists, contact us at support@lastbag.app.',
  },
];

export const PARTNER_FAQ: FaqItem[] = [
  {
    id: 'list-bag',
    audience: 'partner',
    question: 'How do I list a rescue bag?',
    answer:
      'Tap "List today\'s rescue bag" on your dashboard. Fill in the bag name, what\'s inside, prices, number of bags, and pickup window. Your listing goes live immediately.',
  },
  {
    id: 'payment',
    audience: 'partner',
    question: 'When do I get paid?',
    answer:
      'You collect payment directly from customers at pickup — cash, eSewa, Khalti, or any method you accept. LastBag does not handle payments.',
  },
  {
    id: 'subscription',
    audience: 'partner',
    question: 'How does the subscription work?',
    answer:
      'You get 30 days free to try LastBag. After that, choose a plan based on your business size. Your listings are paused if subscription lapses. Go to Profile → Subscription & billing to manage.',
  },
  {
    id: 'scan-qr',
    audience: 'partner',
    question: "How do I scan a customer's QR code?",
    answer:
      'Tap the "Scan QR" tab in the bottom navigation. Point your camera at the customer\'s QR code. Once scanned, tap "Mark as picked up" to complete the order.',
  },
  {
    id: 'no-show',
    audience: 'partner',
    question: "What if a customer doesn't show up?",
    answer:
      'After the pickup window closes, unreserved bags are automatically marked as expired. If a customer reserved but didn\'t come, the order is marked as missed. Repeated no-shows by the same customer are flagged in our system.',
  },
  {
    id: 'edit-bag',
    audience: 'partner',
    question: 'Can I edit a bag after listing it?',
    answer:
      'Yes. Go to My Bags → Today → tap the three-dot menu on the bag → Edit. You can update quantity and description but not the pickup window once orders have been placed.',
  },
];

export const SUPPORT_SUBJECTS = [
  'Reservation issue',
  'Account problem',
  'Food quality complaint',
  'Partner / subscription',
  'Suggestion or feedback',
  'Other',
] as const;

export type SupportSubject = (typeof SUPPORT_SUBJECTS)[number];

export const SUPPORT_EMAIL = 'support@lastbag.app';

/** Replace with your WhatsApp Business number (country code, no +). */
export const SUPPORT_WHATSAPP = '9779800000000';
