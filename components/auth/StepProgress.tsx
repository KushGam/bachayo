import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';

type StepProgressProps = {
  current: number;
  total: number;
  label: string;
};

export function StepProgress({ current, total, label }: StepProgressProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[styles.segment, i < current ? styles.segmentActive : styles.segmentInactive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  track: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  segmentActive: {
    backgroundColor: Palette.primary,
  },
  segmentInactive: {
    backgroundColor: Palette.lightGreenBg,
  },
});
