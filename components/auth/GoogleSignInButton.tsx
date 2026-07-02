import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';

type GoogleSignInButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function GoogleSignInButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
}: GoogleSignInButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <GoogleIcon />
      <Text style={styles.label}>{loading ? 'Signing in…' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    minHeight: 52,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Palette.white,
    borderWidth: Border.width,
    borderColor: Border.color,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  label: {
    ...Type.bodyMedium,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
});
