import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import type { Locale } from '@/store/useAuthStore';

type LanguageToggleProps = {
  locale: Locale;
  onChange: (locale: Locale) => void;
};

export function LanguageToggle({ locale, onChange }: LanguageToggleProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange('en')}
        style={[styles.option, locale === 'en' && styles.active]}>
        <Text style={[styles.text, locale === 'en' && styles.activeText]}>EN</Text>
      </Pressable>
      <Text style={styles.divider}>|</Text>
      <Pressable
        onPress={() => onChange('np')}
        style={[styles.option, locale === 'np' && styles.active]}>
        <Text style={[styles.text, locale === 'np' && styles.activeText]}>नेपाली</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Palette.white,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  active: {
    backgroundColor: Palette.lightGreenBg,
  },
  text: {
    fontSize: 14,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  activeText: {
    color: Palette.primary,
    fontWeight: '600',
  },
  divider: {
    color: Palette.textMuted,
    marginHorizontal: 2,
  },
});
