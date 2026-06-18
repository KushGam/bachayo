import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import type { PaymentGateway } from '@/constants/payments';
import { parsePaymentCallbackUrl, verifyPayment } from '@/lib/payments';

export default function PaymentCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    gateway?: string;
    orderId?: string;
    status?: string;
    data?: string;
    transaction_uuid?: string;
    pidx?: string;
    transaction_id?: string;
  }>();

  const [message, setMessage] = useState('Verifying payment…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const url = Linking.createURL('payment/callback', {
          queryParams: {
            gateway: params.gateway,
            orderId: params.orderId,
            status: params.status,
            data: params.data,
            transaction_uuid: params.transaction_uuid,
            pidx: params.pidx,
            transaction_id: params.transaction_id,
          },
        });

        const parsed =
          parsePaymentCallbackUrl(url) ??
          (params.orderId
            ? {
                gateway: (params.gateway ?? 'esewa') as PaymentGateway,
                orderId: String(params.orderId),
                status: (params.status === 'success' || params.data ? 'success' : 'failure') as
                  | 'success'
                  | 'failure',
                data: params.data ? String(params.data) : undefined,
                transactionUuid: params.transaction_uuid
                  ? String(params.transaction_uuid)
                  : undefined,
                pidx: params.pidx ? String(params.pidx) : undefined,
                transactionId: params.transaction_id
                  ? String(params.transaction_id)
                  : undefined,
              }
            : null);

        if (!parsed) {
          setFailed(true);
          setMessage('Invalid payment callback.');
          return;
        }

        if (parsed.status === 'failure') {
          setFailed(true);
          setMessage('Payment was cancelled or failed.');
          return;
        }

        const result = await verifyPayment(parsed);
        if (!result.verified) {
          setFailed(true);
          setMessage(result.message ?? 'Payment could not be verified.');
          return;
        }

        router.replace(`/order/confirmed?orderId=${result.orderId}`);
      } catch (error) {
        setFailed(true);
        setMessage(error instanceof Error ? error.message : 'Verification failed.');
      }
    })();
  }, [params, router]);

  return (
    <View style={styles.container}>
      {!failed ? <ActivityIndicator size="large" color={Palette.primary} /> : null}
      <Text style={[styles.message, failed && styles.error]}>{message}</Text>
      {failed ? (
        <Pressable onPress={() => router.replace('/(tabs)/my-bags')} style={styles.btn}>
          <Text style={styles.btnText}>Go to My Bags</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  message: {
    color: Palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    color: '#DC2626',
  },
  btn: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: {
    color: Palette.white,
    fontWeight: '800',
  },
});
