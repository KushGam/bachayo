import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Palette } from '@/constants/Colors';

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
};

export function PhoneInput({ value, onChange, placeholder, error }: PhoneInputProps) {
  return (
    <View>
      <View style={[styles.container, error ? styles.containerError : null]}>
        <Text style={styles.flag}>🇳🇵</Text>
        <Text style={styles.prefix}>+977</Text>
        <View style={styles.divider} />
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 10))}
          placeholder={placeholder}
          placeholderTextColor={Palette.textMuted}
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  containerError: {
    borderColor: '#DC2626',
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Palette.lightGreenBg,
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Palette.textPrimary,
    paddingVertical: 14,
  },
  error: {
    marginTop: 8,
    color: '#DC2626',
    fontSize: 14,
  },
});
