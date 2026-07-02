import { MaterialIcons } from '@expo/vector-icons';
import { ReactNode, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StepProgress } from '@/components/auth/StepProgress';
import { Button } from '@/components/ui/Button';
import { Palette } from '@/constants/Colors';
import { FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

type SignupStepShellProps = {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  continueLabel?: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  secondaryAction?: ReactNode;
  children: ReactNode;
};

const FOOTER_HEIGHT = 112;

export function SignupStepShell({
  currentStep,
  totalSteps,
  title,
  subtitle,
  showBack = true,
  onBack,
  continueLabel = 'Continue',
  onContinue,
  continueDisabled = false,
  continueLoading = false,
  secondaryAction,
  children,
}: SignupStepShellProps) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const bottomPad =
    FOOTER_HEIGHT + insets.bottom + Spacing.xl + (keyboardVisible ? Spacing.xl : 0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.sm, paddingBottom: bottomPad },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          onScrollBeginDrag={Keyboard.dismiss}>
          <Pressable onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.hero}>
              <View style={styles.glow} />
              <View style={styles.topRow}>
                {showBack && onBack ? (
                  <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
                    <MaterialIcons name="arrow-back-ios-new" size={18} color={Palette.textPrimary} />
                  </Pressable>
                ) : (
                  <View style={styles.backSpacer} />
                )}
              </View>

              <StepProgress currentStep={currentStep} totalSteps={totalSteps} />

              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
          </Pressable>

          <Animated.View
            key={`step-fields-${currentStep}`}
            entering={FadeInRight.duration(200)}
            style={styles.fields}>
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }, FloatingShadow]}
        pointerEvents="box-none">
        {secondaryAction}
        <Button
          label={continueLabel}
          onPress={onContinue}
          disabled={continueDisabled}
          loading={continueLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  hero: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  glow: {
    position: 'absolute',
    top: -32,
    right: -16,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Palette.primaryLight,
    opacity: 0.4,
  },
  topRow: {
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    height: 40,
  },
  title: {
    ...Type.display,
    color: Palette.textPrimary,
    letterSpacing: -0.3,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Type.body,
    color: Palette.textSecondary,
    marginBottom: Spacing.xl,
  },
  fields: {
    gap: Spacing.sm,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
});
