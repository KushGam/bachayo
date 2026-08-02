/** Manual partner billing — partners pay via eSewa/Khalti/bank; admin marks paid. */
export const MANUAL_BILLING = {
  esewaId: '9716318840',
  khaltiId: '9716318840',
  whatsappPhone: '9779716318840',
  supportEmail: 'lastbagnp@gmail.com',
  bank: {
    name: 'Prime Commercial Bank',
    accountName: 'Kushal Gautam',
    /** Replace with the real account number before publish. */
    accountNumber: 'XXXXXXXXXXXXXXXX',
    branch: 'Thantipokhari, Gorkha',
  },
} as const;

export const PLAN_FEATURES: Record<
  'small' | 'medium' | 'large',
  { title: string; features: string[]; popular?: boolean }
> = {
  small: {
    title: 'Small Plan',
    features: ['Up to 5 bag listings / day', 'QR pickup', 'Email support', 'Sales analytics'],
  },
  medium: {
    title: 'Medium Plan',
    popular: true,
    features: ['Up to 15 bag listings / day', 'Analytics', 'Priority support'],
  },
  large: {
    title: 'Large Plan',
    features: [
      'Unlimited bag listings',
      'Featured placement',
      'Dedicated support',
    ],
  },
};
