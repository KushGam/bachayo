import { Lock } from 'lucide-react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthScreenHeader } from '@/components/auth/AuthScreenHeader';
import { PasswordField } from '@/components/auth/PasswordField';
import { Screen } from '@/components/Screen';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { navigateAfterPasswordSignIn } from '@/lib/auth';
import { friendlyAuthError, isNetworkError } from '@/lib/auth/authErrors';
import { hapticSuccess } from '@/lib/haptics';
import { passwordField } from '@/lib/validation/auth';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

const schema = z
  .object({
    password: passwordField,
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

function firstParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) {
    return value[0].trim();
  }
  return undefined;
}

function strengthLabel(password: string) {
  if (password.length === 0) return null;
  if (password.length < 8) return { label: 'Too short', color: Palette.danger };
  const score =
    (password.length >= 10 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  if (score >= 3) return { label: 'Strong', color: Palette.success };
  if (score >= 1) return { label: 'Good', color: Palette.warning };
  return { label: 'Okay', color: Palette.textSecondary };
}

/**
 * Deep-link password reset (email → https://lastbag.app/reset-password?token=…).
 * In-app OTP reset stays at /(auth)/reset-password.
 */
export default function DeepLinkResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[]; email?: string | string[] }>();
  const token = firstParam(params.token);
  const email = firstParam(params.email);
  const setAuthRole = useAuthStore((s) => s.setAuthRole);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  });

  const passwordValue = form.watch('password');
  const strength = useMemo(() => strengthLabel(passwordValue), [passwordValue]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!token) {
        router.replace('/(auth)/forgot-password');
        return;
      }

      try {
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session?.user) {
          if (!cancelled) {
            setSessionReady(true);
            setReady(true);
          }
          return;
        }

        // Prefer email + OTP token ({{ .Token }} + {{ .Email }}).
        if (email) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery',
          });
          if (otpError) throw otpError;
        } else {
          // Fallback: template used {{ .TokenHash }} as ?token=
          const { error: hashError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          });
          if (hashError) throw hashError;
        }

        if (!cancelled) {
          setSessionReady(true);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            friendlyAuthError(
              err,
              'This reset link is invalid or expired. Request a new one.',
            ),
          );
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, router, token]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!sessionReady) {
      setError('This reset link is invalid or expired. Request a new one.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (updateError) throw updateError;

      void hapticSuccess();

      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (userId) {
        const nav = await navigateAfterPasswordSignIn(router, setAuthRole, userId);
        if (nav.ok) return;
      }

      router.replace('/(auth)/login');
    } catch (err) {
      setError(
        friendlyAuthError(
          err,
          isNetworkError(err)
            ? 'No internet connection. Please check your connection and try again.'
            : 'Could not update password.',
        ),
      );
    } finally {
      setLoading(false);
    }
  });

  if (!ready) {
    return (
      <Screen contentContainerStyle={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingWrap}>
          <View style={styles.loadingIcon}>
            <Lock size={22} color={Palette.primary} strokeWidth={2.2} />
          </View>
          <Text style={styles.loading}>Preparing secure reset…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <StatusBar style="dark" />

      <AuthScreenHeader
        title="Reset password"
        subtitle="Enter your new LastBag password"
        onBack={() => router.replace('/(auth)/welcome')}
      />

      <AuthFormCard>
        {!sessionReady && error ? <AuthErrorBanner message={error} /> : null}

        {sessionReady ? (
          <>
            <Controller
              control={form.control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <PasswordField
                  label="New password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="At least 8 characters"
                  autoComplete="password-new"
                  error={form.formState.errors.password?.message}
                />
              )}
            />
            {strength ? (
              <Text style={[styles.strength, { color: strength.color }]}>
                Strength: {strength.label}
              </Text>
            ) : null}
            <Controller
              control={form.control}
              name="confirm"
              render={({ field: { value, onChange, onBlur } }) => (
                <PasswordField
                  label="Confirm password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Repeat new password"
                  autoComplete="password-new"
                  error={form.formState.errors.confirm?.message}
                />
              )}
            />
            {error ? <AuthErrorBanner message={error} /> : null}
            <AuthButton
              label="Update password"
              onPress={onSubmit}
              loading={loading}
              style={styles.submit}
            />
          </>
        ) : (
          <AuthButton
            label="Request a new code"
            onPress={() => router.replace('/(auth)/forgot-password')}
            style={styles.submit}
          />
        )}
      </AuthFormCard>

      <Pressable onPress={() => router.replace('/(auth)/welcome')} style={styles.cancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xxl,
  },
  submit: {
    marginTop: Spacing.sm,
  },
  strength: {
    ...Type.label,
    fontWeight: '600',
    marginTop: -4,
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
    gap: Spacing.md,
  },
  loadingIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  cancel: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    ...Type.label,
    color: Palette.textSecondary,
  },
});
