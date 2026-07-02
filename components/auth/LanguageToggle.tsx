import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useAuthStore, type Locale } from '@/store/useAuthStore';

type LanguageToggleProps = {
  locale?: Locale;
  onChange?: (locale: Locale) => void;
  variant?: 'light' | 'dark';
};

export function LanguageToggle({
  locale: localeProp,
  onChange: onChangeProp,
  variant = 'light',
}: LanguageToggleProps) {
  const storeLocale = useAuthStore((s) => s.locale);
  const setStoreLocale = useAuthStore((s) => s.setLocale);
  const locale = localeProp ?? storeLocale;
  const onChange = onChangeProp ?? setStoreLocale ?? (() => {});
  const isDark = variant === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <Pressable
        onPress={() => onChange('en')}
        style={[styles.option, locale === 'en' && (isDark ? styles.activeDark : styles.activeLight)]}>
        <Text
          style={[
            styles.text,
            isDark && styles.textDark,
            locale === 'en' && (isDark ? styles.activeTextDark : styles.activeTextLight),
          ]}>
          EN
        </Text>
      </Pressable>
      <Text style={[styles.divider, isDark && styles.dividerDark]}>|</Text>
      <Pressable
        onPress={() => onChange('np')}
        style={[styles.option, locale === 'np' && (isDark ? styles.activeDark : styles.activeLight)]}>
        <Text
          style={[
            styles.text,
            isDark && styles.textDark,
            locale === 'np' && (isDark ? styles.activeTextDark : styles.activeTextLight),
          ]}>
          नेपाली
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    padding: Spacing.xs,
    borderWidth: 1,
  },
  containerLight: {
    backgroundColor: Palette.surface,
    borderColor: Palette.borderSubtle,
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  option: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  activeLight: {
    backgroundColor: Palette.primary,
  },
  activeDark: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  text: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  textDark: {
    color: 'rgba(255,255,255,0.72)',
  },
  activeTextLight: {
    color: Palette.white,
    fontWeight: '700',
  },
  activeTextDark: {
    color: Palette.white,
    fontWeight: '700',
  },
  divider: {
    color: Palette.textTertiary,
    marginHorizontal: Spacing.xs,
  },
  dividerDark: {
    color: 'rgba(255,255,255,0.35)',
  },
});
