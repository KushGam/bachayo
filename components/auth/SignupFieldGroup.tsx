import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';

type SignupFieldGroupProps = {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

export function SignupFieldGroup({ label, hint, required, children }: SignupFieldGroupProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Type.label,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Palette.danger,
    fontWeight: '700',
  },
  hint: {
    ...Type.caption,
    color: Palette.textMuted,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
});
