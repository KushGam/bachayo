import { SymbolView } from 'expo-symbols';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { track } from '@/lib/analytics';
import { formatNprPaisa } from '@/lib/helpers';
import { fetchOrderByQrCode, markOrderPickedUp } from '@/lib/orders';
import { supabase } from '@/lib/supabase';
import type { PartnerOrderWithCustomer } from '@/types/app';

export default function PartnerScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedOrder, setScannedOrder] = useState<PartnerOrderWithCustomer | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scanLock = useRef(false);
  const flashOpacity = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const triggerErrorFlash = () => {
    flashOpacity.value = withSequence(
      withTiming(0.55, { duration: 120 }),
      withTiming(0, { duration: 280 }),
    );
  };

  const loadPartner = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return null;

    const { data } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    setPartnerId(data?.id ?? null);
    return data?.id ?? null;
  }, []);

  useEffect(() => {
    loadPartner();
  }, [loadPartner]);

  const handleBarcode = async (data: string) => {
    if (scanLock.current || loading) return;
    scanLock.current = true;
    setErrorText(null);

    const pid = partnerId ?? (await loadPartner());
    if (!pid) {
      setErrorText('Partner profile not found');
      triggerErrorFlash();
      scanLock.current = false;
      return;
    }

    const order = await fetchOrderByQrCode(data);
    if (!order) {
      setErrorText('Invalid QR code');
      setScannedOrder(null);
      triggerErrorFlash();
      setTimeout(() => {
        scanLock.current = false;
      }, 1500);
      return;
    }

    if (order.partner_id !== pid) {
      setErrorText('This order belongs to another partner');
      setScannedOrder(null);
      triggerErrorFlash();
      setTimeout(() => {
        scanLock.current = false;
      }, 1500);
      return;
    }

    if (order.status === 'picked_up') {
      setErrorText('Order already picked up');
      setScannedOrder(order);
      triggerErrorFlash();
      setTimeout(() => {
        scanLock.current = false;
      }, 1500);
      return;
    }

    setScannedOrder(order);
    scanLock.current = false;
  };

  const confirmPickup = async () => {
    if (!scannedOrder) return;
    setLoading(true);
    const { error } = await markOrderPickedUp(scannedOrder.id);
    setLoading(false);

    if (error) {
      setErrorText(error.message);
      triggerErrorFlash();
      return;
    }

    track('pickup_completed', { order_id: scannedOrder.id, partner_id: scannedOrder.partner_id });

    router.back();
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera access is required to scan pickup QR codes.</Text>
        <Pressable onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => handleBarcode(data)}
      />

      <Animated.View pointerEvents="none" style={[styles.errorFlash, flashStyle]} />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={Palette.white}
          />
        </Pressable>
        <Text style={styles.topTitle}>Scan pickup QR</Text>
      </View>

      <View style={styles.frame} />

      {errorText ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorText}</Text>
        </View>
      ) : null}

      {scannedOrder ? (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Order found</Text>
          <Text style={styles.confirmLine}>
            {scannedOrder.customer.full_name || scannedOrder.customer.phone || 'Customer'}
          </Text>
          <Text style={styles.confirmLine}>
            {scannedOrder.bag.title} • Qty {scannedOrder.quantity}
          </Text>
          <Text style={styles.confirmPrice}>{formatNprPaisa(scannedOrder.total_price)}</Text>
          <Pressable
            onPress={confirmPickup}
            disabled={loading || scannedOrder.status === 'picked_up'}
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && { opacity: 0.9 },
              (loading || scannedOrder.status === 'picked_up') && { opacity: 0.6 },
            ]}>
            <Text style={styles.confirmBtnText}>
              {scannedOrder.status === 'picked_up'
                ? 'Already picked up'
                : loading
                  ? 'Updating…'
                  : 'Mark as picked up'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.hintCard}>
          <Text style={styles.hintText}>Align the customer&apos;s QR code inside the frame</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  errorFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#DC2626',
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: Palette.white,
    fontSize: 18,
    fontWeight: '800',
  },
  frame: {
    position: 'absolute',
    top: '28%',
    left: '12%',
    right: '12%',
    height: '32%',
    borderWidth: 2,
    borderColor: Palette.primary,
    borderRadius: 18,
  },
  errorBanner: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 12,
  },
  errorBannerText: {
    color: Palette.white,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.textPrimary,
    marginBottom: 4,
  },
  confirmLine: {
    color: Palette.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  confirmPrice: {
    color: Palette.primary,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 4,
    marginBottom: 8,
  },
  confirmBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: Palette.white,
    fontWeight: '900',
    fontSize: 15,
  },
  hintCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    padding: 14,
  },
  hintText: {
    color: Palette.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  message: {
    color: Palette.textMuted,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: Palette.white,
    fontWeight: '800',
  },
});
