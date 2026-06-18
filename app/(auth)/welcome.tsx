import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { BachayoLogo } from '@/components/auth/BachayoLogo';
import { LanguageToggle } from '@/components/auth/LanguageToggle';
import { Screen } from '@/components/Screen';
import { t } from '@/constants/i18n';
import { Palette } from '@/constants/Colors';
import { useAuthStore } from '@/store/useAuthStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const { locale, setLocale, setPendingRole } = useAuthStore();

  const goToPhone = (role: 'customer' | 'partner') => {
    setPendingRole(role);
    router.push('/(auth)/phone');
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <LanguageToggle locale={locale} onChange={setLocale} />

      <View style={styles.hero}>
        <BachayoLogo />
        <Text style={styles.tagline}>{t(locale, 'tagline')}</Text>
      </View>

      <View style={styles.actions}>
        <AuthButton label={t(locale, 'customerCta')} onPress={() => goToPhone('customer')} />
        <AuthButton
          label={t(locale, 'partnerCta')}
          variant="secondary"
          onPress={() => goToPhone('partner')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  tagline: {
    fontSize: 18,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    gap: 12,
  },
});
