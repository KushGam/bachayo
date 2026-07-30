import { MapPin } from 'lucide-react-native';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

const GRID_SPACING = 56;

const FAKE_PINS = [
  { top: '16%', left: '18%', price: '₨199' },
  { top: '34%', right: '16%', price: '₨149', selected: true },
  { bottom: '30%', left: '40%', price: '₨249' },
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
            height: StyleSheet.hairlineWidth,
            backgroundColor: Palette.border,
            opacity: 0.7,
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
            width: StyleSheet.hairlineWidth,
            backgroundColor: Palette.border,
            opacity: 0.7,
          }}
        />
      ))}
    </View>
  );
}

export function ExploreMapPlaceholder() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Palette.primaryLight, Palette.surfaceMuted, '#E4E0D8']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <MapGrid />

      {FAKE_PINS.map((pin, index) => (
        <View
          key={index}
          style={[
            styles.fakePin,
            pin,
            'selected' in pin && pin.selected ? styles.fakePinSelected : null,
          ]}>
          <Text style={styles.fakePinText}>{pin.price}</Text>
        </View>
      ))}

      <View style={styles.centerCard}>
        <View style={styles.iconWrap}>
          <MapPin size={22} color={Palette.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.centerTitle}>Map preview</Text>
        <Text style={styles.centerSubtitle}>
          Interactive map with live pins ships in the production LastBag build.
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
    borderWidth: 2.5,
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
  fakePinSelected: {
    transform: [{ scale: 1.12 }],
    backgroundColor: Palette.primaryDark,
  },
  fakePinText: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '800',
  },
  centerCard: {
    ...CardChrome,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginHorizontal: Spacing.xxl,
    backgroundColor: 'rgba(255,252,250,0.94)',
    maxWidth: 280,
    ...FloatingShadow,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
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
    lineHeight: 19,
  },
});
