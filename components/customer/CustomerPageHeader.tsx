import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';

type CustomerPageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function CustomerPageHeader({ title, subtitle }: CustomerPageHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 20,
  },
});
