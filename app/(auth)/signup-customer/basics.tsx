import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { useSafeBack } from '@/hooks/useSafeBack';
import {
  emailProfileExists,
  fetchUserRole,
  navigateAfterGoogleSignIn,
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
  } = usePhoneAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [checking, setChecking] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingGoogleUserId, setPendingGoogleUserId] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(customer.avatarUri);

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

  const pickAvatar = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow access to add a profile photo.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });

    if (result.canceled || !result.assets[0]) return;
    setAvatarUri(result.assets[0].uri);
  };

  const showAvatarActions = () => {
    const hasPhoto = Boolean(avatarUri);
    const options = ['Take photo', 'Choose from library'];
    if (hasPhoto) options.push('Remove photo');
    options.push('Cancel');

    const handleSelection = (index: number) => {
      if (index === 0) void pickAvatar('camera');
      else if (index === 1) void pickAvatar('library');
      else if (hasPhoto && index === 2) setAvatarUri(null);
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: hasPhoto ? 2 : undefined,
        },
        handleSelection,
      );
      return;
    }

    Alert.alert('Profile photo', undefined, [
      { text: 'Take photo', onPress: () => void pickAvatar('camera') },
      { text: 'Choose from library', onPress: () => void pickAvatar('library') },
      ...(hasPhoto
        ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => setAvatarUri(null) }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

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
    setPhoneExists(false);
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
          // RPC may not be deployed yet — allow signup to continue.
        }
      }

      setCustomerAuthMethod(values.authMethod);
      setSignupPassword(values.password);
      setCustomer({
        fullName: values.fullName,
        email: (values.email ?? '').trim(),
        phone: values.phone,
        avatarUri,
      });

      if (values.authMethod === 'phone') {
        setPendingPhone(values.phone);
        setPendingMode('signup');
        setPendingRole('customer');
        setPendingName(values.fullName);

        const result = await sendOTP(values.phone, 'signup');
        if (!result.success) {
          if ('accountExists' in result && result.accountExists) {
            setPhoneExists(true);
            setChecking(false);
            return;
          }
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
      router.push('/(auth)/signup-customer/location');
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
    setPendingRole('customer');

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
            <View style={styles.avatarRow}>
              <Pressable
                onPress={showAvatarActions}
                style={styles.avatarTap}
                accessibilityRole="button"
                accessibilityLabel="Add profile photo">
                <View style={styles.avatarCircle}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <UserRound size={28} color={Palette.textTertiary} strokeWidth={1.75} />
                  )}
                </View>
                <View style={styles.avatarBadge}>
                  <Camera size={12} color={Palette.white} strokeWidth={2.25} />
                </View>
              </Pressable>
              <View style={styles.avatarCopy}>
                <Text style={styles.avatarTitle}>Profile photo</Text>
                <Text style={styles.avatarHint}>Optional — helps partners recognize you</Text>
                <Pressable onPress={showAvatarActions} hitSlop={8}>
                  <Text style={styles.avatarAction}>
                    {avatarUri ? 'Change photo' : 'Add photo'}
                  </Text>
                </Pressable>
              </View>
            </View>

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
                    value={value ?? ''}
                    onChangeText={(text) => {
                      setEmailExists(false);
                      onChange(text);
                    }}
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

            {emailExists && authMethod === 'email' ? (
              <AuthAccountExistsBanner onGoToLogin={() => router.push('/(auth)/login')} />
            ) : null}

            {phoneExists && authMethod === 'phone' ? (
              <AuthAccountExistsBanner
                channel="phone"
                onGoToLogin={() => router.push('/(auth)/login')}
              />
            ) : null}

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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarTap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Palette.white,
  },
  avatarCopy: {
    flex: 1,
    gap: 2,
  },
  avatarTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  avatarHint: {
    ...Type.caption,
    color: Palette.textTertiary,
    marginBottom: 4,
  },
  avatarAction: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
  fieldHint: {
    ...Type.caption,
    color: Palette.textTertiary,
    marginTop: -Spacing.sm,
    fontWeight: '500',
  },
});
