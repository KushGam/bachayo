import { useRouter } from 'expo-router';
import { ChevronRight, ShoppingBag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { getCategoryById } from '@/constants/partnerCategories';
import type { HomeBag } from '@/store/useBagsStore';

type ExploreSelectedBagCardProps = {
  bag: HomeBag;
  locale: 'en' | 'np';
};

function markerPriceLabel(paisa: number) {
  return `₨${Math.round(paisa / 100)}`;
}

export function ExploreSelectedBagCard({ bag, locale }: ExploreSelectedBagCardProps) {
  const router = useRouter();
  const category = getCategoryById(bag.partner.category);
  const categoryLabel = category
    ? locale === 'np'
      ? category.labelNp
      : category.label
    : bag.partner.category;
  const remaining = Math.max(0, bag.quantity_available - bag.quantity_reserved);
  const title = locale === 'np' && bag.title_np ? bag.title_np : bag.title;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.accent} />
        <View style={styles.body}>
          <View style={styles.top}>
            <View style={styles.copy}>
              <Pressable onPress={() => router.push(`/partner/${bag.partner_id}`)} hitSlop={6}>
                <Text style={styles.partner} numberOfLines={1}>
                  {bag.partner.name}
                </Text>
              </Pressable>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{categoryLabel}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.price}>{markerPriceLabel(bag.rescue_price)}</Text>
            <Text style={styles.availability}>
              {remaining} bag{remaining === 1 ? '' : 's'} left today
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            onPress={() => router.push(`/bag/${bag.id}`)}>
            <ShoppingBag size={16} color={Palette.white} strokeWidth={2.2} />
            <Text style={styles.ctaText}>View & reserve</Text>
            <ChevronRight size={16} color={Palette.white} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  accent: {
    height: 3,
    backgroundColor: Palette.primary,
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  partner: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  title: {
    ...Type.caption,
    color: Palette.textSecondary,
  },
  categoryPill: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  categoryText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.primaryDark,
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.primaryDark,
    letterSpacing: -0.4,
  },
  availability: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm + 2,
    marginTop: 2,
  },
  ctaText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
});
