import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/AuthButton';
import { OtpInput } from '@/components/auth/OtpInput';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { useSafeBack } from '@/hooks/useSafeBack';
import { setAuthPassword } from '@/lib/auth';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSignupStore } from '@/store/useSignupStore';
import type { UserRole } from '@/types/database';

const RESEND_SECONDS = 60;

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
  } = useAuthStore();
  const { customer, partner, signupPassword, setPhoneOtpVerified } =
    useSignupStore();

  const {
    verifyOTP,
    sendOTP,
    loading,
    error,
    setError,
    formatPhone,
  } = usePhoneAuth();

  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
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
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

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

  const handleVerify = useCallback(
    async (otp: string) => {
      if (!phoneDigits || verifyingRef.current) return;
      verifyingRef.current = true;
      setVerifying(true);
      setError(null);

      const result = await verifyOTP(otp, {
        name: displayName,
        phone: phoneDigits,
        email: displayEmail || undefined,
        role: pendingRole || role || 'customer',
      }, { mode });

      if (!result.success) {
        setCode('');
        shakeBoxes();
        verifyingRef.current = false;
        setVerifying(false);
        return;
      }

      if (mode === 'login') {
        if (result.isNewUser || !result.profile) {
          verifyingRef.current = false;
          setVerifying(false);
          Alert.alert(
            'No account found',
            'No account with this number. Would you like to sign up?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign up',
                onPress: () => router.replace('/(auth)/signup-customer/basics'),
              },
            ],
          );
          return;
        }

        const profileRole = (result.profile.role ?? 'customer') as UserRole;
        setAuthRole(profileRole);
        router.replace(
          await resolveAuthenticatedRoute(result.profile.id, profileRole),
        );
        return;
      }

      // Signup — keep multi-step onboarding navigation
      if (signupPassword) {
        const { error: passwordError } = await setAuthPassword(signupPassword);
        if (passwordError) {
          setError(passwordError.message || 'Could not set password.');
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
      displayEmail,
      displayName,
      mode,
      phoneDigits,
      role,
      router,
      setAuthRole,
      setError,
      setPhoneOtpVerified,
      shakeBoxes,
      signupPassword,
      verifyOTP,
    ],
  );

  useEffect(() => {
    if (code.length === 6) {
      void handleVerify(code);
    }
  }, [code, handleVerify]);

  const handleResend = async () => {
    if (secondsLeft > 0 || !phoneDigits) return;
    setError(null);
    const result = await sendOTP(phoneDigits);
    if (result.success) {
      setSecondsLeft(RESEND_SECONDS);
      setCode('');
    }
  };

  if (!phoneDigits) return null;

  const formattedDisplay = formatPhone(phoneDigits);

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
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.wrongNumber}>Wrong number?</Text>
        </Pressable>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }], marginTop: Spacing.xl }}>
          <OtpInput
            value={code}
            onChange={(value) => {
              setError(null);
              setCode(value);
            }}
            error={error && !loading && !verifying ? error : undefined}
          />
        </Animated.View>

        <AuthButton
          label="Verify"
          onPress={() => void handleVerify(code)}
          loading={loading || verifying}
          disabled={code.length !== 6}
          style={styles.verifyBtn}
        />

        <Pressable
          onPress={() => void handleResend()}
          disabled={secondsLeft > 0 || loading}
          style={styles.resend}>
          <Text
            style={[
              styles.resendText,
              secondsLeft > 0 && styles.resendDisabled,
            ]}>
            {secondsLeft > 0
              ? `Resend code in ${secondsLeft}s`
              : 'Resend code →'}
          </Text>
        </Pressable>

        <Text style={styles.expiryHint}>Code expires in 5 minutes</Text>
      </View>
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
    marginTop: Spacing.xxl,
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
    marginTop: 8,
    fontSize: 11,
    color: Palette.textTertiary,
    textAlign: 'center',
  },
});
