import { Keyboard } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress, hapticError } from '@/lib/haptics';
import { lookupOrderByPartnerCode } from '@/lib/orders';
import { supabase } from '@/lib/supabase';
import type { PartnerOrderWithCustomer } from '@/types/app';

const BOX_COUNT = 6;

type ManualQREntryProps = {
  onOrderFound: (order: PartnerOrderWithCustomer) => void;
  onBack?: () => void;
};

export function ManualQREntry({ onOrderFound, onBack }: ManualQREntryProps) {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const loadPartner = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return null;

    const { data } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    setPartnerId(data?.id ?? null);
    return data?.id ?? null;
  }, []);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  const verifyCode = async () => {
    if (code.length < BOX_COUNT) return;

    void hapticButtonPress();
    setLoading(true);
    setCodeError(null);

    const pid = partnerId ?? (await loadPartner());
    if (!pid) {
      setCodeError('Partner profile not found');
      setLoading(false);
      return;
    }

    try {
      const order = await lookupOrderByPartnerCode(code, pid);

      if (!order) {
        setCodeError('Invalid code — check with customer');
        triggerShake();
        void hapticError();
        setLoading(false);
        return;
      }

      if (order.status === 'picked_up') {
        setCodeError('This order was already picked up');
        triggerShake();
        void hapticError();
        setLoading(false);
        return;
      }

      onOrderFound(order);
      setCode('');
    } catch {
      setCodeError('Could not verify code — try again');
      triggerShake();
      void hapticError();
    } finally {
      setLoading(false);
    }
  };

  const digits = code.padEnd(BOX_COUNT, ' ').split('').slice(0, BOX_COUNT);

  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          onPress={() => {
            void hapticButtonPress();
            onBack();
          }}
          style={styles.backBtn}
          hitSlop={8}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      ) : null}

      <View style={styles.headerCard}>
        <View style={styles.iconWrap}>
          <Keyboard size={26} color={Palette.white} strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>Enter customer code</Text>
        <Text style={styles.headerSubtitle}>
          Ask the customer to open My Bags and show their 6-digit order code
        </Text>
      </View>

      <Pressable onPress={() => inputRef.current?.focus()} style={styles.inputArea}>
        <Animated.View style={[styles.digitRow, shakeStyle]}>
          {digits.map((digit, index) => {
            const filled = digit.trim().length > 0;
            const isActive = focused && index === Math.min(code.length, BOX_COUNT - 1);
            return (
              <View
                key={index}
                style={[
                  styles.digitBox,
                  isActive && styles.digitBoxFocused,
                  filled && styles.digitBoxFilled,
                ]}>
                <Text style={styles.digitText}>{filled ? digit.toUpperCase() : ''}</Text>
              </View>
            );
          })}
        </Animated.View>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(text) => {
            const next = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, BOX_COUNT);
            setCode(next);
            setCodeError(null);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType="default"
          maxLength={BOX_COUNT}
          style={styles.hiddenInput}
          caretHidden
        />
      </Pressable>

      {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}

      <Pressable
        onPress={() => void verifyCode()}
        disabled={code.length < BOX_COUNT || loading}
        style={({ pressed }) => [
          styles.verifyBtn,
          (code.length < BOX_COUNT || loading) && styles.verifyBtnDisabled,
          pressed && code.length >= BOX_COUNT && !loading && { opacity: 0.92 },
        ]}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.verifyBtnText}>Checking…</Text>
          </View>
        ) : (
          <Text style={styles.verifyBtnText}>Verify</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    paddingVertical: 4,
  },
  backText: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg + 4,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Palette.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  inputArea: {
    marginBottom: Spacing.md,
  },
  digitRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  digitBox: {
    width: 44,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxFocused: {
    borderColor: Palette.primary,
    backgroundColor: '#FFFAF9',
  },
  digitBoxFilled: {
    borderColor: 'rgba(216, 90, 48, 0.5)',
  },
  digitText: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  verifyBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnDisabled: {
    opacity: 0.45,
  },
  verifyBtnText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
