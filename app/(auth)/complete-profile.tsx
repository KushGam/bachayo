import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AuthButton } from '@/components/auth/AuthButton';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { Screen } from '@/components/Screen';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import { t } from '@/constants/i18n';
import { useSafeBack } from '@/hooks/useSafeBack';
import { phoneProfileExists, upsertProfile } from '@/lib/auth';
import { getTabsRouteForRole } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { phoneSchema } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types/database';

const completeProfileSchema = z.object({
  phone: phoneSchema.shape.phone,
});

type CompleteProfileValues = z.infer<typeof completeProfileSchema>;

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { locale, pendingRole, setPendingRole, setAuthRole } = useAuthStore();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phoneTaken, setPhoneTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const goBack = useSafeBack('/(auth)/welcome');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { phone: '' },
  });

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) {
        router.replace('/(auth)/welcome');
        return;
      }
      setUserId(user.id);
      const name =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null;
      setDisplayName(name);
    });
  }, [router]);

  const role: UserRole = pendingRole === 'partner' ? 'partner' : 'customer';

  const onSubmit = async ({ phone }: CompleteProfileValues) => {
    if (!userId) return;

    setSubmitError(null);
    setPhoneTaken(false);
    setLoading(true);

    try {
      const exists = await phoneProfileExists(phone);

      if (exists) {
        setPhoneTaken(true);
        setLoading(false);
        return;
      }

      const { error } = await upsertProfile(userId, phone, role, displayName);

      if (error) {
        setSubmitError(error.message || t(locale, 'authError'));
        setLoading(false);
        return;
      }

      setAuthRole(role);

      if (role === 'partner') {
        router.replace('/(auth)/signup-partner/basics');
        return;
      }

      router.replace(getTabsRouteForRole('customer'));
    } catch {
      setSubmitError(t(locale, 'authError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <StatusBar style="dark" />
      <Pressable onPress={goBack} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Almost there</Text>
        <Text style={styles.subtitle}>
          {displayName ? `Hi ${displayName.split(' ')[0]}! ` : ''}
          Add your phone number for Nepal payments and pickup updates.
        </Text>
      </View>

      <View style={styles.roleRow}>
        <Pressable
          onPress={() => setPendingRole('customer')}
          style={[styles.roleChip, role === 'customer' && styles.roleChipActive]}>
          <Text style={[styles.roleChipText, role === 'customer' && styles.roleChipTextActive]}>
            I want rescue food
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPendingRole('partner')}
          style={[styles.roleChip, role === 'partner' && styles.roleChipActive]}>
          <Text style={[styles.roleChipText, role === 'partner' && styles.roleChipTextActive]}>
            I run a restaurant
          </Text>
        </Pressable>
      </View>

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

      {phoneTaken ? (
        <View style={styles.inlineError}>
          <Text style={styles.errorText}>This number is already registered</Text>
          <AuthButton
            label="Log in instead"
            variant="secondary"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.altAction}
          />
        </View>
      ) : null}

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

      <AuthButton
        label="Complete account"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        style={styles.submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xxl,
  },
  back: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    width: 40,
  },
  backText: {
    ...Type.h1,
    color: Palette.textPrimary,
  },
  header: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    ...Type.display,
    color: Palette.textPrimary,
  },
  subtitle: {
    ...Type.body,
    color: Palette.textSecondary,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  roleChip: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: Border.width,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.lightGreenBg,
  },
  roleChipText: {
    ...Type.label,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  roleChipTextActive: {
    color: Palette.primaryDark,
  },
  submit: {
    marginTop: Spacing.lg,
  },
  inlineError: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Type.bodyMedium,
    color: Palette.danger,
    textAlign: 'center',
  },
  submitError: {
    ...Type.bodyMedium,
    color: Palette.danger,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  altAction: {
    marginTop: 0,
  },
});
