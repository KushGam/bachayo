import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  hasAnyPartnerSocial,
  listPartnerSocials,
  openPartnerSocial,
  PARTNER_SOCIAL_META,
  type PartnerSocialFields,
} from '@/lib/partnerSocial';

type PartnerSocialIconsRowProps = {
  partner: PartnerSocialFields;
};

export function PartnerSocialIconsRow({ partner }: PartnerSocialIconsRowProps) {
  if (!hasAnyPartnerSocial(partner)) return null;

  return (
    <View style={styles.row}>
      {listPartnerSocials(partner).map((item) => {
        const meta = PARTNER_SOCIAL_META[item.kind];
        return (
          <Pressable
            key={item.kind}
            accessibilityRole="link"
            accessibilityLabel={`Open ${meta.label}`}
            hitSlop={6}
            onPress={() => {
              void openPartnerSocial(item.kind, item.value);
            }}
            style={({ pressed }) => [
              styles.icon,
              { backgroundColor: meta.color },
              pressed && { opacity: 0.85 },
            ]}>
            <Text style={styles.emoji} pointerEvents="none">
              {meta.emoji}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 14,
  },
});
