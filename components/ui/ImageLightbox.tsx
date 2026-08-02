import { StatusBar } from 'expo-status-bar';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppImage } from '@/components/ui/AppImage';
import { AppSymbol } from '@/components/ui/AppSymbol';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type ImageLightboxProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  title?: string;
};

export function ImageLightbox({ visible, uri, onClose, title }: ImageLightboxProps) {
  const insets = useSafeAreaInsets();

  const close = () => {
    void hapticButtonPress();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}>
      <StatusBar style="light" />
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          onPress={close}
          style={[styles.closeBtn, { top: Math.max(insets.top, Spacing.md) }]}>
          <AppSymbol ios="xmark" android="close" size={20} color={Palette.white} />
        </Pressable>

        {title ? (
          <Text style={[styles.title, { top: Math.max(insets.top, Spacing.md) + 8 }]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}

        <Pressable style={styles.imageWrap} onPress={close}>
          {uri ? (
            <AppImage
              source={{ uri }}
              style={styles.image}
              contentFit="contain"
              priority="high"
              transition={120}
            />
          ) : null}
        </Pressable>

        <Text style={[styles.hint, { bottom: Math.max(insets.bottom, Spacing.lg) }]}>
          Tap to close
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    position: 'absolute',
    left: Spacing.lg,
    right: 64,
    zIndex: 2,
    color: Palette.white,
    ...Type.bodyMedium,
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.55)',
    ...Type.caption,
  },
});
