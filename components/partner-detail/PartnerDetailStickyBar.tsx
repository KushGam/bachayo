import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { formatNprFromPaisa } from '@/lib/partnerDetailUi';

type PartnerDetailStickyBarProps = {
  lowestPrice: number;
  bagCount: number;
  paddingBottom: number;
  onPress: () => void;
};

export function PartnerDetailStickyBar({
  lowestPrice,
  bagCount,
  paddingBottom,
  onPress,
}: PartnerDetailStickyBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom }]}>
      <View>
        <Text style={styles.price}>From {formatNprFromPaisa(lowestPrice)}</Text>
        <Text style={styles.sub}>today only</Text>
      </View>
      <Pressable onPress={onPress} style={styles.btn}>
        <Text style={styles.btnText}>
          {bagCount === 1 ? 'Reserve now →' : `See ${bagCount} bags →`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Palette.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.borderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  price: {
    fontSize: 19,
    fontWeight: '800',
    color: Palette.primary,
  },
  sub: {
    ...Type.caption,
    color: Palette.textTertiary,
    marginTop: 2,
  },
  btn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  btnText: {
    ...Type.body,
    fontWeight: '700',
    color: Palette.white,
  },
});
