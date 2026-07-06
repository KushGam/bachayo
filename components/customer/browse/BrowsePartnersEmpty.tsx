import { MapPin, Search, Store } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type BrowsePartnersEmptyProps = {
  locale: 'en' | 'np';
  hasSearch: boolean;
  bagsTodayOnly: boolean;
  hiddenByDistance: boolean;
  onClearFilters: () => void;
  onWidenDistance: () => void;
};

export function BrowsePartnersEmpty({
  locale,
  hasSearch,
  bagsTodayOnly,
  hiddenByDistance,
  onClearFilters,
  onWidenDistance,
}: BrowsePartnersEmptyProps) {
  const isNp = locale === 'np';
  const Icon = hasSearch ? Search : hiddenByDistance ? MapPin : Store;

  const title = hasSearch
    ? isNp
      ? 'कुनै मिल्दो रेस्टुरेन्ट भेटिएन'
      : 'No matching restaurants'
    : hiddenByDistance
      ? isNp
        ? 'छानिएको दूरी भित्र कुनै छैन'
        : 'None within this distance'
      : bagsTodayOnly
        ? isNp
          ? 'आज कुनै पनि ब्याग सूची छैन'
          : 'No live listings today'
        : isNp
          ? 'यहाँ कुनै रेस्टुरेन्ट छैन'
          : 'No restaurants here';

  const subtitle = hasSearch
    ? isNp
      ? 'अर्को नाम वा फिल्टर प्रयास गर्नुहोस्।'
      : 'Try a different name or clear your search.'
    : hiddenByDistance
      ? isNp
        ? 'दूरी बढाउनुहोस् वा अर्को क्षेत्र छान्नुहोस्।'
        : 'Widen the distance filter or choose another area.'
      : bagsTodayOnly
        ? isNp
          ? '“आज सूची” फिल्टर हटाउनुहोस् वा साँझ फेरि जाँच गर्नुहोस्।'
          : 'Turn off “Live today” or check back this evening.'
        : isNp
          ? 'अर्को क्षेत्र छान्नुहोस् वा पछि फेरि हेर्नुहोस्।'
          : 'Try another area or check back later.';

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon size={26} color={Palette.primary} strokeWidth={2} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.actions}>
        {(hasSearch || bagsTodayOnly) && (
          <Pressable
            onPress={onClearFilters}
            style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}>
            <Text style={styles.btnPrimaryText}>{isNp ? 'फिल्टर मेटाउनुहोस्' : 'Clear filters'}</Text>
          </Pressable>
        )}
        {hiddenByDistance ? (
          <Pressable
            onPress={onWidenDistance}
            style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.pressed]}>
            <Text style={styles.btnSecondaryText}>{isNp ? 'दूरी बढाउनुहोस्' : 'Widen distance'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  actions: {
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 220,
  },
  btn: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: Palette.primary,
  },
  btnSecondary: {
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  btnPrimaryText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.white,
  },
  btnSecondaryText: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  pressed: {
    opacity: 0.9,
  },
});
