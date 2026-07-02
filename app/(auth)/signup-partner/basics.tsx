import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthMethodToggle } from '@/components/auth/AuthMethodToggle';
import { FormField } from '@/components/auth/FormField';
import { PasswordField } from '@/components/auth/PasswordField';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { SignupFieldGroup } from '@/components/auth/SignupFieldGroup';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { useSafeBack } from '@/hooks/useSafeBack';
import { emailProfileExists, phoneProfileExists, sendPhoneOtp } from '@/lib/auth';
import { hapticStepAdvance } from '@/lib/haptics';
import { partnerBasicsSchema, type PartnerBasicsValues } from '@/lib/validation/signup';
import { useAuthStore } from '@/store/useAuthStore';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 5;

export default function PartnerBasicsScreen() {
  const router = useRouter();
  const goBack = useSafeBack('/(auth)/welcome');
  const { setPendingPhone, setPendingMode, setPendingRole, setPendingName } = useAuthStore();
  const { partner, setPartner, setPartnerAuthMethod, setSignupPassword, setOtpSentForPhone } =
    useSignupStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<PartnerBasicsValues>({
    resolver: zodResolver(partnerBasicsSchema),
    mode: 'onChange',
    defaultValues: {
      authMethod: 'phone',
      ownerName: partner.ownerName,
      email: partner.email,
      phone: partner.phone,
      password: '',
      confirmPassword: '',
    },
  });

  const authMethod = watch('authMethod');

  const onContinue = handleSubmit(async (values) => {
    setSubmitError(null);
    setChecking(true);

    try {
      if (values.authMethod === 'email') {
        try {
          const exists = await emailProfileExists(values.email);
          if (exists) {
            setSubmitError('This email is already registered. Try logging in instead.');
            setChecking(false);
            return;
          }
        } catch {
          // RPC may not be deployed yet — allow signup to continue.
        }
      } else {
        try {
          const exists = await phoneProfileExists(values.phone);
          if (exists) {
            setSubmitError('This number is already registered. Try logging in instead.');
            setChecking(false);
            return;
          }
        } catch {
          // RPC may not be deployed yet — allow signup to continue.
        }
      }

      setPartnerAuthMethod(values.authMethod);
      setSignupPassword(values.password);
      setPartner({
        ownerName: values.ownerName,
        email: (values.email ?? '').trim(),
        phone: values.phone,
        businessPhone: values.phone,
      });

      if (values.authMethod === 'phone') {
        setPendingPhone(values.phone);
        setPendingMode('signup');
        setPendingRole('partner');
        setPendingName(values.ownerName);

        const { error: otpError } = await sendPhoneOtp(values.phone);
        if (otpError) {
          setSubmitError(otpError.message || 'Could not send verification code.');
          setChecking(false);
          return;
        }

        setOtpSentForPhone(values.phone);
        await hapticStepAdvance();
        router.push({
          pathname: '/(auth)/verify',
          params: { mode: 'signup', role: 'partner', name: values.ownerName },
        });
        return;
      }

      await hapticStepAdvance();
      router.push('/(auth)/signup-partner/business');
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setChecking(false);
    }
  });

  return (
    <SignupStepShell
      currentStep={1}
      totalSteps={TOTAL_STEPS}
      title="Tell us about you"
      subtitle="Set up your partner account"
      showBack
      onBack={goBack}
      onContinue={onContinue}
      continueDisabled={!isValid || checking}
      continueLoading={checking}>
      <Controller
        control={control}
        name="authMethod"
        render={({ field: { value, onChange } }) => (
          <AuthMethodToggle value={value} onChange={onChange} />
        )}
      />

      <SignupFieldGroup label="Owner details" required>
        <AuthFormCard style={styles.cardCompact}>
          <Controller
            control={control}
            name="ownerName"
            render={({ field: { value, onChange, onBlur } }) => (
              <FormField
                label="Owner full name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Your name"
                autoCapitalize="words"
                error={errors.ownerName?.message}
              />
            )}
          />
        </AuthFormCard>
      </SignupFieldGroup>

      <SignupFieldGroup label="Sign-in details" hint="How you'll manage your restaurant" required>
        <AuthFormCard style={styles.cardCompact}>
          {authMethod === 'email' ? (
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormField
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="you@restaurant.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />
          ) : (
            <Controller
              control={control}
              name="phone"
              render={({ field: { value, onChange } }) => (
                <PhoneInput
                  label="Phone number"
                  value={value}
                  onChange={onChange}
                  placeholder="98XXXXXXXX"
                  error={errors.phone?.message}
                />
              )}
            />
          )}

          {authMethod === 'email' ? (
            <Controller
              control={control}
              name="phone"
              render={({ field: { value, onChange } }) => (
                <PhoneInput
                  label="Business phone"
                  value={value}
                  onChange={onChange}
                  placeholder="98XXXXXXXX"
                  error={errors.phone?.message}
                />
              )}
            />
          ) : (
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormField
                  label="Business email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="you@restaurant.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />
          )}
        </AuthFormCard>
      </SignupFieldGroup>

      <SignupFieldGroup label="Security" hint="At least 8 characters" required>
        <AuthFormCard style={styles.cardCompact}>
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <PasswordField
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoComplete="password-new"
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <PasswordField
                label="Confirm password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Re-enter your password"
                autoComplete="password-new"
                error={errors.confirmPassword?.message}
              />
            )}
          />
        </AuthFormCard>
      </SignupFieldGroup>

      {submitError ? <AuthErrorBanner message={submitError} /> : null}
    </SignupStepShell>
  );
}

const styles = StyleSheet.create({
  cardCompact: {
    marginBottom: 0,
  },
});
