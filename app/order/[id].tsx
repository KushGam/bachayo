import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Palette } from '@/constants/Colors';
import { formatNprPaisa, getPickupCountdownLabel } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import type { CustomerOrderWithDetails } from '@/types/app';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<CustomerOrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from('orders')
        .select('*, partner:partners(*), bag:rescue_bags(*)')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setOrder(data as unknown as CustomerOrderWithDetails);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading order…</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Order not found</Text>
        <Pressable onPress={() => router.back()} style={styles.btn}>
          <Text style={styles.btnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          size={20}
          tintColor={Palette.textPrimary}
        />
      </Pressable>

      <Text style={styles.title}>{order.partner.name}</Text>
      <Text style={styles.subtitle}>{order.bag.title}</Text>
      <Text style={styles.countdown}>
        {getPickupCountdownLabel(order.bag.available_date, order.bag.pickup_end)}
      </Text>
      <Text style={styles.meta}>
        {order.bag.pickup_start.slice(0, 5)} – {order.bag.pickup_end.slice(0, 5)} •{' '}
        {formatNprPaisa(order.total_price)}
      </Text>

      <View style={styles.qrWrap}>
        <QRCode value={order.qr_code} size={200} />
      </View>
      <Text style={styles.qrHint}>Show this QR at pickup</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    padding: 20,
    paddingTop: 56,
  },
  center: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Palette.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: Palette.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  countdown: {
    fontSize: 14,
    color: Palette.amber,
    fontWeight: '800',
    marginTop: 10,
  },
  meta: {
    fontSize: 14,
    color: Palette.textMuted,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 20,
  },
  qrWrap: {
    alignSelf: 'center',
    padding: 16,
    backgroundColor: Palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
  },
  qrHint: {
    textAlign: 'center',
    marginTop: 12,
    color: Palette.textMuted,
    fontWeight: '600',
  },
  muted: {
    color: Palette.textMuted,
    fontWeight: '600',
  },
  btn: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: {
    color: Palette.white,
    fontWeight: '800',
  },
});
