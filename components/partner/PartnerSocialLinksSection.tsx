import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  hasAnyPartnerSocial,
  listPartnerSocials,
  openPartnerSocial,
  PARTNER_SOCIAL_META,
  socialDisplayValue,
  type PartnerSocialFields,
} from '@/lib/partnerSocial';

type PartnerSocialLinksSectionProps = {
  partner: PartnerSocialFields;
};

export function PartnerSocialLinksSection({ partner }: PartnerSocialLinksSectionProps) {
  if (!hasAnyPartnerSocial(partner)) return null;

  const items = listPartnerSocials(partner);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Find us online</Text>
      {items.map((item, index) => {
        const meta = PARTNER_SOCIAL_META[item.kind];
        const isLast = index === items.length - 1;
        return (
          <Pressable
            key={item.kind}
            accessibilityRole="link"
            accessibilityLabel={`Open ${meta.label}`}
            hitSlop={8}
            onPress={() => {
              void openPartnerSocial(item.kind, item.value);
            }}
            style={({ pressed }) => [
              styles.row,
              isLast && styles.rowLast,
              pressed && { opacity: 0.85 },
            ]}>
            <View style={[styles.iconCircle, { backgroundColor: meta.color }]} pointerEvents="none">
              <Text style={styles.iconEmoji}>{meta.emoji}</Text>
            </View>
            <View style={styles.center} pointerEvents="none">
              <Text style={styles.platform}>{meta.label}</Text>
              <Text style={styles.handle} numberOfLines={1}>
                {socialDisplayValue(item.kind, item.value)}
              </Text>
            </View>
            <Text style={styles.arrow} pointerEvents="none">
              →
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE8',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 16,
  },
  center: {
    flex: 1,
    minWidth: 0,
  },
  platform: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  handle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  arrow: {
    fontSize: 16,
    color: '#D85A30',
    fontWeight: '600',
  },
});
