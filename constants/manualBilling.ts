/** Manual partner billing — partners pay via eSewa/Khalti/bank; admin marks paid. */
export const MANUAL_BILLING = {
  esewaId: '9762623241',
  khaltiId: '9762623241',
  whatsappPhone: '9779762623241',
  supportEmail: 'lastbagnp@gmail.com',
  bank: {
    name: 'NIC Asia Bank',
    accountName: 'Kushal Gautam',
    /** Replace with the real account number before publish. */
    accountNumber: 'XXXXXXXXXXXXXXXX',
    branch: 'Thamel, Kathmandu',
  },
} as const;

export const PLAN_FEATURES: Record<
  'small' | 'medium' | 'large',
  { title: string; features: string[]; popular?: boolean }
> = {
  small: {
    title: 'Small Plan',
    features: [
      'Up to 5 bags per day',
      'Basic order management',
      'Customer QR pickup',
      'Email support',
    ],
  },
  medium: {
    title: 'Medium Plan',
    popular: true,
    features: [
      'Unlimited bags per day',
      'Full order management',
      'Customer QR pickup',
      'Sales analytics',
      'Priority support',
    ],
  },
  large: {
    title: 'Large Plan',
    features: [
      'Everything in Medium',
      'Multi-branch support',
      'Featured placement',
      'Dedicated support',
      'Impact reports',
    ],
  },
};
