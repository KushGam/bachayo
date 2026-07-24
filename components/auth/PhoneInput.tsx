import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type PhoneInputProps = {
  value: string;
  /** Preferred callback used across existing auth forms */
  onChange?: (value: string) => void;
  /** Spec alias */
  onChangeText?: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  showHelper?: boolean;
};

export function PhoneInput({
  value,
  onChange,
  onChangeText,
  placeholder = '98XXXXXXXX',
  label = 'Phone number',
  error,
  showHelper = true,
}: PhoneInputProps) {
  const handleChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 10);
    onChange?.(clean);
    onChangeText?.(clean);
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.container, error ? styles.containerError : null]}>
        <View style={styles.prefixBlock}>
          <Text style={styles.flag}>🇳🇵</Text>
          <Text style={styles.prefix}>+977</Text>
        </View>

        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={10}
          style={styles.input}
        />

        <Text style={styles.counter}>{value.length}/10</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && showHelper ? (
        <Text style={styles.helper}>NTC or Ncell number</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  containerError: {
    borderColor: '#E24B4A',
  },
  prefixBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#F0EDE8',
    gap: 6,
  },
  flag: {
    fontSize: 18,
  },
  prefix: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontWeight: '500',
  },
  counter: {
    fontSize: 12,
    color: '#9CA3AF',
    paddingRight: 12,
  },
  error: {
    fontSize: 12,
    color: '#E24B4A',
    marginTop: 6,
  },
  helper: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
