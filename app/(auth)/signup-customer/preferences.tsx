import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { PreferenceChips } from '@/components/auth/PreferenceChips';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { hapticStepAdvance } from '@/lib/haptics';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 4;

export default function CustomerPreferencesScreen() {
  const router = useRouter();
  const { customer, setCustomer } = useSignupStore();

  const onContinue = async () => {
    await hapticStepAdvance();
    router.push('/(auth)/signup-customer/verify');
  };

  const skip = async () => {
    setCustomer({ foodPreferences: [] });
    await onContinue();
  };

  return (
    <SignupStepShell
      currentStep={3}
      totalSteps={TOTAL_STEPS}
      title="Any food preferences?"
      subtitle="Optional — helps us recommend better bags"
      showBack
      onBack={() => router.back()}
      onContinue={onContinue}
      secondaryAction={
        <Pressable onPress={skip} style={styles.skipLink}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      }>
      <PreferenceChips
        selected={customer.foodPreferences}
        onChange={(foodPreferences) => setCustomer({ foodPreferences })}
      />
    </SignupStepShell>
  );
}

const styles = StyleSheet.create({
  skipLink: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  skipText: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
});
