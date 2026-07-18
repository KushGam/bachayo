import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text } from 'react-native';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthMethodToggle } from '@/components/auth/AuthMethodToggle';
import { FormField } from '@/components/auth/FormField';
import { PasswordField } from '@/components/auth/PasswordField';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { SignupFieldGroup } from '@/components/auth/SignupFieldGroup';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { TermsCheckbox } from '@/components/auth/TermsCheckbox';
import { useSafeBack } from '@/hooks/useSafeBack';
import { emailProfileExists, phoneProfileExists, sendPhoneOtp } from '@/lib/auth';
import { hapticStepAdvance } from '@/lib/haptics';
import { customerBasicsSchema, type CustomerBasicsValues } from '@/lib/validation/signup';
import { useAuthStore } from '@/store/useAuthStore';
import { useSignupStore } from '@/store/useSignupStore';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';

const TOTAL_STEPS = 4;

export default function CustomerBasicsScreen() {
  const router = useRouter();
  const goBack = useSafeBack('/(auth)/welcome');
  const { setPendingPhone, setPendingMode, setPendingRole, setPendingName } = useAuthStore();
  const {
    customer,
    setCustomer,
    setCustomerAuthMethod,
    setSignupPassword,
    setOtpSentForPhone,
    termsAccepted,
    setTermsAccepted,
  } = useSignupStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<CustomerBasicsValues>({
    resolver: zodResolver(customerBasicsSchema),
    mode: 'onChange',
    defaultValues: {
      authMethod: 'phone',
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      password: '',
      confirmPassword: '',
    },
  });

  const authMethod = watch('authMethod');

  const onContinue = handleSubmit(async (values) => {
    if (!termsAccepted) {
      Alert.alert(
        'Please accept terms',
        'You must agree to our Terms of Service and Privacy Policy to continue.',
      );
      return;
    }

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

      setCustomerAuthMethod(values.authMethod);
      setSignupPassword(values.password);
      setCustomer({
        fullName: values.fullName,
        email: (values.email ?? '').trim(),
        phone: values.phone,
      });

      if (values.authMethod === 'phone') {
        setPendingPhone(values.phone);
        setPendingMode('signup');
        setPendingRole('customer');
        setPendingName(values.fullName);

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
          params: { mode: 'signup', role: 'customer', name: values.fullName },
        });
        return;
      }

      await hapticStepAdvance();
      router.push('/(auth)/signup-customer/location');
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
      title="Let's get you set up"
      subtitle="Create your account in a few quick steps"
      showBack
      onBack={goBack}
      onContinue={onContinue}
      continueDisabled={!isValid || checking || !termsAccepted}
      continueLoading={checking}>
      <Controller
        control={control}
        name="authMethod"
        render={({ field: { value, onChange } }) => (
          <AuthMethodToggle value={value} onChange={onChange} />
        )}
      />

      <SignupFieldGroup label="About you" required>
        <AuthFormCard style={styles.cardCompact}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange, onBlur } }) => (
              <FormField
                label="Full name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Your name"
                autoCapitalize="words"
                error={errors.fullName?.message}
              />
            )}
          />
        </AuthFormCard>
      </SignupFieldGroup>

      <SignupFieldGroup
        label="Sign-in details"
        hint="How you'll log in to LastBag"
        required>
        <AuthFormCard style={styles.cardCompact}>
          {authMethod === 'email' ? (
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormField
                  label="Email"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="you@email.com"
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
                <>
                  <PhoneInput
                    label="Phone (optional)"
                    value={value}
                    onChange={onChange}
                    placeholder="98XXXXXXXX"
                    error={errors.phone?.message}
                  />
                  <Text style={styles.fieldHint}>For pickup updates</Text>
                </>
              )}
            />
          ) : (
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <>
                  <FormField
                    label="Email (optional)"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="you@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email?.message}
                  />
                  <Text style={styles.fieldHint}>We&apos;ll send your receipts here</Text>
                </>
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

      <TermsCheckbox
        accepted={termsAccepted}
        onToggle={() => setTermsAccepted(!termsAccepted)}
      />
    </SignupStepShell>
  );
}

const styles = StyleSheet.create({
  cardCompact: {
    marginBottom: 0,
  },
  fieldHint: {
    ...Type.caption,
    color: Palette.textTertiary,
    marginTop: -Spacing.sm,
    fontWeight: '500',
  },
});
