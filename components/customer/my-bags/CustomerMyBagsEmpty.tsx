import { useRouter } from 'expo-router';
import { Clock, Package, ShoppingBag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

import type { CustomerMyBagsTab } from './CustomerMyBagsHeader';

type CustomerMyBagsEmptyProps = {
  tab: CustomerMyBagsTab;
};

export function CustomerMyBagsEmpty({ tab }: CustomerMyBagsEmptyProps) {
  const router = useRouter();
  const isActive = tab === 'active';
  const Icon = isActive ? ShoppingBag : Package;

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon size={32} color={Palette.primary} strokeWidth={1.8} />
      </View>

      <Text style={styles.title}>{isActive ? 'No reservations yet' : 'No past orders'}</Text>
      <Text style={styles.subtitle}>
        {isActive
          ? 'When you reserve a rescue bag, it appears here with your QR code and pickup window.'
          : 'Completed pickups and cancelled orders will show up here.'}
      </Text>

      {isActive ? (
        <>
          <Pressable
            onPress={() => router.push('/(tabs)/customer/home')}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <Text style={styles.ctaText}>Browse rescue bags</Text>
          </Pressable>

          <View style={styles.hintRow}>
            <Clock size={13} color={Palette.textTertiary} strokeWidth={2} />
            <Text style={styles.hint}>Restaurants list bags daily — check back around 6–8pm</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 100,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: Spacing.sm,
    maxWidth: 300,
  },
  cta: {
    marginTop: Spacing.xl,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  ctaText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '600',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  hint: {
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'center',
    flex: 1,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.9,
  },
});
