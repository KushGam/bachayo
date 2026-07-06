import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { computeTodaySummary, formatNprFromPaisa, type PartnerBagWithStats } from '@/lib/partnerBags';

export function TodaySummaryCard({ bags }: { bags: PartnerBagWithStats[] }) {
  const summary = computeTodaySummary(bags);
  const stats = [
    { value: String(summary.listed), label: 'Listed' },
    { value: String(summary.reserved), label: 'Reserved' },
    { value: formatNprFromPaisa(summary.potentialRevenue), label: 'Potential', compact: true },
    { value: formatNprFromPaisa(summary.earned), label: 'Earned', compact: true, accent: true },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Today</Text>
      <View style={styles.card}>
        {stats.map((stat, index) => (
          <View key={stat.label} style={styles.cellWrap}>
            <View style={styles.cell}>
              <Text
                style={[
                  styles.value,
                  stat.compact && styles.valueCompact,
                  stat.accent && styles.valueAccent,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}>
                {stat.value}
              </Text>
              <Text style={styles.label}>{stat.label}</Text>
            </View>
            {index < stats.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  eyebrow: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '600',
    marginLeft: 2,
  },
  card: {
    flexDirection: 'row',
    ...CardChrome,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xs,
    ...FloatingShadow,
  },
  cellWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  valueCompact: {
    fontSize: 14,
  },
  valueAccent: {
    color: Palette.primary,
  },
  label: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Palette.borderSubtle,
  },
});
