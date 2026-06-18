import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Palette } from '@/constants/Colors';
import type { PaymentGateway } from '@/constants/payments';
import { track } from '@/lib/analytics';
import { formatNprPaisa } from '@/lib/helpers';
import { parsePaymentCallbackUrl, startGatewayPayment } from '@/lib/payments';
import { supabase } from '@/lib/supabase';

type PayMethod = 'esewa' | 'khalti' | 'cash';

export default function CheckoutScreen() {
  const router = useRouter();
  const { bagId, qty } = useLocalSearchParams<{
    orderId: string;
    bagId?: string;
    qty?: string;
  }>();

  const quantity = Math.max(1, Math.min(3, Number(qty || 1) || 1));
  const [method, setMethod] = useState<PayMethod>('esewa');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [bag, setBag] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!bagId) return;
      const { data } = await supabase
        .from('rescue_bags')
        .select('*, partner:partners(*)')
        .eq('id', bagId)
        .maybeSingle();
      if (data) setBag(data);
    })();
  }, [bagId]);

  const total = useMemo(() => {
    const price = bag?.rescue_price ?? 0;
    return price * quantity;
  }, [bag, quantity]);

  const confirmPay = async () => {
    setErrorText(null);
    setLoading(true);

    try {
      if (!bagId) throw new Error('Missing bagId');
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error('Please sign in first');

      const { data: bagData, error: bagError } = await supabase
        .from('rescue_bags')
        .select('id, partner_id, rescue_price')
        .eq('id', bagId)
        .single();
      if (bagError) throw bagError;

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_id: userId,
          bag_id: bagData.id,
          partner_id: bagData.partner_id,
          quantity,
          total_price: bagData.rescue_price * quantity,
          status: 'pending',
          payment_method: method,
        })
        .select('id, qr_code')
        .single();

      if (error) throw error;

      track('bag_reserved', {
        order_id: order.id,
        bag_id: bagData.id,
        payment_method: method,
        quantity,
      });

      if (method === 'cash') {
        router.replace(`/order/confirmed?orderId=${order.id}`);
        return;
      }

      const { browserResult } = await startGatewayPayment(
        method as PaymentGateway,
        order.id,
        bagData.rescue_price * quantity,
      );

      if (browserResult.type === 'success' && browserResult.url) {
        const parsed = parsePaymentCallbackUrl(browserResult.url);
        if (parsed) {
          router.replace({
            pathname: '/payment/callback',
            params: {
              gateway: parsed.gateway,
              orderId: parsed.orderId,
              status: parsed.status,
              data: parsed.data,
              transaction_uuid: parsed.transactionUuid,
              pidx: parsed.pidx,
              transaction_id: parsed.transactionId,
            },
          });
        }
        return;
      }

      if (browserResult.type === 'cancel') {
        setErrorText('Payment was cancelled. Your order is saved as pending.');
      }
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={Palette.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order summary</Text>
        <Text style={styles.summaryLine}>
          Quantity: <Text style={styles.summaryStrong}>{quantity}</Text>
        </Text>
        <Text style={styles.summaryLine}>
          Total: <Text style={styles.summaryStrong}>{formatNprPaisa(total)}</Text>
        </Text>
        {bag?.partner?.name ? (
          <Text style={styles.summaryLine}>
            Partner: <Text style={styles.summaryStrong}>{bag.partner.name}</Text>
          </Text>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Payment method</Text>
      <View style={styles.methods}>
        <PaymentRow label="eSewa" selected={method === 'esewa'} onPress={() => setMethod('esewa')} />
        <PaymentRow label="Khalti" selected={method === 'khalti'} onPress={() => setMethod('khalti')} />
        <PaymentRow
          label="Cash on pickup"
          selected={method === 'cash'}
          onPress={() => setMethod('cash')}
        />
      </View>

      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <Pressable
        onPress={confirmPay}
        disabled={loading}
        style={({ pressed }) => [
          styles.payBtn,
          pressed && { opacity: 0.9 },
          loading && { opacity: 0.6 },
        ]}>
        <Text style={styles.payBtnText}>{loading ? 'Processing…' : 'Confirm & Pay'}</Text>
      </Pressable>
    </View>
  );
}

function PaymentRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.methodRow, selected && styles.methodRowActive]}>
      <View style={styles.radioOuter}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={styles.methodLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Palette.textPrimary,
  },
  summary: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.textPrimary,
    marginBottom: 6,
  },
  summaryLine: {
    color: Palette.textMuted,
    fontWeight: '600',
  },
  summaryStrong: {
    color: Palette.textPrimary,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Palette.textPrimary,
    marginBottom: 10,
  },
  methods: {
    gap: 10,
    marginBottom: 16,
  },
  methodRow: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodRowActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.lightGreenBg,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.primary,
  },
  methodLabel: {
    color: Palette.textPrimary,
    fontWeight: '800',
  },
  payBtn: {
    marginTop: 6,
    backgroundColor: Palette.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payBtnText: {
    color: Palette.white,
    fontWeight: '900',
    fontSize: 16,
  },
  error: {
    color: '#DC2626',
    fontWeight: '700',
    marginBottom: 10,
  },
});
