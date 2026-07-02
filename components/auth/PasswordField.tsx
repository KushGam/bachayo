import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type PasswordFieldProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  autoComplete?: 'password' | 'password-new' | 'off';
};

export function PasswordField({
  label = 'Password',
  value,
  onChangeText,
  onBlur,
  placeholder = 'At least 8 characters',
  error,
  autoComplete = 'password',
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const borderColor = error ? Palette.dangerBorder : focused ? Palette.primary : Palette.border;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, { borderColor }, error ? styles.fieldError : null]}>
        <TextInput
          value={value ?? ''}
          onChangeText={onChangeText}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={Palette.textTertiary}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={visible ? 'none' : 'password'}
          importantForAutofill="yes"
          style={styles.input}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          style={styles.eyeBtn}
          hitSlop={8}
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
          {visible ? (
            <EyeOff size={18} color={Palette.textSecondary} strokeWidth={2} />
          ) : (
            <Eye size={18} color={Palette.textSecondary} strokeWidth={2} />
          )}
        </Pressable>
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    minHeight: 52,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
  },
  fieldError: {
    borderColor: Palette.dangerBorder,
  },
  input: {
    flex: 1,
    fontSize: Type.body.fontSize,
    color: Palette.textPrimary,
    ...(Platform.OS === 'android'
      ? {
          height: 48,
          paddingVertical: 0,
          textAlignVertical: 'center',
        }
      : {
          lineHeight: Type.body.lineHeight,
          paddingVertical: Spacing.md,
        }),
  },
  eyeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    ...Type.caption,
    color: Palette.dangerText,
  },
});
