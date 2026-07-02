import { AppSymbol } from '@/components/ui/AppSymbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { OrderShortCode } from '@/components/customer/OrderShortCode';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import {
  formatNprPaisa,
  formatTodayPickupWindow,
  openMapsDirections,
  openPhoneDialer,
  openWhatsAppShare,
} from '@/lib/helpers';
import { supabase } from '@/lib/supabase';

type ConfirmedOrder = {
  id: string;
  qr_code: string;
  total_price: number;
  customer_name: string | null;
  customer_phone: string | null;
  partner: {
    name: string;
    address: string | null;
    phone: string | null;
    latitude: number;
    longitude: number;
  };
  bag: {
    title: string;
    pickup_start: string;
    pickup_end: string;
  };
};

export default function OrderConfirmedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [order, setOrder] = useState<ConfirmedOrder | null>(null);

  const scale = useSharedValue(0.5);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 300, mass: 0.8 });
  }, [scale]);

  useEffect(() => {
    void (async () => {
      if (!orderId) return;
      const { data } = await supabase
        .from('orders')
        .select(
          'id, qr_code, total_price, customer_name, customer_phone, partner:partners(name, address, phone, latitude, longitude), bag:rescue_bags(title, pickup_start, pickup_end)',
        )
        .eq('id', orderId)
        .maybeSingle();

      if (data) setOrder(data as unknown as ConfirmedOrder);
    })();
  }, [orderId]);

  const pickupWindow = order
    ? formatTodayPickupWindow(order.bag.pickup_start, order.bag.pickup_end)
    : '';

  const shareWhatsApp = () => {
    if (!order) return;
    const start = order.bag.pickup_start.slice(0, 5);
    const end = order.bag.pickup_end.slice(0, 5);
    openWhatsAppShare(
      `I reserved a rescue bag at ${order.partner.name} on Bachayo! Picking up ${start}–${end} today 🛍`,
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.hero, { paddingTop: insets.top + Spacing.xl }]}>
        <Animated.View style={[styles.checkWrap, animStyle]}>
          <View style={styles.checkCircle}>
            <AppSymbol ios="checkmark" android="check" size={32} color={Palette.primary} />
          </View>
        </Animated.View>
        <Text style={styles.heroTitle}>Reservation confirmed! 🎉</Text>
        <Text style={styles.heroSubtitle}>
          {order ? `${order.bag.title} at ${order.partner.name}` : 'Loading your reservation…'}
        </Text>
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Show this at pickup</Text>
          <View style={styles.qrWrap}>
            {order?.qr_code ? (
              <QRCode value={order.qr_code} size={200} color={Palette.primary} backgroundColor={Palette.white} />
            ) : (
              <Text style={styles.qrLoading}>Loading QR…</Text>
            )}
          </View>
          {order?.qr_code ? <OrderShortCode qrCode={order.qr_code} /> : null}
          {order ? (
            <Text style={styles.orderNumber}>#{order.id.replace(/-/g, '').slice(0, 8).toUpperCase()}</Text>
          ) : null}
        </View>

        <View style={styles.detailsCard}>
          <DetailRow emoji="📍" text={order?.partner.address ?? 'Address not available'} />
          <DetailRow emoji="🕐" text={pickupWindow || '—'} />
          <View style={styles.paymentRow}>
            <DetailRow
              emoji="💵"
              text={order ? `Pay ${formatNprPaisa(order.total_price)} at the counter` : '—'}
            />
            <Text style={styles.paymentNote}>
              Cash, eSewa, Khalti — whatever your restaurant accepts
            </Text>
          </View>
          {order?.partner.phone ? (
            <Pressable onPress={() => openPhoneDialer(order.partner.phone!)}>
              <DetailRow emoji="📞" text={order.partner.phone} accent />
            </Pressable>
          ) : null}
        </View>

        {order?.customer_name || order?.customer_phone ? (
          <View style={styles.customerMeta}>
            {order.customer_name ? (
              <Text style={styles.customerMetaText}>Reserved for: {order.customer_name}</Text>
            ) : null}
            {order.customer_phone ? (
              <Text style={styles.customerMetaText}>Contact: {order.customer_phone}</Text>
            ) : null}
          </View>
        ) : null}

        <Button
          label="Get directions"
          variant="secondary"
          onPress={() => {
            if (!order) return;
            openMapsDirections(order.partner.latitude, order.partner.longitude, order.partner.name);
          }}
          style={styles.actionBtn}
        />

        <Pressable onPress={shareWhatsApp} style={styles.whatsappBtn}>
          <Text style={styles.whatsappText}>Share via WhatsApp</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(tabs)/customer/home')} style={styles.homeLink}>
          <Text style={styles.homeLinkText}>Back to home</Text>
        </Pressable>

        <Text style={styles.footerNote}>
          Free cancellation until 1 hour before pickup · Cancel in My Bags
        </Text>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  emoji,
  text,
  accent,
}: {
  emoji: string;
  text: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailEmoji}>{emoji}</Text>
      <Text style={[styles.detailText, accent && styles.detailTextAccent]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.primary,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  checkWrap: {
    marginBottom: Spacing.md,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.white,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: Palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'center',
  },
  qrSection: {
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  qrTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  qrWrap: {
    padding: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: Border.width,
    borderColor: Palette.borderSubtle,
  },
  qrLoading: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
    width: 200,
    textAlign: 'center',
  },
  orderNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: Palette.textSecondary,
    letterSpacing: 1,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: Palette.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  detailEmoji: {
    fontSize: 16,
    marginTop: 1,
  },
  detailText: {
    flex: 1,
    ...Type.bodyMedium,
    color: Palette.textPrimary,
    lineHeight: 22,
  },
  detailTextAccent: {
    color: Palette.primary,
    fontWeight: '600',
  },
  paymentRow: {
    gap: 4,
  },
  paymentNote: {
    fontSize: 12,
    color: Palette.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  customerMeta: {
    width: '100%',
    gap: 4,
  },
  customerMetaText: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  actionBtn: {
    alignSelf: 'stretch',
    borderColor: Palette.primary,
  },
  whatsappBtn: {
    paddingVertical: Spacing.sm,
  },
  whatsappText: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: '#25D366',
    textAlign: 'center',
  },
  homeLink: {
    paddingVertical: Spacing.xs,
  },
  homeLinkText: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  footerNote: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
