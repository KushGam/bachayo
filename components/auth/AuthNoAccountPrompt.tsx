import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type AuthNoAccountPromptProps = {
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
};

export function AuthNoAccountPrompt({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: AuthNoAccountPromptProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Pressable
        onPress={onPrimary}
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </Pressable>
      <Pressable
        onPress={onSecondary}
        style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
        <Text style={styles.secondaryText}>{secondaryLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
    opacity: 0.9,
  },
  primaryBtn: {
    marginTop: Spacing.xs,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  primaryText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  secondaryText: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
