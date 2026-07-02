import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { BachayoLogo } from '@/components/auth/BachayoLogo';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { LanguageToggle } from '@/components/auth/LanguageToggle';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/ui/Button';
import { t } from '@/constants/i18n';
import { Palette } from '@/constants/Colors';
import { Border, Spacing, Type } from '@/constants/theme';
import { navigateAfterGoogleSignIn } from '@/lib/auth';
import { useAuthStore } from '@/store/useAuthStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const { locale, setLocale, setPendingRole, setAuthRole } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const goToSignup = () => {
    setPendingRole('customer');
    router.push('/(auth)/signup-customer/basics');
  };

  const goToPartnerSignup = () => {
    setPendingRole('partner');
    router.push('/(auth)/signup-partner/basics');
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setGoogleLoading(true);

    try {
      const result = await navigateAfterGoogleSignIn(router, setAuthRole);
      if (!result.ok && !result.cancelled) {
        setAuthError(t(locale, 'authError'));
      }
    } catch {
      setAuthError(t(locale, 'authError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <LanguageToggle locale={locale} onChange={setLocale} />

      <View style={styles.hero}>
        <BachayoLogo />
        <Text style={styles.tagline}>{t(locale, 'tagline')}</Text>
        <Text style={styles.subtagline}>Nepal&apos;s food rescue marketplace</Text>
      </View>

      <View style={styles.actions}>
        <AuthButton label="Start saving food" onPress={goToSignup} />
        <AuthButton
          label="I run a restaurant"
          variant="secondary"
          onPress={goToPartnerSignup}
          style={styles.partnerBtn}
        />

        <Button
          label="Already have an account? Log in"
          variant="ghost"
          size="md"
          onPress={() => router.push('/(auth)/login')}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <GoogleSignInButton
          label={t(locale, 'googleCta')}
          onPress={handleGoogleSignIn}
          loading={googleLoading}
        />
        {authError ? <Text style={styles.error}>{authError}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    paddingBottom: Spacing.xxl,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Palette.primary,
    opacity: 0.06,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 120,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Palette.primary,
    opacity: 0.04,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  tagline: {
    ...Type.h2,
    color: Palette.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  subtagline: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: {
    gap: Spacing.md,
  },
  partnerBtn: {
    paddingVertical: Spacing.lg,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: Border.width,
    backgroundColor: Palette.border,
  },
  dividerText: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  error: {
    ...Type.body,
    color: Palette.danger,
    textAlign: 'center',
  },
});
