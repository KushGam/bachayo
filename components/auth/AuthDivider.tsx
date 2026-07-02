import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Border, Spacing, Type } from '@/constants/theme';

type AuthDividerProps = {
  label?: string;
};

export function AuthDivider({ label = 'or' }: AuthDividerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  line: {
    flex: 1,
    height: Border.width,
    backgroundColor: Palette.border,
  },
  label: {
    ...Type.caption,
    color: Palette.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
