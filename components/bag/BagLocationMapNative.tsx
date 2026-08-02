import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import { promptOpenStoreInMaps } from '@/lib/helpers';
import { hapticButtonPress } from '@/lib/haptics';

type BagLocationMapNativeProps = {
  latitude: number;
  longitude: number;
  label: string;
};

export default function BagLocationMapNative({
  latitude,
  longitude,
  label,
}: BagLocationMapNativeProps) {
  const openExternal = () => {
    void hapticButtonPress();
    promptOpenStoreInMaps({
      latitude,
      longitude,
      name: label,
    });
  };

  return (
    <View style={styles.wrap}>
      <MapView
        style={styles.map}
        pointerEvents="none"
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}>
        <Marker coordinate={{ latitude, longitude }} title={label} />
      </MapView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open in Maps"
        onPress={openExternal}
        style={({ pressed }) => [styles.overlay, pressed && { opacity: 0.92 }]}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Open in Maps</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 160,
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: Border.width,
    borderColor: Palette.border,
    backgroundColor: Palette.imagePlaceholder,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: Spacing.sm,
  },
  pill: {
    backgroundColor: Palette.white,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: Border.width,
    borderColor: Palette.border,
  },
  pillText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
});
