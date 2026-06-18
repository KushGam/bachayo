import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { BachayoLogo } from '@/components/auth/BachayoLogo';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { Screen } from '@/components/Screen';
import { t } from '@/constants/i18n';
import { Palette } from '@/constants/Colors';
import { sendPhoneOtp } from '@/lib/auth';
import { phoneSchema, type PhoneFormValues } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/useAuthStore';

export default function PhoneScreen() {
  const router = useRouter();
  const { locale, pendingRole, setPendingPhone } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = async ({ phone }: PhoneFormValues) => {
    setSubmitError(null);
    setLoading(true);

    const { error } = await sendPhoneOtp(phone);

    setLoading(false);

    if (error) {
      setSubmitError(error.message || t(locale, 'authError'));
      return;
    }

    setPendingPhone(phone);
    router.push('/(auth)/verify');
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <View style={styles.header}>
        <BachayoLogo size="sm" />
        <Text style={styles.title}>{t(locale, 'phoneTitle')}</Text>
        <Text style={styles.subtitle}>{t(locale, 'phoneSubtitle')}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {pendingRole === 'partner' ? t(locale, 'partnerCta') : t(locale, 'customerCta')}
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="phone"
          render={({ field: { value, onChange } }) => (
            <PhoneInput
              value={value}
              onChange={onChange}
              placeholder={t(locale, 'phonePlaceholder')}
              error={errors.phone?.message ? t(locale, 'invalidPhone') : undefined}
            />
          )}
        />

        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

        <AuthButton
          label={t(locale, 'sendOtp')}
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.submit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  back: {
    marginTop: 8,
    marginBottom: 16,
    width: 40,
  },
  backText: {
    fontSize: 24,
    color: Palette.textPrimary,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Palette.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  roleBadge: {
    marginTop: 4,
    backgroundColor: Palette.lightGreenBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  roleText: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '600',
  },
  form: {
    gap: 8,
  },
  submit: {
    marginTop: 16,
  },
  submitError: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
