// Payment processing removed for v1 launch.
// Cash on pickup model. Re-enable for v2.

/*
import * as WebBrowser from 'expo-web-browser';

import { paymentConfig, type PaymentGateway, type PaymentVerifyParams, type PaymentVerifyResponse } from '@/constants/payments';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export async function initiatePayment(
  gateway: PaymentGateway,
  orderId: string,
  amountPaisa: number,
) {
  const { data, error } = await supabase.functions.invoke('payment-initiate', {
    body: { gateway, orderId, amountPaisa },
  });

  if (error) {
    throw new Error(error.message || 'Failed to initiate payment');
  }

  if (!data?.paymentUrl) {
    throw new Error('Payment URL missing from server response');
  }

  return data as {
    gateway: PaymentGateway;
    orderId: string;
    paymentUrl: string;
    transactionRef: string;
  };
}

export async function openPaymentBrowser(paymentUrl: string) {
  const result = await WebBrowser.openAuthSessionAsync(
    paymentUrl,
    paymentConfig.paymentCallbackUrl,
  );

  return result;
}

export async function startGatewayPayment(
  gateway: PaymentGateway,
  orderId: string,
  amountPaisa: number,
) {
  const session = await initiatePayment(gateway, orderId, amountPaisa);
  const browserResult = await openPaymentBrowser(session.paymentUrl);

  return {
    session,
    browserResult,
  };
}

export async function verifyPayment(
  params: PaymentVerifyParams,
): Promise<PaymentVerifyResponse> {
  const { data, error } = await supabase.functions.invoke('payment-verify', {
    body: params,
  });

  if (error) {
    throw new Error(error.message || 'Payment verification failed');
  }

  return data as PaymentVerifyResponse;
}

export function parsePaymentCallbackUrl(url: string): PaymentVerifyParams | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'lastbag:') return null;

    const gateway = (parsed.searchParams.get('gateway') ?? 'esewa') as PaymentGateway;
    const orderId = parsed.searchParams.get('orderId') ?? '';
    const statusParam = parsed.searchParams.get('status');
    const data = parsed.searchParams.get('data') ?? undefined;
    const transactionUuid =
      parsed.searchParams.get('transaction_uuid') ??
      parsed.searchParams.get('transactionUuid') ??
      undefined;
    const pidx = parsed.searchParams.get('pidx') ?? undefined;
    const transactionId = parsed.searchParams.get('transaction_id') ?? undefined;

    let status: 'success' | 'failure' = 'failure';
    if (statusParam === 'success' || parsed.pathname.includes('success')) {
      status = 'success';
    } else if (data) {
      status = 'success';
    } else if (statusParam === 'failure' || parsed.pathname.includes('failure')) {
      status = 'failure';
    }

    if (!orderId) return null;

    return {
      gateway,
      orderId,
      status,
      data,
      transactionUuid,
      pidx,
      transactionId,
    };
  } catch {
    return null;
  }
}
*/

export {};
