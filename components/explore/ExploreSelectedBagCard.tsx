import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { getCategoryById } from '@/constants/partnerCategories';
import { getRescueBagImageUrl } from '@/lib/images';
import type { HomeBag } from '@/store/useBagsStore';

type ExploreSelectedBagCardProps = {
  bag: HomeBag;
  locale: 'en' | 'np';
};

function priceLabel(paisa: number) {
  return `₨${Math.round(paisa / 100)}`;
}

export function ExploreSelectedBagCard({ bag, locale }: ExploreSelectedBagCardProps) {
  const router = useRouter();
  const category = getCategoryById(bag.partner.category);
  const categoryEmoji = category?.icon ?? '🛍';
  const remaining = Math.max(0, bag.quantity_available - bag.quantity_reserved);
  const title = locale === 'np' && bag.title_np ? bag.title_np : bag.title;
  const savingsPct =
    bag.original_price > 0
      ? Math.round(((bag.original_price - bag.rescue_price) / bag.original_price) * 100)
      : 0;
  const imageUrl = getRescueBagImageUrl(bag, 'thumb');
  const hasImage = Boolean(bag.image_url || bag.partner?.cover_image_url);

  const stockLabel =
    locale === 'np'
      ? `${remaining} ब्याग आज बाँकी`
      : `${remaining} bag${remaining === 1 ? '' : 's'} left today`;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.thumb}>
          {hasImage ? (
            <AppImage
              source={{ uri: imageUrl }}
              style={styles.thumbImage}
              recyclingKey={bag.id}
              priority="high"
            />
          ) : (
            <Text style={styles.emoji}>{categoryEmoji}</Text>
          )}
        </View>

        <View style={styles.center}>
          <Pressable onPress={() => router.push(`/partner/${bag.partner_id}`)} hitSlop={6}>
            <Text style={styles.partner} numberOfLines={1}>
              {bag.partner.name}
            </Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{priceLabel(bag.rescue_price)}</Text>
            {bag.original_price > bag.rescue_price ? (
              <Text style={styles.original}>{priceLabel(bag.original_price)}</Text>
            ) : null}
            {savingsPct > 0 ? (
              <View style={styles.offPill}>
                <Text style={styles.offText}>{savingsPct}% off</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.stock}>{stockLabel}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.reserveBtn, pressed && styles.pressed]}
          onPress={() => router.push(`/bag/${bag.id}`)}>
          <Text style={styles.reserveText}>
            {locale === 'np' ? 'आरक्षित' : 'Reserve'}
          </Text>
          <Text style={styles.reserveArrow}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 28,
  },
  center: {
    flex: 1,
    minWidth: 0,
  },
  partner: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  title: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D85A30',
  },
  original: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  offPill: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  offText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  stock: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
  },
  reserveBtn: {
    backgroundColor: '#D85A30',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  reserveText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  reserveArrow: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
