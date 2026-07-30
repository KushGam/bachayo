import { ChevronRight, Sparkles, Store } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type BrowsePartnersLinkProps = {
  locale: 'en' | 'np';
  onPress: () => void;
};

export function BrowsePartnersLink({ locale, onPress }: BrowsePartnersLinkProps) {
  const isNp = locale === 'np';

  return (
    <Pressable
      onPress={() => {
        void hapticButtonPress();
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Store size={18} color={Palette.primaryDark} strokeWidth={2} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {isNp ? 'सबै रेस्टुरेन्टहरू हेर्नुहोस्' : 'Browse all restaurants'}
          </Text>
          <View style={styles.spark}>
            <Sparkles size={12} color={Palette.primary} strokeWidth={2.2} />
          </View>
        </View>
        <Text style={styles.subtitle}>
          {isNp
            ? 'श्रेणी, दूरी र खोज अनुसार फिल्टर गर्नुहोस्'
            : 'Search, filter by category & distance'}
        </Text>
      </View>
      <ChevronRight size={18} color={Palette.textTertiary} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  pressed: {
    opacity: 0.94,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  spark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
});
