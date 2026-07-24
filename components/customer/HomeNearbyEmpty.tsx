import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { AppSymbol } from '@/components/ui/AppSymbol';

type HomeNearbyEmptyProps = {
  locale: 'en' | 'np';
};

export function HomeNearbyEmpty({ locale }: HomeNearbyEmptyProps) {
  const isNp = locale === 'np';

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <AppSymbol ios="bag" android="shopping-bag" size={28} color={Palette.primary} />
      </View>
      <Text style={styles.emptyTitle}>
        {isNp ? 'नजिक अहिले कुनै ब्याग छैन' : 'No bags nearby right now'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isNp
          ? 'साँझ ६–८ बजे फेरि जाँच गर्नुहोस्।\nरेस्टुरेन्टहरूले दैनिक बाँकी सूचीबद्ध गर्छन्।'
          : 'Check back around 6–8pm when restaurants\nlist their daily surplus.'}
      </Text>
      <View style={styles.cityPill}>
        <Text style={styles.cityPillText}>
          {isNp
            ? 'नेपालभर उपलब्ध'
            : 'Available across Nepal'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  cityPill: {
    backgroundColor: Palette.background,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  cityPillText: {
    ...Type.label,
    color: Palette.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
