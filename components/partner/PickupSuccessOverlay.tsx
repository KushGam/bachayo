import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ConfettiBurst } from '@/components/partner/ConfettiBurst';

const GREEN = '#10B981';

type PickupSuccessOverlayProps = {
  visible: boolean;
  customerName: string;
  onDone: () => void;
};

export function PickupSuccessOverlay({ visible, customerName, onDone }: PickupSuccessOverlayProps) {
  const overlayOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      overlayOpacity.value = 0;
      checkScale.value = 0;
      return;
    }

    overlayOpacity.value = withTiming(1, { duration: 300 });
    checkScale.value = withSpring(1, { damping: 12, stiffness: 280 });

    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [visible, onDone, overlayOpacity, checkScale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <ConfettiBurst active />
        <Animated.View style={[styles.checkCircle, checkStyle]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>
        <Text style={styles.title}>Pickup confirmed!</Text>
        <Text style={styles.subtitle}>Order handed over successfully</Text>
        <Text style={styles.customerName}>{customerName}</Text>
        <Pressable onPress={onDone} style={styles.nextBtn}>
          <Text style={styles.nextBtnText}>Scan next customer</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 48,
    fontWeight: '700',
    color: GREEN,
  },
  title: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  customerName: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  nextBtn: {
    marginTop: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
