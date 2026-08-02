import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { AuthAccountExistsBanner } from '@/components/auth/AuthAccountExistsBanner';
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
import { Spacing } from '@/constants/theme';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { useSafeBack } from '@/hooks/useSafeBack';
import {
  emailProfileExists,
  fetchUserRole,
  navigateAfterGoogleSignIn,
  phoneProfileExists,
} from '@/lib/auth';
import {
  friendlyAuthError,
  friendlyGoogleSignInError,
  isEmailAlreadyRegisteredError,
  isNetworkError,
} from '@/lib/auth/authErrors';
import { markIntentionalSignOut } from '@/lib/auth/signOutIntent';
import { hapticStepAdvance } from '@/lib/haptics';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { recordTermsAcceptance } from '@/lib/terms';
import { clearPushTokenForCurrentUser } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { partnerBasicsSchema, type PartnerBasicsValues } from '@/lib/validation/signup';
import { useAuthStore } from '@/store/useAuthStore';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 5;

export default function PartnerBasicsScreen() {
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
    partner,
    setPartner,
    setPartnerAuthMethod,
    setSignupPassword,
    setOtpSentForPhone,
    termsAccepted,
    setTermsAccepted,
  } = useSignupStore();
  const {
    sendOTP,
    loading: phoneLoading,
  } = usePhoneAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [checking, setChecking] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingGoogleUserId, setPendingGoogleUserId] = useState<string | null>(null);

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
    if (!termsAccepted) {
      Alert.alert(
        'Please accept terms',
        'You must agree to our Terms of Service and Privacy Policy to continue.',
      );
      return;
    }

    setSubmitError(null);
    setEmailExists(false);
    setChecking(true);

    try {
      if (values.authMethod === 'email') {
        try {
          const exists = await emailProfileExists(values.email);
          if (exists) {
            setEmailExists(true);
            setChecking(false);
            return;
          }
        } catch (err) {
          if (isEmailAlreadyRegisteredError(err)) {
            setEmailExists(true);
            setChecking(false);
            return;
          }
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

        const result = await sendOTP(values.phone);
        if (!result.success) {
          setSubmitError(
            result.error ||
              friendlyAuthError(result.error, 'Could not send verification code.'),
          );
          setChecking(false);
          return;
        }

        setOtpSentForPhone(values.phone);
        await hapticStepAdvance();
        router.push('/(auth)/verify-phone' as never);
        return;
      }

      await hapticStepAdvance();
      router.push('/(auth)/signup-partner/business');
    } catch (err) {
      if (isEmailAlreadyRegisteredError(err)) {
        setEmailExists(true);
      } else {
        setSubmitError(
          friendlyAuthError(
            err,
            isNetworkError(err)
              ? 'No internet connection. Please check your connection and try again.'
              : 'Something went wrong. Please try again.',
          ),
        );
      }
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
    setPendingRole('partner');

    try {
      const result = await navigateAfterGoogleSignIn(router, setAuthRole);
      if (!result.ok) {
        if (result.expoGo || result.cancelled) return;
        setSubmitError(friendlyGoogleSignInError('failed'));
        return;
      }
      if (result.needsTerms) {
        setPendingGoogleUserId(result.userId);
        setShowTermsModal(true);
      }
    } catch (err) {
      console.error('[Google] Sign-in failed:', err);
      Alert.alert('Couldn’t sign in with Google', friendlyGoogleSignInError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
    <SignupStepShell
      currentStep={1}
      totalSteps={TOTAL_STEPS}
      title="Tell us about you"
      subtitle="Set up your partner account"
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

      <SignupFieldGroup
        label="Sign-in details"
        hint={
          authMethod === 'phone'
            ? 'We’ll text a one-time code next'
            : 'We’ll email a verification code on the last step'
        }
        required>
        <AuthFormCard style={styles.cardCompact}>
          {authMethod === 'email' ? (
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormField
                  label="Email"
                  value={value}
                  onChangeText={(text) => {
                    setEmailExists(false);
                    onChange(text);
                  }}
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

          {emailExists && authMethod === 'email' ? (
            <AuthAccountExistsBanner onGoToLogin={() => router.push('/(auth)/login')} />
          ) : null}

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
        setPendingRole('partner');
        const role = await fetchUserRole(pendingGoogleUserId);
        setAuthRole(role ?? 'partner');
        router.replace(
          role === 'partner'
            ? await resolveAuthenticatedRoute(pendingGoogleUserId, 'partner')
            : '/(auth)/complete-profile',
        );
      }}
      onCancel={async () => {
        setShowTermsModal(false);
        setPendingGoogleUserId(null);
          markIntentionalSignOut();
          await clearPushTokenForCurrentUser();
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
});
