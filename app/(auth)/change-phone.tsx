import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OtpInput } from '@/components/auth/OtpInput';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { Button } from '@/components/ui/Button';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { Palette } from '@/constants/Colors';
import { formatNepalPhone } from '@/lib/auth';
import { confirmPhoneOtpOnly, requestPhoneOtpDetailed } from '@/lib/auth/otpClient';
import { supabase } from '@/lib/supabase';

const RESEND_SECONDS = 60;

export default function ChangePhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const sendOtp = async () => {
    if (phoneDigits.length < 10) {
      Alert.alert('Invalid phone', 'Enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const result = await requestPhoneOtpDetailed(formatNepalPhone(phoneDigits));
    setLoading(false);

    if (!result.success) {
      Alert.alert('Could not send OTP', result.error);
      return;
    }

    setOtpId(result.otp_id);
    setStep('otp');
    setSecondsLeft(RESEND_SECONDS);
  };

  const verifyAndUpdate = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid code', 'Enter the 6-digit verification code.');
      return;
    }

    if (!otpId) {
      Alert.alert('Verification failed', 'Missing verification session. Please request a new code.');
      return;
    }

    setLoading(true);
    const formattedPhone = formatNepalPhone(phoneDigits);

    const result = await confirmPhoneOtpOnly(formattedPhone, otp, otpId);
    if (!result.success) {
      setLoading(false);
      Alert.alert('Verification failed', result.error);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      setLoading(false);
      Alert.alert('Error', 'Could not verify your session.');
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ phone: formattedPhone, updated_at: new Date().toISOString() } as never)
      .eq('id', userId);

    setLoading(false);

    if (profileError) {
      Alert.alert('Update failed', profileError.message);
      return;
    }

    Alert.alert('Phone updated', 'Your phone number has been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Change phone number</Text>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.content}>
        {step === 'phone' ? (
          <>
            <Text style={styles.subtitle}>
              Enter your new mobile number. We&apos;ll send a verification code by SMS.
            </Text>
            <PhoneInput value={phoneDigits} onChange={setPhoneDigits} />
            <Button
              label={loading ? 'Sending...' : 'Send verification code'}
              onPress={() => void sendOtp()}
              loading={loading}
              disabled={phoneDigits.length < 10 || loading}
            />
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter the code sent to +977 {phoneDigits}
            </Text>
            <OtpInput value={otp} onChange={setOtp} />
            <Button
              label={loading ? 'Verifying...' : 'Verify and update'}
              onPress={() => void verifyAndUpdate()}
              loading={loading}
              disabled={otp.length < 6 || loading}
            />
            <Pressable
              onPress={() => void sendOtp()}
              disabled={secondsLeft > 0 || loading}
              style={{ opacity: secondsLeft > 0 ? 0.5 : 1 }}>
              {loading ? (
                <ActivityIndicator color={Palette.primary} />
              ) : (
                <Text style={styles.resend}>
                  {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
                </Text>
              )}
            </Pressable>
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  back: {
    fontSize: 15,
    color: Palette.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  resend: {
    textAlign: 'center',
    fontSize: 14,
    color: Palette.primary,
    fontWeight: '600',
  },
});
