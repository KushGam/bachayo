import { StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { getCategoryLabel } from '@/constants/partnerCategories';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import type { PartnerCategory } from '@/types/database';

type PartnerListingPreviewProps = {
  name: string;
  nameNp?: string;
  category: PartnerCategory;
  address: string;
  coverUri?: string | null;
  locale?: 'en' | 'np';
  showAvailability?: boolean;
};

export function PartnerListingPreview({
  name,
  nameNp,
  category,
  address,
  coverUri,
  locale = 'en',
  showAvailability = false,
}: PartnerListingPreviewProps) {
  const categoryLabel = getCategoryLabel(category, locale);
  const displayName = locale === 'np' && nameNp ? nameNp : name;

  return (
    <View style={styles.card}>
      <AppImage
        source={{
          uri:
            coverUri ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=60',
        }}
        style={styles.image}
        aspectRatio={16 / 9}
      />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text numberOfLines={1} style={styles.name}>
            {displayName || 'Your restaurant'}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{categoryLabel}</Text>
          </View>
        </View>
        <Text numberOfLines={2} style={styles.address}>
          {address || 'Your address will appear here'}
        </Text>
        {showAvailability ? (
          <Text style={styles.availability}>Rescue bags available today</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
  },
  image: {
    width: '100%',
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  name: {
    flex: 1,
    ...Type.h2,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  badge: {
    backgroundColor: Palette.lightGreenBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  badgeText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
    textTransform: 'capitalize',
  },
  address: {
    ...Type.caption,
    color: Palette.textMuted,
  },
  availability: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
    marginTop: Spacing.xs,
  },
});
