import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Palette } from '@/constants/Colors';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const LENGTH = 6;

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(LENGTH, ' ').split('').slice(0, LENGTH);

  const focus = () => inputRef.current?.focus();

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, LENGTH);
    onChange(cleaned);
  };

  return (
    <View>
      <Pressable onPress={focus} style={styles.row}>
        {digits.map((digit, index) => (
          <View
            key={index}
            style={[
              styles.box,
              error ? styles.boxError : null,
              digit.trim() ? styles.boxFilled : null,
            ]}>
            <Text style={styles.digit}>{digit.trim()}</Text>
          </View>
        ))}
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
    gap: 8,
  },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: Palette.primary,
    backgroundColor: Palette.lightGreenBg,
  },
  boxError: {
    borderColor: '#DC2626',
  },
  digit: {
    fontSize: 22,
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
    marginTop: 12,
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
});
