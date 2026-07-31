import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthNoAccountPrompt } from '@/components/auth/AuthNoAccountPrompt';
import { OtpInput } from '@/components/auth/OtpInput';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { useSafeBack } from '@/hooks/useSafeBack';
import { setAuthPassword } from '@/lib/auth';
import { friendlyAuthError } from '@/lib/auth/authErrors';
import { markIntentionalSignOut } from '@/lib/auth/signOutIntent';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useSignupStore } from '@/store/useSignupStore';
import type { UserRole } from '@/types/database';

const RESEND_SECONDS = 60;
const OTP_EXPIRY_SECONDS = 300;
const MAX_WRONG_ATTEMPTS = 5;

function formatExpiry(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const {
    pendingPhone,
    pendingRole,
    pendingMode,
    pendingName,
    setAuthRole,
    setPendingMode,
    setPendingPhone,
  } = useAuthStore();
  const {
    customer,
    partner,
    signupPassword,
    setPhoneOtpVerified,
    setCustomer,
    setPartner,
  } = useSignupStore();

  const {
    verifyOTP,
    sendOTP,
    resetOtp,
    loading,
    error,
    setError,
    formatPhone,
  } = usePhoneAuth();

  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [expiryCountdown, setExpiryCountdown] = useState(OTP_EXPIRY_SECONDS);
  const [codeExpired, setCodeExpired] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [noAccount, setNoAccount] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState(false);
  const [otpGeneration, setOtpGeneration] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const verifyingRef = useRef(false);

  const mode = params.mode === 'login' || pendingMode === 'login' ? 'login' : 'signup';
  const role: UserRole = pendingRole === 'partner' ? 'partner' : 'customer';

  const displayName =
    pendingName?.trim() ||
    (role === 'partner' ? partner.ownerName : customer.fullName) ||
    'Customer';

  const displayEmail =
    role === 'partner' ? partner.email : customer.email;

  const phoneDigits = pendingPhone || (role === 'partner' ? partner.phone : customer.phone);

  const signupBasicsPath =
    role === 'partner'
      ? '/(auth)/signup-partner/basics'
      : '/(auth)/signup-customer/basics';

  const goBack = useSafeBack(mode === 'signup' ? signupBasicsPath : '/(auth)/login');
  const maxAttemptsReached = wrongAttempts >= MAX_WRONG_ATTEMPTS;
  const canResend = (secondsLeft <= 0 || codeExpired || maxAttemptsReached) && !loading;

  useEffect(() => {
    if (params.mode === 'login' || params.mode === 'signup') {
      setPendingMode(params.mode);
    }
  }, [params.mode, setPendingMode]);

  useEffect(() => {
    if (!phoneDigits) {
      router.replace(mode === 'signup' ? signupBasicsPath : '/(auth)/login');
    }
  }, [mode, phoneDigits, router, signupBasicsPath]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    if (codeExpired || maxAttemptsReached) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, codeExpired, maxAttemptsReached]);

  useEffect(() => {
    setExpiryCountdown(OTP_EXPIRY_SECONDS);
    setCodeExpired(false);
    const timer = setInterval(() => {
      setExpiryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCodeExpired(true);
          setError('Code expired. Please request a new one.');
          setCode('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpGeneration, setError]);

  const shakeBoxes = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const resetTimersAfterResend = () => {
    setSecondsLeft(RESEND_SECONDS);
    setWrongAttempts(0);
    setCode('');
    setError(null);
    setOtpGeneration((g) => g + 1);
  };

  const navigateExistingUser = useCallback(
    async (profile: { id: string; role: string | null }, showWelcome: boolean) => {
      const profileRole = (profile.role ?? 'customer') as UserRole;
      setAuthRole(profileRole);
      if (showWelcome) {
        setWelcomeToast(true);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      router.replace(await resolveAuthenticatedRoute(profile.id, profileRole));
    },
    [router, setAuthRole],
  );

  const handleVerify = useCallback(
    async (otp: string) => {
      if (!phoneDigits || verifyingRef.current || noAccount) return;
      if (codeExpired || maxAttemptsReached) {
        setError(
          maxAttemptsReached
            ? 'Too many wrong attempts. Please request a new code.'
            : 'Code expired. Please request a new one.',
        );
        return;
      }

      verifyingRef.current = true;
      setVerifying(true);
      setError(null);

      const result = await verifyOTP(
        otp,
        {
          name: displayName,
          phone: phoneDigits,
          email: displayEmail || undefined,
          role: pendingRole || role || 'customer',
        },
        { mode },
      );

      if (!result.success) {
        setCode('');
        shakeBoxes();
        verifyingRef.current = false;
        setVerifying(false);

        if (result.kind === 'expired') {
          setCodeExpired(true);
          setError('Code expired. Please request a new one.');
          return;
        }

        if (result.kind === 'max_attempts') {
          setWrongAttempts(MAX_WRONG_ATTEMPTS);
          setError('Too many wrong attempts. Please request a new code.');
          setSecondsLeft(0);
          return;
        }

        if (result.kind === 'network') {
          setError(
            'No internet connection. Please check your connection and try again.',
          );
          return;
        }

        if (result.kind === 'invalid' || result.kind === 'other') {
          const nextAttempts = wrongAttempts + 1;
          setWrongAttempts(nextAttempts);
          if (nextAttempts >= MAX_WRONG_ATTEMPTS) {
            setError('Too many wrong attempts. Please request a new code.');
            setSecondsLeft(0);
          } else {
            const remaining = MAX_WRONG_ATTEMPTS - nextAttempts;
            setError(`Wrong code. Please try again.\n${remaining} attempt${remaining === 1 ? '' : 's'} remaining`);
          }
          return;
        }

        setError(result.error || friendlyAuthError(result.error));
        return;
      }

      // Existing account — sign them in (login or accidental signup with existing phone)
      if ('profile' in result && result.profile && !result.isNewUser) {
        verifyingRef.current = false;
        setVerifying(false);
        await navigateExistingUser(result.profile, true);
        return;
      }

      if (mode === 'login') {
        verifyingRef.current = false;
        setVerifying(false);
        setCode('');
        setNoAccount(true);
        return;
      }

      // Signup — continue onboarding for brand-new users
      if (signupPassword) {
        const { error: passwordError } = await setAuthPassword(signupPassword);
        if (passwordError) {
          setError(friendlyAuthError(passwordError, 'Could not set password.'));
          verifyingRef.current = false;
          setVerifying(false);
          return;
        }
      }

      setPhoneOtpVerified(true);

      if (role === 'partner') {
        router.replace('/(auth)/signup-partner/business');
      } else {
        router.replace('/(auth)/signup-customer/location');
      }
    },
    [
      codeExpired,
      displayEmail,
      displayName,
      maxAttemptsReached,
      mode,
      navigateExistingUser,
      noAccount,
      phoneDigits,
      pendingRole,
      role,
      router,
      setError,
      setPhoneOtpVerified,
      shakeBoxes,
      signupPassword,
      verifyOTP,
      wrongAttempts,
    ],
  );

  useEffect(() => {
    if (code.length === 6 && !noAccount) {
      void handleVerify(code);
    }
  }, [code, handleVerify, noAccount]);

  const handleResend = async () => {
    if (!canResend || !phoneDigits) return;
    setError(null);
    const result = await sendOTP(phoneDigits);
    if (result.success) {
      resetTimersAfterResend();
      return;
    }
    if (result.kind === 'rate_limit') {
      setError(result.error);
      if (result.retryAfterSeconds) {
        setSecondsLeft(Math.min(result.retryAfterSeconds, 3600));
      }
      return;
    }
    setError(result.error);
  };

  const handleSignUpWithNumber = async () => {
    if (!phoneDigits) return;
    setCustomer({ phone: phoneDigits });
    setPartner({ phone: phoneDigits, businessPhone: phoneDigits });
    setPendingPhone(phoneDigits);
    setPendingMode('signup');
    setNoAccount(false);
    router.replace('/(auth)/signup-customer/basics');
  };

  const handleTryDifferentNumber = async () => {
    markIntentionalSignOut();
    resetOtp();
    await supabase.auth.signOut();
    setAuthRole(null);
    setNoAccount(false);
    router.replace('/(auth)/login');
  };

  if (!phoneDigits) return null;

  const formattedDisplay = formatPhone(phoneDigits);
  const otpErrorText =
    error && !loading && !verifying
      ? error.split('\n')[0]
      : undefined;
  const attemptsLine =
    error && error.includes('attempt') ? error.split('\n')[1] : null;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={goBack} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={22} color={Palette.white} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.headerTitle}>Verify your number 📱</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sentLabel}>We sent a 6-digit code to</Text>
        <Text style={styles.phoneText}>{formattedDisplay}</Text>
        <Pressable onPress={() => void handleTryDifferentNumber()} hitSlop={8}>
          <Text style={styles.wrongNumber}>Wrong number?</Text>
        </Pressable>

        {noAccount ? (
          <AuthNoAccountPrompt
            title="No account found for this number."
            body="This phone isn’t registered yet. You can sign up with it or try a different number."
            primaryLabel="Sign up with this number →"
            secondaryLabel="Try different number"
            onPrimary={() => void handleSignUpWithNumber()}
            onSecondary={() => void handleTryDifferentNumber()}
          />
        ) : (
          <>
            <Animated.View
              style={{ transform: [{ translateX: shakeAnim }], marginTop: Spacing.xl }}>
              <OtpInput
                value={code}
                onChange={(value) => {
                  setError(null);
                  setCode(value);
                }}
                error={otpErrorText}
              />
            </Animated.View>

            {attemptsLine ? <Text style={styles.attemptsText}>{attemptsLine}</Text> : null}

            <Text
              style={[
                styles.expiryHint,
                expiryCountdown <= 60 && styles.expiryUrgent,
              ]}>
              {codeExpired
                ? 'Code expired. Please request a new one.'
                : `Code expires in ${formatExpiry(expiryCountdown)}`}
            </Text>

            <AuthButton
              label="Verify"
              onPress={() => void handleVerify(code)}
              loading={loading || verifying}
              disabled={code.length !== 6 || codeExpired || maxAttemptsReached}
              style={styles.verifyBtn}
            />

            <Pressable
              onPress={() => void handleResend()}
              disabled={!canResend}
              style={styles.resend}>
              <Text style={[styles.resendText, !canResend && styles.resendDisabled]}>
                {!canResend && secondsLeft > 0 && !codeExpired && !maxAttemptsReached
                  ? `Resend code in ${secondsLeft}s`
                  : 'Resend code →'}
              </Text>
            </Pressable>

            {error && error.toLowerCase().includes('internet') ? (
              <Pressable
                onPress={() => void handleVerify(code)}
                style={styles.retryNet}>
                <Text style={styles.retryNetText}>Try again →</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      <SuccessToast
        visible={welcomeToast}
        title="Welcome back! 👋"
        onHide={() => setWelcomeToast(false)}
        durationMs={2000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  backBtnPlaceholder: {
    width: 40,
  },
  headerTitle: {
    ...Type.h2,
    color: Palette.white,
    fontWeight: '700',
    fontSize: 20,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  sentLabel: {
    ...Type.body,
    color: Palette.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  phoneText: {
    marginTop: Spacing.sm,
    fontSize: 18,
    fontWeight: '700',
    color: Palette.primary,
    textAlign: 'center',
  },
  wrongNumber: {
    marginTop: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  verifyBtn: {
    marginTop: Spacing.xl,
  },
  resend: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  resendText: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '600',
  },
  resendDisabled: {
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  expiryHint: {
    marginTop: Spacing.md,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  expiryUrgent: {
    color: '#DC2626',
    fontWeight: '700',
  },
  attemptsText: {
    marginTop: 6,
    fontSize: 13,
    color: Palette.dangerText,
    textAlign: 'center',
  },
  retryNet: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  retryNetText: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '700',
  },
});
