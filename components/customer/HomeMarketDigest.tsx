import { Clock, ShoppingBag, Star, Store, TrendingDown, Users, Wallet } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

type DigestStat = {
  value: string;
  label: string;
  accent?: boolean;
};

type HomeMarketDigestProps = {
  stats: DigestStat[];
  title?: string;
  variant?: 'impact' | 'market';
};

const IMPACT_ICONS: LucideIcon[] = [ShoppingBag, Wallet, Star, Clock];
const MARKET_ICONS: LucideIcon[] = [ShoppingBag, Store, TrendingDown, Users];

export function HomeMarketDigest({
  stats,
  title = 'Your impact',
  variant = 'impact',
}: HomeMarketDigestProps) {
  const icons = variant === 'impact' ? IMPACT_ICONS : MARKET_ICONS;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerAccent} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.grid}>
        {[0, 1].map((row) => (
          <View key={row} style={styles.gridRow}>
            {stats.slice(row * 2, row * 2 + 2).map((stat, col) => {
              const index = row * 2 + col;
              const Icon = icons[index] ?? ShoppingBag;
              const accent = Boolean(stat.accent) || (variant === 'impact' && index === 1);
              return (
                <View key={`${stat.label}-${index}`} style={styles.tile}>
                  <View style={[styles.iconWrap, accent && styles.iconWrapAccent]}>
                    <Icon
                      size={14}
                      color={accent ? Palette.primary : Palette.primaryDark}
                      strokeWidth={2.2}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={[styles.value, accent && styles.valueAccent]}>
                    {stat.value}
                  </Text>
                  <Text numberOfLines={2} style={styles.label}>
                    {stat.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    ...FloatingShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
    paddingHorizontal: 2,
  },
  headerAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Palette.primary,
  },
  title: {
    ...Type.caption,
    color: Palette.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  grid: {
    gap: 8,
    paddingBottom: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: Palette.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconWrapAccent: {
    backgroundColor: Palette.primaryLight,
    borderColor: Palette.overlay.border,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.5,
  },
  valueAccent: {
    color: Palette.primary,
  },
  label: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '500',
    lineHeight: 15,
  },
});
