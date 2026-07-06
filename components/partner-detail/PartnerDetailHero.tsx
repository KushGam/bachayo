import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Share2, Store } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { StarRating } from '@/components/partner-detail/StarRating';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { getCategoryById } from '@/constants/partnerCategories';
import { hapticButtonPress } from '@/lib/haptics';
import type { PartnerDetailData } from '@/lib/partnerDetail';

type PartnerDetailHeroProps = {
  partner: PartnerDetailData['partner'];
  stats: PartnerDetailData['stats'];
  distanceLabel: string | null;
  paddingTop: number;
  onBack: () => void;
  onShare: () => void;
};

export function PartnerDetailHero({
  partner,
  stats,
  distanceLabel,
  paddingTop,
  onBack,
  onShare,
}: PartnerDetailHeroProps) {
  const category = getCategoryById(partner.category);

  return (
    <View style={styles.hero}>
      {partner.cover_image_url ? (
        <AppImage source={{ uri: partner.cover_image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          {category ? (
            <Text style={styles.placeholderEmoji}>{category.icon}</Text>
          ) : (
            <Store size={40} color={Palette.primaryDark} strokeWidth={1.8} />
          )}
        </View>
      )}

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={styles.gradient} />

      <Pressable
        onPress={() => {
          void hapticButtonPress();
          onBack();
        }}
        style={[styles.headerBtn, styles.headerBtnLeft, { top: paddingTop }]}>
        <ChevronLeft size={20} color={Palette.white} strokeWidth={2.5} />
      </Pressable>
      <Pressable
        onPress={() => {
          void hapticButtonPress();
          onShare();
        }}
        style={[styles.headerBtn, styles.headerBtnRight, { top: paddingTop }]}>
        <Share2 size={18} color={Palette.white} strokeWidth={2} />
      </Pressable>

      <View style={styles.content}>
        {category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {category.icon} {category.label}
            </Text>
          </View>
        ) : null}
        <Text style={styles.name}>{partner.name}</Text>
        <View style={styles.metaRow}>
          {stats.avgRating > 0 ? (
            <>
              <StarRating rating={stats.avgRating} size={12} color={Palette.white} />
              <Text style={styles.rating}>{stats.avgRating.toFixed(1)}</Text>
            </>
          ) : null}
          <Text style={styles.meta}>
            · {stats.totalReviews} review{stats.totalReviews === 1 ? '' : 's'}
          </Text>
          {distanceLabel ? <Text style={styles.meta}> · {distanceLabel}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 248,
    position: 'relative',
    backgroundColor: Palette.primaryLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primaryLight,
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  headerBtn: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerBtnLeft: {
    left: Spacing.lg,
  },
  headerBtnRight: {
    right: Spacing.lg,
  },
  content: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  categoryText: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.white,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: 4,
  },
  rating: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.white,
    marginLeft: 4,
  },
  meta: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '500',
  },
});
