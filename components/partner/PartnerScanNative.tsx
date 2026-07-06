import { SymbolView } from 'expo-symbols';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ManualQREntry } from '@/components/partner/ManualQREntry';
import { PickupOrderSheet } from '@/components/partner/PickupOrderSheet';
import { PickupSuccessOverlay } from '@/components/partner/PickupSuccessOverlay';
import { Palette } from '@/constants/Colors';
import { usePartnerPickupFlow } from '@/hooks/usePartnerPickupFlow';
import { hapticButtonPress, hapticError, hapticHeavy } from '@/lib/haptics';
import { lookupOrderByPartnerCode } from '@/lib/orders';
import { supabase } from '@/lib/supabase';

const TERRACOTTA = '#D85A30';

function ScanCorner({ style }: { style: object }) {
  return <View style={[styles.corner, style]} />;
}

export default function PartnerScanNative() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | undefined>();
  const [errorText, setErrorText] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const scanLock = useRef(false);
  const pickupMethodRef = useRef<'partner_qr' | 'partner_manual'>('partner_qr');
  const pickup = usePartnerPickupFlow(partnerName);

  const scanLineY = useSharedValue(-80);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(80, { duration: 2000, easing: Easing.linear }),
      -1,
      true,
    );
  }, [scanLineY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const triggerErrorFlash = () => {
    void hapticError();
    flashOpacity.value = withSequence(
      withTiming(0.55, { duration: 100 }),
      withTiming(0, { duration: 200 }),
    );
  };

  const loadPartner = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return null;

    const { data } = await supabase
      .from('partners')
      .select('id, name')
      .eq('user_id', userId)
      .maybeSingle();

    setPartnerId(data?.id ?? null);
    setPartnerName(data?.name ?? undefined);
    return data?.id ?? null;
  }, []);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  const handleBarcode = async (data: string) => {
    if (scanLock.current || pickup.sheetVisible || pickup.successVisible) return;
    scanLock.current = true;
    setErrorText(null);

    const pid = partnerId ?? (await loadPartner());
    if (!pid) {
      setErrorText('Partner profile not found');
      triggerErrorFlash();
      scanLock.current = false;
      return;
    }

    try {
      const order = await lookupOrderByPartnerCode(data, pid);

      if (!order) {
        setErrorText('Invalid QR — try again');
        triggerErrorFlash();
        setTimeout(() => {
          scanLock.current = false;
        }, 1500);
        return;
      }

      if (order.status === 'picked_up') {
        setErrorText('Order already picked up');
        triggerErrorFlash();
        setTimeout(() => {
          scanLock.current = false;
        }, 1500);
        return;
      }

      void hapticHeavy();
      pickupMethodRef.current = 'partner_qr';
      pickup.openOrder(order);
      scanLock.current = false;
    } catch {
      setErrorText('Could not read QR — try again');
      triggerErrorFlash();
      scanLock.current = false;
    }
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
        <Pressable
          onPress={() => setShowManualEntry(true)}
          style={[styles.permissionBtn, styles.manualFallbackBtn]}>
          <Text style={styles.permissionBtnText}>Enter code instead</Text>
        </Pressable>
        {showManualEntry ? (
          <View style={styles.manualOverlay}>
            <ManualQREntry
              onOrderFound={(order) => {
                pickupMethodRef.current = 'partner_manual';
                setShowManualEntry(false);
                pickup.openOrder(order);
              }}
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!showManualEntry ? (
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => void handleBarcode(data)}
        />
      ) : (
        <View style={[styles.manualPanel, { paddingTop: insets.top + 56 }]}>
          <ManualQREntry
            onOrderFound={(order) => {
              pickupMethodRef.current = 'partner_manual';
              setShowManualEntry(false);
              pickup.openOrder(order);
            }}
          />
        </View>
      )}

      <Animated.View pointerEvents="none" style={[styles.errorFlash, flashStyle]} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            void hapticButtonPress();
            router.back();
          }}
          style={styles.iconBtn}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={Palette.white}
          />
        </Pressable>
        <Text style={styles.topTitle}>Scan QR</Text>
        <Pressable onPress={() => setTorchOn((v) => !v)} style={styles.iconBtn}>
          <SymbolView
            name={{ ios: torchOn ? 'bolt.fill' : 'bolt.slash.fill', android: 'flash_on', web: 'flash_on' }}
            size={18}
            tintColor={Palette.white}
          />
        </Pressable>
      </View>

      <View style={styles.frame}>
        <ScanCorner style={[styles.cornerTL, styles.cornerPiece]} />
        <ScanCorner style={[styles.cornerTR, styles.cornerPiece]} />
        <ScanCorner style={[styles.cornerBL, styles.cornerPiece]} />
        <ScanCorner style={[styles.cornerBR, styles.cornerPiece]} />
        <Animated.View style={[styles.scanLine, scanLineStyle]} />
      </View>

      <Text style={styles.hintText}>
        {showManualEntry ? 'Enter the 6-digit code from the customer' : "Point camera at customer's QR code"}
      </Text>

      <Pressable
        onPress={() => {
          void hapticButtonPress();
          setShowManualEntry((current) => !current);
          setErrorText(null);
          scanLock.current = false;
        }}
        style={[styles.manualToggle, { bottom: insets.bottom + 24 }]}>
        <Text style={styles.manualToggleText}>
          {showManualEntry ? 'Use camera instead' : 'Enter code instead'}
        </Text>
      </Pressable>

      {errorText ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorText}</Text>
        </View>
      ) : null}

      <PickupOrderSheet
        visible={pickup.sheetVisible}
        order={pickup.foundOrder}
        confirming={pickup.confirming}
        onConfirm={() => void pickup.confirmPickup(pickupMethodRef.current)}
        onDismiss={() => {
          pickup.dismissSheet();
          scanLock.current = false;
        }}
      />

      <PickupSuccessOverlay
        visible={pickup.successVisible}
        customerName={pickup.successCustomerName}
        onDone={() => {
          pickup.dismissSuccess();
          scanLock.current = false;
        }}
      />
    </View>
  );
}

const CORNER = 28;
const BORDER = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  errorFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Palette.primaryDark,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    color: Palette.white,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  frame: {
    position: 'absolute',
    top: '28%',
    left: '12%',
    right: '12%',
    height: '32%',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: TERRACOTTA,
  },
  cornerPiece: {
    borderWidth: 0,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: BORDER,
    borderLeftWidth: BORDER,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: BORDER,
    borderRightWidth: BORDER,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BORDER,
    borderLeftWidth: BORDER,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BORDER,
    borderRightWidth: BORDER,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: TERRACOTTA,
    opacity: 0.6,
    top: '50%',
  },
  hintText: {
    position: 'absolute',
    top: '62%',
    left: 24,
    right: 24,
    color: Palette.white,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  errorBanner: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: Palette.primaryDark,
    borderRadius: 12,
    padding: 12,
  },
  errorBannerText: {
    color: Palette.white,
    fontWeight: '800',
    textAlign: 'center',
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
  manualFallbackBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  manualPanel: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  manualOverlay: {
    marginTop: 16,
    width: '100%',
    maxWidth: 360,
  },
  manualToggle: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  manualToggleText: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
