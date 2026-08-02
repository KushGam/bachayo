import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import { isExpoGo } from '@/lib/expoGo';
import { promptOpenStoreInMaps } from '@/lib/helpers';
import { hapticButtonPress } from '@/lib/haptics';

type BagLocationMapProps = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  label: string;
  address?: string | null;
};

function MapsFallback({
  latitude,
  longitude,
  label,
  message,
}: {
  latitude: number;
  longitude: number;
  label: string;
  message: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open in Maps"
      onPress={() => {
        void hapticButtonPress();
        promptOpenStoreInMaps({
          latitude,
          longitude,
          name: label,
        });
      }}
      style={({ pressed }) => [styles.fallback, pressed && { opacity: 0.92 }]}>
      <Text style={styles.fallbackTitle}>Pickup location</Text>
      <Text style={styles.fallbackBody}>{message}</Text>
      <Text style={styles.fallbackCta}>Open in Maps →</Text>
    </Pressable>
  );
}

export function BagLocationMap({ latitude, longitude, label, address }: BagLocationMapProps) {
  if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Pickup location</Text>
        <Text style={styles.fallbackBody}>
          {address?.trim() || 'Exact map pin is not available for this restaurant yet.'}
        </Text>
      </View>
    );
  }

  if (Platform.OS === 'web' || isExpoGo()) {
    return (
      <MapsFallback
        latitude={latitude}
        longitude={longitude}
        label={label}
        message="Tap to open this pickup pin in Maps."
      />
    );
  }

  const BagLocationMapNative = require('./BagLocationMapNative')
    .default as typeof import('./BagLocationMapNative').default;

  return <BagLocationMapNative latitude={latitude} longitude={longitude} label={label} />;
}

const styles = StyleSheet.create({
  fallback: {
    minHeight: 120,
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Palette.lightGreenBg,
    borderWidth: Border.width,
    borderColor: Palette.border,
    padding: Spacing.md,
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  fallbackTitle: {
    ...Type.bodyMedium,
    color: Palette.textPrimary,
  },
  fallbackBody: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  fallbackCta: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
    marginTop: Spacing.xs,
  },
});
