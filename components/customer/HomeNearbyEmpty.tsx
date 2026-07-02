import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';

type HomeNearbyEmptyProps = {
  locale: 'en' | 'np';
};

export function HomeNearbyEmpty({ locale }: HomeNearbyEmptyProps) {
  if (locale === 'np') {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Text style={styles.emptyEmoji}>🛍</Text>
        </View>
        <Text style={styles.emptyTitle}>नजिक अहिले कुनै ब्याग छैन</Text>
        <Text style={styles.emptySubtitle}>
          हामी चाँडै तपाईंको शहरमा लन्च गर्दैछौं।{'\n'}
          साँझ ६–८ बजे फेरि जाँच गर्नुहोस्।
        </Text>
        <View style={styles.cityPill}>
          <Text style={styles.cityPillText}>
            🚀 काठमाडौं, पोखरा, ललितपुर र भरतपुरमा लन्च
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyEmoji}>🛍</Text>
      </View>
      <Text style={styles.emptyTitle}>No rescue bags nearby yet</Text>
      <Text style={styles.emptySubtitle}>
        We&apos;re launching in your city soon.{'\n'}
        Check back at 6–8pm when restaurants{'\n'}
        list their daily surplus.
      </Text>
      <View style={styles.cityPill}>
        <Text style={styles.cityPillText}>
          🚀 Launching in Kathmandu, Pokhara, Lalitpur & Bharatpur
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    marginHorizontal: 16,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  cityPill: {
    backgroundColor: '#FAECE7',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cityPillText: {
    fontSize: 12,
    color: Palette.primaryDark,
    textAlign: 'center',
    fontWeight: '500',
  },
});
