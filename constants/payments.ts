// Payment processing removed for v1 launch.
// Cash on pickup model. Re-enable for v2.

/*
export const paymentConfig = {
  esewaMerchantCode: process.env.EXPO_PUBLIC_ESEWA_MERCHANT_CODE ?? 'EPAYTEST',
  khaltiPublicKey: process.env.EXPO_PUBLIC_KHALTI_PUBLIC_KEY ?? '',
  paymentCallbackUrl: 'bachayo://payment/callback',
} as const;

export type PaymentGateway = 'esewa' | 'khalti';

export type PaymentInitiateResponse = {
  gateway: PaymentGateway;
  orderId: string;
  paymentUrl: string;
  transactionRef: string;
};

export type PaymentVerifyParams = {
  gateway: PaymentGateway;
  orderId: string;
  status: 'success' | 'failure';
  transactionUuid?: string;
  data?: string;
  pidx?: string;
  transactionId?: string;
};

export type PaymentVerifyResponse = {
  verified: boolean;
  orderId: string;
  message?: string;
};
*/

export {};
