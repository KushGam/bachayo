import { AppSymbol } from '@/components/ui/AppSymbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { Palette } from '@/constants/Colors';
import { FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
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
        <StatusBar style="dark" />
        <ListSkeleton count={1} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.muted}>Order not found</Text>
        <Button label="Go back" onPress={() => router.back()} fullWidth={false} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <AppSymbol ios="chevron.left" android="arrow-back" size={20} color={Palette.textPrimary} />
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
        <QRCode value={order.qr_code} size={200} color={Palette.primary} />
      </View>
      <Text style={styles.qrHint}>Show this QR at pickup</Text>
      <Text style={styles.payNote}>Pay at pickup · {formatNprPaisa(order.total_price)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    padding: Spacing.lg,
    paddingTop: 56,
  },
  center: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...FloatingShadow,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  countdown: {
    ...Type.bodyMedium,
    color: Palette.urgency,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },
  meta: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  qrWrap: {
    alignSelf: 'center',
    padding: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: 20,
    ...FloatingShadow,
  },
  qrHint: {
    textAlign: 'center',
    marginTop: Spacing.md,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  payNote: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Palette.primary,
    fontWeight: '600',
  },
  muted: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
  },
});
