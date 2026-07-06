import { ChevronRight, MapPin, ShoppingBag, Star } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
import { getCategoryLabel } from '@/constants/partnerCategories';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { formatDistanceKm, getInitials } from '@/lib/helpers';
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
        <AppImage source={{ uri: partner.cover_image_url }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbInitials}>{getInitials(partner.name)}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {categoryLabel}
        </Text>

        <View style={styles.metaRow}>
          {rating > 0 ? (
            <View style={styles.ratingRow}>
              <Star size={12} color={Palette.primary} fill={Palette.primary} strokeWidth={2} />
              <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
              {reviewCount > 0 ? <Text style={styles.metaMuted}> ({reviewCount})</Text> : null}
            </View>
          ) : (
            <Text style={styles.metaMuted}>{isNp ? 'नयाँ' : 'New'}</Text>
          )}

          {distanceKm != null ? (
            <View style={styles.distanceRow}>
              <MapPin size={11} color={Palette.textTertiary} strokeWidth={2} />
              <Text style={styles.metaMuted}>{formatDistanceKm(distanceKm)}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.bagPill, hasBags ? styles.bagPillLive : styles.bagPillMuted]}>
          <ShoppingBag
            size={12}
            color={hasBags ? Palette.primaryDark : Palette.textTertiary}
            strokeWidth={2.2}
          />
          <Text style={[styles.bagText, hasBags ? styles.bagTextLive : styles.bagTextMuted]}>
            {hasBags
              ? isNp
                ? `${bagsToday} ब्याग आज`
                : `${bagsToday} bag${bagsToday === 1 ? '' : 's'} today`
              : isNp
                ? 'आज छैन'
                : 'None today'}
          </Text>
        </View>
      </View>

      <ChevronRight size={18} color={Palette.textTertiary} strokeWidth={2.5} />
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
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  pressed: {
    opacity: 0.95,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Palette.primary,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  thumbInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.primaryDark,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  name: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  category: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: 2,
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
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  bagPillLive: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.overlay.border,
  },
  bagPillMuted: {
    backgroundColor: Palette.background,
    borderColor: Palette.borderSubtle,
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
