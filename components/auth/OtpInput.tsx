import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Phone OTP is 6; Supabase email confirmation OTP is often 8. */
  length?: number;
  autoComplete?: 'sms-otp' | 'one-time-code';
};

export function OtpInput({
  value,
  onChange,
  error,
  length = 6,
  autoComplete = 'sms-otp',
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(length, ' ').split('').slice(0, length);
  const activeIndex = Math.min(value.length, length - 1);

  const focus = () => inputRef.current?.focus();

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
  };

  return (
    <View>
      <Pressable onPress={focus} style={styles.row}>
        {digits.map((digit, index) => {
          const filled = Boolean(digit.trim());
          const active = index === activeIndex && value.length < length;
          return (
            <View
              key={index}
              style={[
                styles.box,
                length >= 8 ? styles.boxCompact : null,
                error ? styles.boxError : null,
                filled ? styles.boxFilled : null,
                active ? styles.boxActive : null,
              ]}>
              <Text style={[styles.digit, length >= 8 ? styles.digitCompact : null]}>
                {digit.trim()}
              </Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
        autoComplete={autoComplete}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxCompact: {
    maxWidth: 40,
    aspectRatio: 0.75,
    borderRadius: Radius.sm,
  },
  boxFilled: {
    borderColor: Palette.primary,
    backgroundColor: Palette.lightGreenBg,
  },
  boxActive: {
    borderColor: Palette.primary,
    borderWidth: 2,
  },
  boxError: {
    borderColor: Palette.dangerBorder,
  },
  digit: {
    ...Type.h2,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  digitCompact: {
    fontSize: 18,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  error: {
    marginTop: Spacing.md,
    ...Type.caption,
    color: Palette.dangerText,
    textAlign: 'center',
  },
});
