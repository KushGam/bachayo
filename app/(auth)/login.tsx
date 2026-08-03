import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowRight,
  ChevronLeft,
  KeyRound,
  Lock,
  Smartphone,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthNoAccountPrompt } from '@/components/auth/AuthNoAccountPrompt';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { RememberMeToggle } from '@/components/auth/RememberMeToggle';
import { TermsAcceptanceModal } from '@/components/auth/TermsAcceptanceModal';
import { LastBagLogo } from '@/components/LastBagLogo';
import { Palette } from '@/constants/Colors';
import { t } from '@/constants/i18n';
import { CardChrome, Motion, Radius, Spacing, Type } from '@/constants/theme';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { useSafeBack } from '@/hooks/useSafeBack';
import {
  fetchUserRole,
  navigateAfterGoogleSignIn,
  navigateAfterPasswordSignIn,
  signInWithEmail,
  signInWithPhone,
} from '@/lib/auth';
import {
  friendlyAuthError,
  friendlyGoogleSignInError,
  isInvalidCredentialsError,
  isNetworkError,
} from '@/lib/auth/authErrors';
import { markIntentionalSignOut } from '@/lib/auth/signOutIntent';
import {
  clearRememberedLogin,
  loadRememberedLogin,
  saveRememberedLogin,
} from '@/lib/loginRemember';
import { resolveAuthenticatedRoute } from '@/lib/navigation';
import { clearPushTokenForCurrentUser } from '@/lib/notifications';
import { recordTermsAcceptance } from '@/lib/terms';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

type LoginMethod = 'options' | 'email-pass' | 'phone' | 'phone-pass';

function cleanPhoneDigits(value: string) {
  return value
    .replace(/\s/g, '')
    .replace(/^\+977/, '')
    .replace(/^977/, '')
    .replace(/^0/, '')
    .replace(/\D/g, '')
    .slice(0, 10);
}

function MethodRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
  featured = false,
  delay = 0,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
  featured?: boolean;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: Motion.slow,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: Motion.slow,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.methodRow,
          featured && styles.methodRowFeatured,
          pressed && styles.methodRowPressed,
        ]}>
        <View style={[styles.methodIcon, featured && styles.methodIconFeatured]}>
          <Icon size={20} color={featured ? Palette.white : Palette.primary} strokeWidth={2.25} />
        </View>
        <View style={styles.methodCopy}>
          <View style={styles.methodTitleRow}>
            <Text style={styles.methodTitle}>{title}</Text>
            {featured ? (
              <View style={styles.featuredPill}>
                <Text style={styles.featuredPillText}>Fastest</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.methodSubtitle}>{subtitle}</Text>
        </View>
        <ArrowRight size={18} color={Palette.primary} strokeWidth={2.25} />
      </Pressable>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const goBack = useSafeBack('/(auth)/welcome');
  const { locale, setAuthRole, setPendingPhone, setPendingMode } = useAuthStore();
  const { sendOTP, loading: phoneLoading, validatePhone } = usePhoneAuth();

  const [method, setMethod] = useState<LoginMethod>('options');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [phoneNoAccount, setPhoneNoAccount] = useState(false);
  const [emailNoAccount, setEmailNoAccount] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [rememberReady, setRememberReady] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingGoogleUserId, setPendingGoogleUserId] = useState<string | null>(null);

  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroOpacity, {
      toValue: 1,
      duration: Motion.slow,
      useNativeDriver: true,
    }).start();
  }, [heroOpacity]);

  useEffect(() => {
    void (async () => {
      const saved = await loadRememberedLogin();
      if (saved.remember) {
        setRememberLogin(true);
        if (saved.email) setEmail(saved.email);
        if (saved.phone) setPhone(cleanPhoneDigits(saved.phone));
      }
      setRememberReady(true);
    })();
  }, []);

  const handleRememberChange = (next: boolean) => {
    setRememberLogin(next);
    if (!next) void clearRememberedLogin();
  };

  const persistRemember = async (values: {
    email?: string;
    phone?: string;
    lastMethod: 'phone' | 'email' | 'password';
  }) => {
    await saveRememberedLogin({
      remember: rememberLogin,
      email: values.email,
      phone: values.phone,
      lastMethod: values.lastMethod,
    });
  };

  const handleBack = () => {
    if (method === 'options') {
      goBack();
      return;
    }
    setMethod('options');
    setError('');
    setPhoneNoAccount(false);
    setEmailNoAccount(false);
    setPassword('');
  };

  const headerTitle =
    method === 'options'
      ? 'Welcome back'
      : method === 'email-pass'
        ? 'Email & password'
        : method === 'phone'
          ? 'Sign in with phone'
          : 'Phone & password';

  const headerSubtitle =
    method === 'options' ? 'Rescue food near you — pick a way in' : 'Enter your details below';

  const handleEmailPassword = async () => {
    if (!email.trim() || !password) {
      setError('Enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    setEmailNoAccount(false);
    try {
      const { data, error: signError } = await signInWithEmail(email.trim(), password);
      if (signError || !data.user) {
        if (isInvalidCredentialsError(signError)) {
          setEmailNoAccount(true);
          setError('Wrong email or password. Please try again.');
          return;
        }
        setError(friendlyAuthError(signError, t(locale, 'authError')));
        return;
      }
      await persistRemember({ email: email.trim(), lastMethod: 'email' });
      const result = await navigateAfterPasswordSignIn(router, setAuthRole, data.user.id);
      if (!result.ok) setError(result.error);
    } catch (err) {
      setError(
        friendlyAuthError(
          err,
          isNetworkError(err)
            ? 'No internet connection. Please check your connection and try again.'
            : t(locale, 'authError'),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtp = async () => {
    const local = cleanPhoneDigits(phone);
    if (!validatePhone(local)) {
      setError('Enter a valid NTC or Ncell number');
      return;
    }
    setLoading(true);
    setError('');
    setPhoneNoAccount(false);
    try {
      const result = await sendOTP(local, 'login');
      if (!result.success) {
        if ('noAccount' in result && result.noAccount) {
          setPhoneNoAccount(true);
          setError(result.error);
          return;
        }
        setError(result.error || 'Failed to send OTP');
        return;
      }
      await persistRemember({ phone: local, lastMethod: 'phone' });
      setPendingPhone(local);
      setPendingMode('login');
      router.push({
        pathname: '/(auth)/verify-phone',
        params: { mode: 'login' },
      } as never);
    } catch (err) {
      setError(friendlyAuthError(err, 'Failed to send OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhonePassword = async () => {
    const local = cleanPhoneDigits(phone);
    if (!validatePhone(local) || !password) {
      setError('Enter phone and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: signError } = await signInWithPhone(local, password);
      if (signError || !data.user) {
        setError(
          isInvalidCredentialsError(signError) ||
            /wrong phone|wrong password|invalid login/i.test(signError?.message ?? '')
            ? 'Wrong phone number or password. Please try again.'
            : friendlyAuthError(signError, t(locale, 'authError')),
        );
        return;
      }
      await persistRemember({ phone: local, lastMethod: 'password' });
      const result = await navigateAfterPasswordSignIn(router, setAuthRole, data.user.id);
      if (!result.ok) setError(result.error);
    } catch (err) {
      setError(
        friendlyAuthError(
          err,
          isNetworkError(err)
            ? 'No internet connection. Please check your connection and try again.'
            : t(locale, 'authError'),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await navigateAfterGoogleSignIn(router, setAuthRole);
      if (!result.ok) {
        if (result.expoGo || result.cancelled) return;
        setError('Google Sign-In failed. Please try again.');
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

  const busy = loading || phoneLoading || googleLoading;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={10}>
          <ChevronLeft size={22} color={Palette.textPrimary} strokeWidth={2.25} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
          {method === 'options' ? (
            <>
              <LastBagLogo size="md" layout="row" />
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
            </>
          ) : (
            <>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
            </>
          )}
        </Animated.View>

        <View style={styles.body}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {method === 'options' ? (
            <View style={styles.options}>
              <MethodRow
                icon={Smartphone}
                title="Continue with phone"
                subtitle="SMS code — quickest in Nepal"
                featured
                delay={40}
                onPress={() => {
                  setMethod('phone');
                  setError('');
                }}
              />
              <MethodRow
                icon={KeyRound}
                title="Email & password"
                subtitle="Use the email on your account"
                delay={100}
                onPress={() => {
                  setMethod('email-pass');
                  setError('');
                }}
              />
              <MethodRow
                icon={Lock}
                title="Phone & password"
                subtitle="Number plus your saved password"
                delay={160}
                onPress={() => {
                  setMethod('phone-pass');
                  setError('');
                }}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <GoogleSignInButton
                label="Continue with Google"
                onPress={() => void handleGoogle()}
                loading={googleLoading}
                disabled={busy}
              />

              <Pressable
                onPress={() => router.push('/(auth)/welcome')}
                style={styles.signupLink}
                hitSlop={8}>
                <Text style={styles.signupMuted}>
                  New to LastBag? <Text style={styles.signupAccent}>Create an account</Text>
                </Text>
              </Pressable>
            </View>
          ) : null}

          {method === 'email-pass' ? (
            <View style={styles.formPanel}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setEmailNoAccount(false);
                }}
                placeholder="you@example.com"
                placeholderTextColor={Palette.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                style={styles.input}
              />
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={Palette.textTertiary}
                  secureTextEntry={!showPass}
                  style={styles.passwordInput}
                />
                <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
                  <Text style={styles.showHide}>{showPass ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
              <View style={styles.rowBetween}>
                {rememberReady ? (
                  <RememberMeToggle value={rememberLogin} onChange={handleRememberChange} />
                ) : (
                  <View />
                )}
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(auth)/forgot-password',
                      params: { email: email || '' },
                    })
                  }
                  hitSlop={8}>
                  <Text style={styles.forgot}>Forgot password?</Text>
                </Pressable>
              </View>
              {emailNoAccount ? (
                <AuthNoAccountPrompt
                  title="No account found with this email."
                  body="Want to sign up instead?"
                  primaryLabel="Sign up →"
                  secondaryLabel="Try again"
                  onPrimary={() => router.push('/(auth)/welcome')}
                  onSecondary={() => {
                    setEmailNoAccount(false);
                    setPassword('');
                    setError('');
                  }}
                />
              ) : null}
              <Pressable
                onPress={() => void handleEmailPassword()}
                disabled={busy || !email.trim() || !password}
                style={[
                  styles.cta,
                  (!email.trim() || !password || busy) && styles.ctaDisabled,
                ]}>
                <Text
                  style={[
                    styles.ctaText,
                    (!email.trim() || !password || busy) && styles.ctaTextDisabled,
                  ]}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {method === 'phone' ? (
            <View style={styles.formPanel}>
              <Text style={styles.label}>Phone number</Text>
              <View style={styles.phoneRow}>
                <Text style={styles.phonePrefix}>+977</Text>
                <TextInput
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(cleanPhoneDigits(value));
                    setPhoneNoAccount(false);
                  }}
                  placeholder="98XXXXXXXX"
                  placeholderTextColor={Palette.textTertiary}
                  keyboardType="phone-pad"
                  autoFocus
                  maxLength={10}
                  style={styles.phoneInput}
                />
              </View>
              <Text style={styles.fieldHint}>NTC or Ncell mobile</Text>
              {rememberReady ? (
                <RememberMeToggle value={rememberLogin} onChange={handleRememberChange} />
              ) : null}
              {phoneNoAccount ? (
                <AuthNoAccountPrompt
                  title="No account found with this number."
                  body="Want to sign up instead?"
                  primaryLabel="Sign up →"
                  secondaryLabel="Try a different number"
                  onPrimary={() => router.push('/(auth)/welcome')}
                  onSecondary={() => {
                    setPhoneNoAccount(false);
                    setPhone('');
                    setError('');
                  }}
                />
              ) : null}
              <Pressable
                onPress={() => void handlePhoneOtp()}
                disabled={busy || phone.length < 10}
                style={[styles.cta, (busy || phone.length < 10) && styles.ctaDisabled]}>
                <Text style={[styles.ctaText, (busy || phone.length < 10) && styles.ctaTextDisabled]}>
                  {loading || phoneLoading ? 'Sending...' : 'Send code'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {method === 'phone-pass' ? (
            <View style={styles.formPanel}>
              <Text style={styles.label}>Phone number</Text>
              <View style={styles.phoneRow}>
                <Text style={styles.phonePrefix}>+977</Text>
                <TextInput
                  value={phone}
                  onChangeText={(value) => setPhone(cleanPhoneDigits(value))}
                  placeholder="98XXXXXXXX"
                  placeholderTextColor={Palette.textTertiary}
                  keyboardType="phone-pad"
                  autoFocus
                  maxLength={10}
                  style={styles.phoneInput}
                />
              </View>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor={Palette.textTertiary}
                  secureTextEntry={!showPass}
                  style={styles.passwordInput}
                />
                <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
                  <Text style={styles.showHide}>{showPass ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
              {rememberReady ? (
                <View style={{ marginBottom: Spacing.md }}>
                  <RememberMeToggle value={rememberLogin} onChange={handleRememberChange} />
                </View>
              ) : null}
              <Pressable
                onPress={() => void handlePhonePassword()}
                disabled={busy || phone.length < 10 || !password}
                style={[
                  styles.cta,
                  (busy || phone.length < 10 || !password) && styles.ctaDisabled,
                ]}>
                <Text
                  style={[
                    styles.ctaText,
                    (busy || phone.length < 10 || !password) && styles.ctaTextDisabled,
                  ]}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <TermsAcceptanceModal
        visible={showTermsModal}
        onAccept={async () => {
          if (!pendingGoogleUserId) return;
          const { error: termsError } = await recordTermsAcceptance(pendingGoogleUserId);
          if (termsError) {
            Alert.alert('Could not save', termsError.message);
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
          Alert.alert('Sign in cancelled', 'You must accept the terms to use LastBag.');
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  glowTop: {
    position: 'absolute',
    top: -90,
    alignSelf: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Palette.primary,
    opacity: 0.07,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 80,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Palette.primary,
    opacity: 0.045,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginBottom: Spacing.lg,
    paddingVertical: 4,
  },
  backText: {
    ...Type.bodyMedium,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  hero: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Type.display,
    color: Palette.textPrimary,
    marginTop: Spacing.sm,
  },
  headerSubtitle: {
    ...Type.body,
    color: Palette.textSecondary,
  },
  body: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    ...Type.caption,
    color: '#B91C1C',
    fontWeight: '500',
  },
  options: {
    gap: Spacing.md,
  },
  methodRow: {
    ...CardChrome,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  methodRowFeatured: {
    borderColor: 'rgba(216, 90, 48, 0.35)',
    backgroundColor: Palette.surface,
  },
  methodRowPressed: {
    opacity: 0.9,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconFeatured: {
    backgroundColor: Palette.primary,
  },
  methodCopy: {
    flex: 1,
    gap: 2,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  methodTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  methodSubtitle: {
    ...Type.caption,
    color: Palette.textTertiary,
  },
  featuredPill: {
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  featuredPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primaryDark,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.border,
  },
  dividerText: {
    ...Type.caption,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  signupLink: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  signupMuted: {
    ...Type.body,
    textAlign: 'center',
    color: Palette.textSecondary,
  },
  signupAccent: {
    color: Palette.primary,
    fontWeight: '700',
  },
  formPanel: {
    ...CardChrome,
    padding: Spacing.xl,
  },
  label: {
    ...Type.label,
    color: Palette.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  fieldHint: {
    ...Type.caption,
    color: Palette.textTertiary,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
    marginBottom: Spacing.lg,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: Palette.textPrimary,
  },
  showHide: {
    ...Type.caption,
    color: Palette.primary,
    fontWeight: '700',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  phonePrefix: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: Palette.textPrimary,
    letterSpacing: 0.4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  forgot: {
    ...Type.caption,
    color: Palette.primary,
    fontWeight: '700',
  },
  cta: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  ctaDisabled: {
    backgroundColor: Palette.surfaceMuted,
  },
  ctaText: {
    ...Type.bodyMedium,
    fontWeight: '800',
    color: Palette.white,
  },
  ctaTextDisabled: {
    color: Palette.textTertiary,
  },
});
