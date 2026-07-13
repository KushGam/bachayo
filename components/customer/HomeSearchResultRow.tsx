import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
import { getRescueBagImageUrl } from '@/lib/images';
import { formatBagServiceBadge, formatNprPaisa } from '@/lib/helpers';
import type { HomeBag } from '@/store/useBagsStore';

type HomeSearchResultRowProps = {
  bag: HomeBag;
  onPress: () => void;
};

export function HomeSearchResultRow({ bag, onPress }: HomeSearchResultRowProps) {
  const pickupLabel = `${bag.pickup_start.slice(0, 5)} – ${bag.pickup_end.slice(0, 5)}`;
  const serviceBadge = formatBagServiceBadge(bag);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <AppImage
        source={{ uri: getRescueBagImageUrl(bag) }}
        style={styles.thumb}
      />
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.partner}>
          {bag.partner.name}
        </Text>
        <Text numberOfLines={1} style={styles.title}>
          {bag.title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.price}>{formatNprPaisa(bag.rescue_price)}</Text>
          {serviceBadge ? <Text style={styles.service}>{serviceBadge}</Text> : null}
          <Text style={styles.pickup}>{pickupLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function HomeSearchResultSkeleton() {
  return (
    <View style={styles.row}>
      <View style={styles.thumbPlaceholder} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLineWide} />
        <View style={styles.skeletonLineMid} />
        <View style={styles.skeletonLineShort} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  pressed: {
    opacity: 0.92,
    backgroundColor: '#FAFAF8',
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FAECE7',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  partner: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  title: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontWeight: '400',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
  },
  service: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  pickup: {
    fontSize: 12,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  thumbPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EDE9E3',
  },
  skeletonBody: {
    flex: 1,
    gap: 6,
  },
  skeletonLineWide: {
    width: '70%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EDE9E3',
  },
  skeletonLineMid: {
    width: '55%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EDE9E3',
  },
  skeletonLineShort: {
    width: '35%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EDE9E3',
  },
});
