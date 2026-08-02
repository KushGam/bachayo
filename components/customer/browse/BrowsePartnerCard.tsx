import { ChevronRight, MapPin, ShoppingBag, Star } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
import { getCategoryLabel } from '@/constants/partnerCategories';
import { CardChrome, Radius, Spacing, Type } from '@/constants/theme';
import { formatDistanceKm, getInitials } from '@/lib/helpers';
import { getOptimizedImageUrl } from '@/lib/images';
import { useAuthStore } from '@/store/useAuthStore';
import type { PartnerWithStats } from '@/types/app';

type BrowsePartnerCardProps = {
  partner: PartnerWithStats;
  distanceKm: number | null;
  onPress: () => void;
};

export const BrowsePartnerCard = memo(function BrowsePartnerCard({
  partner,
  distanceKm,
  onPress,
}: BrowsePartnerCardProps) {
  const locale = useAuthStore((s) => s.locale);
  const isNp = locale === 'np';
  const rating = partner.rating ?? 0;
  const reviewCount = partner.total_reviews ?? 0;
  const bagsToday = partner.today_bag_count;
  const hasBags = bagsToday > 0;
  const displayName = isNp && partner.name_np ? partner.name_np : partner.name;
  const categoryLabel = getCategoryLabel(partner.category, locale);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {hasBags ? <View style={styles.accent} /> : null}

      {partner.cover_image_url ? (
        <AppImage
          source={{ uri: getOptimizedImageUrl(partner.cover_image_url, 'thumb') }}
          style={styles.thumb}
          resizeMode="cover"
          recyclingKey={partner.id}
        />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbInitials}>{getInitials(partner.name)}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.category} numberOfLines={1}>
            {categoryLabel}
          </Text>
          {distanceKm != null ? (
            <View style={styles.distanceRow}>
              <MapPin size={11} color={Palette.textTertiary} strokeWidth={2.2} />
              <Text style={styles.metaMuted}>{formatDistanceKm(distanceKm)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footerRow}>
          {rating > 0 ? (
            <View style={styles.ratingRow}>
              <Star size={12} color={Palette.amber} fill={Palette.amber} strokeWidth={2} />
              <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
              {reviewCount > 0 ? (
                <Text style={styles.metaMuted}> · {reviewCount}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.metaMuted}>{isNp ? 'नयाँ' : 'New'}</Text>
          )}

          <View style={[styles.bagPill, hasBags ? styles.bagPillLive : styles.bagPillMuted]}>
            <ShoppingBag
              size={11}
              color={hasBags ? Palette.primaryDark : Palette.textTertiary}
              strokeWidth={2.2}
            />
            <Text style={[styles.bagText, hasBags ? styles.bagTextLive : styles.bagTextMuted]}>
              {hasBags
                ? isNp
                  ? `${bagsToday} आज`
                  : `${bagsToday} today`
                : isNp
                  ? 'आज छैन'
                  : 'No bags today'}
            </Text>
          </View>
        </View>
      </View>

      <ChevronRight size={16} color={Palette.textTertiary} strokeWidth={2.4} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: 18,
    backgroundColor: Palette.surface,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.94,
    backgroundColor: Palette.surfaceMuted,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: Palette.primary,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: Palette.primaryLight,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
  body: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  name: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  category: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  metaText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  metaMuted: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  bagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  bagPillLive: {
    backgroundColor: Palette.primaryLight,
  },
  bagPillMuted: {
    backgroundColor: Palette.background,
  },
  bagText: {
    ...Type.label,
    fontWeight: '700',
  },
  bagTextLive: {
    color: Palette.primaryDark,
  },
  bagTextMuted: {
    color: Palette.textTertiary,
    fontWeight: '600',
  },
});
