import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
};

export function PhoneInput({ value, onChange, placeholder, label, error }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.container,
          focused && !error ? styles.containerFocused : null,
          error ? styles.containerError : null,
        ]}>
        <Text style={styles.flag}>🇳🇵</Text>
        <Text style={styles.prefix}>+977</Text>
        <View style={styles.divider} />
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 10))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={Palette.textTertiary}
          keyboardType="phone-pad"
          maxLength={10}
          style={styles.input}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  label: {
    ...Type.label,
    color: Palette.textSecondary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
  },
  containerFocused: {
    borderColor: Palette.primary,
    borderWidth: 2,
    shadowColor: Palette.primary,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  containerError: {
    borderColor: Palette.dangerBorder,
  },
  flag: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  prefix: {
    ...Type.bodyMedium,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Palette.border,
    marginHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Type.body.fontSize,
    lineHeight: Type.body.lineHeight,
    color: Palette.textPrimary,
    paddingVertical: Spacing.md,
  },
  error: {
    ...Type.caption,
    color: Palette.dangerText,
  },
});
