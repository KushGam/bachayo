import { Palette } from '@/constants/Colors';
import { Platform, StyleSheet, Text, View } from 'react-native';

type DigestStat = {
  value: string;
  label: string;
};

type HomeMarketDigestProps = {
  stats: DigestStat[];
};

function StatCell({ value, label }: DigestStat) {
  return (
    <View style={styles.cell}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function HomeMarketDigest({ stats }: HomeMarketDigestProps) {
  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <StatCell key={stat.label} {...stat} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: -20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '47%',
    gap: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '600',
    color: Palette.primary,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 11,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
});
