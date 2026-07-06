import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

type DigestStat = {
  value: string;
  label: string;
};

type HomeMarketDigestProps = {
  stats: DigestStat[];
  title?: string;
};

function StatCell({ value, label, showDivider }: DigestStat & { showDivider?: boolean }) {
  return (
    <>
      {showDivider ? <View style={styles.divider} /> : null}
      <View style={styles.cell}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
          {value}
        </Text>
        <Text numberOfLines={2} style={styles.label}>
          {label}
        </Text>
      </View>
    </>
  );
}

export function HomeMarketDigest({ stats, title }: HomeMarketDigestProps) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.row}>
        {stats.map((stat, index) => (
          <StatCell key={stat.label} {...stat} showDivider={index > 0} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    gap: Spacing.md,
  },
  title: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  divider: {
    width: 1,
    backgroundColor: Palette.borderSubtle,
    marginVertical: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.primaryDark,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  label: {
    ...Type.label,
    color: Palette.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
});
