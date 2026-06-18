import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

import { Palette } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

export default function OrderConfirmedScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  const [qr, setQr] = useState<string | null>(null);
  const [pickup, setPickup] = useState<{
    address: string | null;
    pickup_start: string;
    pickup_end: string;
    partner_name: string;
  } | null>(null);

  const scale = useSharedValue(0.6);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 140 });
  }, [scale]);

  useEffect(() => {
    (async () => {
      if (!orderId) return;
      const { data, error } = await supabase
        .from('orders')
        .select('qr_code, partner:partners(name, address), bag:rescue_bags(pickup_start, pickup_end)')
        .eq('id', orderId)
        .maybeSingle();

      if (error || !data) return;
      setQr((data as any).qr_code ?? null);
      setPickup({
        address: (data as any).partner?.address ?? null,
        partner_name: (data as any).partner?.name ?? 'Partner',
        pickup_start: (data as any).bag?.pickup_start?.slice(0, 5) ?? '--:--',
        pickup_end: (data as any).bag?.pickup_end?.slice(0, 5) ?? '--:--',
      });
    })();
  }, [orderId]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.checkWrap, animStyle]}>
        <View style={styles.checkCircle}>
          <SymbolView
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={34}
            tintColor={Palette.white}
          />
        </View>
      </Animated.View>

      <Text style={styles.title}>Reservation confirmed</Text>
      <Text style={styles.subtitle}>Show this QR at pickup</Text>

      <View style={styles.qrCard}>
        {qr ? <QRCode value={qr} size={220} /> : <Text style={styles.qrLoading}>Loading QR…</Text>}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Pickup instructions</Text>
        <Text style={styles.instructionsText}>
          {pickup?.partner_name ?? 'Partner'} • {pickup?.pickup_start ?? '--:--'} –{' '}
          {pickup?.pickup_end ?? '--:--'}
        </Text>
        <Text style={styles.instructionsText}>{pickup?.address ?? 'Address not available'}</Text>
      </View>

      <Pressable
        onPress={() => {}}
        style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}>
        <Text style={styles.secondaryBtnText}>Add to calendar</Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace('/(tabs)/my-bags')}
        style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}>
        <Text style={styles.primaryBtnText}>View my bags</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrap: {
    marginBottom: 16,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Palette.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: Palette.textMuted,
    fontSize: 14.5,
    fontWeight: '600',
    marginBottom: 16,
  },
  qrCard: {
    backgroundColor: Palette.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 18,
    marginBottom: 18,
  },
  qrLoading: {
    color: Palette.textMuted,
    fontWeight: '700',
  },
  instructions: {
    width: '100%',
    backgroundColor: Palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    padding: 14,
    gap: 6,
    marginBottom: 14,
  },
  instructionsTitle: {
    color: Palette.textPrimary,
    fontWeight: '900',
  },
  instructionsText: {
    color: Palette.textMuted,
    fontWeight: '600',
    lineHeight: 20,
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: Palette.white,
    borderWidth: 1.5,
    borderColor: Palette.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryBtnText: {
    color: Palette.primary,
    fontWeight: '900',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Palette.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Palette.white,
    fontWeight: '900',
    fontSize: 16,
  },
});

