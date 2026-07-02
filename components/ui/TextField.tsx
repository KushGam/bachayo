import { useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { Motion, Radius, Spacing, Type } from '@/constants/theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  hideLabel?: boolean;
};

export function TextField({
  label,
  error,
  hideLabel,
  style,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? Palette.dangerBorder
      : interpolateColor(
          focusProgress.value,
          [0, 1],
          [Palette.border, Palette.primary],
        ),
    borderWidth: focusProgress.value > 0.5 && !error ? 2 : 1,
  }));

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setFocused(true);
    focusProgress.value = withTiming(1, { duration: Motion.fast });
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setFocused(false);
    focusProgress.value = withTiming(0, { duration: Motion.fast });
    onBlur?.(e);
  };

  return (
    <View style={[styles.wrap, hideLabel && styles.wrapCompact]}>
      {!hideLabel && label ? <Text style={styles.label}>{label}</Text> : null}
      <AnimatedTextInput
        placeholderTextColor={Palette.textTertiary}
        style={[
          styles.input,
          borderAnimatedStyle,
          focused && !error ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style,
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  wrapCompact: {
    marginBottom: 0,
  },
  label: {
    ...Type.label,
    color: Palette.textSecondary,
  },
  input: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Type.body.fontSize,
    lineHeight: Type.body.lineHeight,
    color: Palette.textPrimary,
    minHeight: 52,
  },
  inputFocused: {
    shadowColor: Palette.primary,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  inputError: {
    borderColor: Palette.dangerBorder,
  },
  error: {
    ...Type.caption,
    color: Palette.dangerText,
  },
});
