import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Palette } from '@/constants/Colors';

const GRID_SPACING = 60;
const GRID_COLOR = '#D4CFC6';

const FAKE_PINS = [
  { top: '18%', left: '22%' },
  { top: '38%', right: '18%' },
  { bottom: '28%', left: '42%' },
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

      {FAKE_PINS.map((position, index) => (
        <View key={index} style={[styles.fakePin, position]}>
          <Text style={styles.fakePinText}>₨</Text>
        </View>
      ))}

      <View style={styles.centerCard}>
        <Text style={styles.centerEmoji}>🗺</Text>
        <Text style={styles.centerTitle}>Map coming soon</Text>
        <Text style={styles.centerSubtitle}>
          Full map view available in the{'\n'}
          LastBag app on the App Store
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E4DC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fakePin: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  fakePinText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '800',
  },
  centerCard: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  centerEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  centerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 6,
  },
  centerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
