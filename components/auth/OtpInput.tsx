import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const LENGTH = 6;

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(LENGTH, ' ').split('').slice(0, LENGTH);
  const activeIndex = Math.min(value.length, LENGTH - 1);

  const focus = () => inputRef.current?.focus();

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, LENGTH);
    onChange(cleaned);
  };

  return (
    <View>
      <Pressable onPress={focus} style={styles.row}>
        {digits.map((digit, index) => {
          const filled = Boolean(digit.trim());
          const active = index === activeIndex && value.length < LENGTH;
          return (
            <View
              key={index}
              style={[
                styles.box,
                error ? styles.boxError : null,
                filled ? styles.boxFilled : null,
                active ? styles.boxActive : null,
              ]}>
              <Text style={styles.digit}>{digit.trim()}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={LENGTH}
        autoFocus
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
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
