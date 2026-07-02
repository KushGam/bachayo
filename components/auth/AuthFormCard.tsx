import { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/theme';

type AuthFormCardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function AuthFormCard({ children, style }: AuthFormCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
