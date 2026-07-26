import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFormCard } from '@/components/auth/AuthFormCard';
import { AuthMethodToggle } from '@/components/auth/AuthMethodToggle';
import { FormField } from '@/components/auth/FormField';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PasswordField } from '@/components/auth/PasswordField';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { SignupFieldGroup } from '@/components/auth/SignupFieldGroup';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { TermsAcceptanceModal } from '@/components/auth/TermsAcceptanceModal';
import { TermsCheckbox } from '@/components/auth/TermsCheckbox';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import { useSafeBack } from '@/hooks/useSafeBack';
import {
  emailProfileExists,
  fetchUserRole,
  navigateAfterGoogleSignIn,
  phoneProfileExists,
} from '@/lib/auth';
import { hapticStepAdvance } from '@/lib/haptics';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { recordTermsAcceptance } from '@/lib/terms';
import { supabase } from '@/lib/supabase';
import { customerBasicsSchema, type CustomerBasicsValues } from '@/lib/validation/signup';
import { useAuthStore } from '@/store/useAuthStore';
import { useSignupStore } from '@/store/useSignupStore';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';

const TOTAL_STEPS = 4;

export default function CustomerBasicsScreen() {
  const router = useRouter();
  const goBack = useSafeBack('/(auth)/welcome');
  const {
    setPendingPhone,
    setPendingMode,
    setPendingRole,
    setPendingName,
    setAuthRole,
  } = useAuthStore();
  const {
    customer,
    setCustomer,
    setCustomerAuthMethod,
    setSignupPassword,
    setOtpSentForPhone,
    termsAccepted,
    setTermsAccepted,
  } = useSignupStore();
  const {
    sendOTP,
    loading: phoneLoading,
    error: phoneAuthError,
  } = useFirebasePhoneAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingGoogleUserId, setPendingGoogleUserId] = useState<string | null>(null);

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

        const result = await sendOTP(values.phone);
        if (!result.success) {
          setSubmitError(result.error || phoneAuthError || 'Could not send verification code.');
          setChecking(false);
          return;
        }

        setOtpSentForPhone(values.phone);
        await hapticStepAdvance();
        router.push('/(auth)/verify-phone' as never);
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

  const handleGoogleSignIn = async () => {
    if (!termsAccepted) {
      Alert.alert(
        'Please accept terms',
        'You must agree to our Terms of Service and Privacy Policy to continue.',
      );
      return;
    }

    setSubmitError(null);
    setGoogleLoading(true);
    setPendingRole('customer');

    try {
      const result = await navigateAfterGoogleSignIn(router, setAuthRole);
      if (!result.ok) {
        if (result.expoGo || result.cancelled) return;
        setSubmitError('Google Sign-In failed. Please try again or use phone/email.');
        return;
      }
      if (result.needsTerms) {
        setPendingGoogleUserId(result.userId);
        setShowTermsModal(true);
      }
    } catch {
      Alert.alert('Error', 'Google Sign-In failed. Please try phone or email instead.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <SignupStepShell
        currentStep={1}
        totalSteps={TOTAL_STEPS}
        title="Let's get you set up"
        subtitle="Create your account in a few quick steps"
        showBack
        onBack={goBack}
        onContinue={onContinue}
        continueLabel={authMethod === 'phone' ? 'Send verification code →' : 'Continue'}
        continueDisabled={!isValid || checking || phoneLoading || !termsAccepted}
        continueLoading={checking || phoneLoading}
        secondaryAction={
          <View style={styles.googleBlock}>
            <GoogleSignInButton
              label="Continue with Google"
              onPress={() => void handleGoogleSignIn()}
              loading={googleLoading}
            />
            <AuthDivider />
          </View>
        }>
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
                      showHelper={false}
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
                      label="Email (optional — for receipts)"
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

      <TermsAcceptanceModal
        visible={showTermsModal}
        onAccept={async () => {
          if (!pendingGoogleUserId) return;
          const { error } = await recordTermsAcceptance(pendingGoogleUserId);
          if (error) {
            Alert.alert('Could not save', error.message);
            return;
          }
          setShowTermsModal(false);
          const role = await fetchUserRole(pendingGoogleUserId);
          setAuthRole(role ?? 'customer');
          router.replace(await resolveAuthenticatedRoute(pendingGoogleUserId, role ?? 'customer'));
        }}
        onCancel={async () => {
          setShowTermsModal(false);
          setPendingGoogleUserId(null);
          await supabase.auth.signOut();
          Alert.alert('Sign-in cancelled', 'You must accept the terms to use LastBag.');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cardCompact: {
    marginBottom: 0,
  },
  googleBlock: {
    gap: Spacing.sm,
  },
  fieldHint: {
    ...Type.caption,
    color: Palette.textTertiary,
    marginTop: -Spacing.sm,
    fontWeight: '500',
  },
});
