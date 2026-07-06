import { Map } from 'lucide-react-native';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

const GRID_SPACING = 60;
const GRID_COLOR = Palette.border;

const FAKE_PINS = [
  { top: '18%', left: '22%', price: '₨199' },
  { top: '38%', right: '18%', price: '₨149' },
  { bottom: '28%', left: '42%', price: '₨249' },
] as const;

function MapGrid() {
  const { width, height } = useWindowDimensions();
  const horizontalLines = Math.ceil(height / GRID_SPACING) + 1;
  const verticalLines = Math.ceil(width / GRID_SPACING) + 1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: horizontalLines }).map((_, index) => (
        <View
          key={`h-${index}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: index * GRID_SPACING,
            height: 1,
            backgroundColor: GRID_COLOR,
            opacity: 0.55,
          }}
        />
      ))}
      {Array.from({ length: verticalLines }).map((_, index) => (
        <View
          key={`v-${index}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: index * GRID_SPACING,
            width: 1,
            backgroundColor: GRID_COLOR,
            opacity: 0.55,
          }}
        />
      ))}
    </View>
  );
}

export function ExploreMapPlaceholder() {
  return (
    <View style={styles.container}>
      <MapGrid />

      {FAKE_PINS.map((pin, index) => (
        <View key={index} style={[styles.fakePin, pin]}>
          <Text style={styles.fakePinText}>{pin.price}</Text>
        </View>
      ))}

      <View style={styles.centerCard}>
        <View style={styles.iconWrap}>
          <Map size={24} color={Palette.primary} strokeWidth={2} />
        </View>
        <Text style={styles.centerTitle}>Map preview</Text>
        <Text style={styles.centerSubtitle}>
          Full interactive map is available in the production LastBag app build.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fakePin: {
    position: 'absolute',
    minWidth: 52,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: Palette.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  fakePinText: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '800',
  },
  centerCard: {
    ...CardChrome,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginHorizontal: Spacing.xxl,
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  centerTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  centerSubtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
