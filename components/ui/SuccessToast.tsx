import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SuccessToastProps = {
  visible: boolean;
  title: string;
  message?: string;
  durationMs?: number;
  onHide: () => void;
};

export function SuccessToast({
  visible,
  title,
  message,
  durationMs = 3000,
  onHide,
}: SuccessToastProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onHide, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutUp.duration(180)}
      style={[styles.toast, { top: insets.top + 8 }]}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    lineHeight: 18,
  },
});
