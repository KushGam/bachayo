import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';

type TermsCheckboxProps = {
  accepted: boolean;
  onToggle: () => void;
};

export function TermsCheckbox({ accepted, onToggle }: TermsCheckboxProps) {
  const router = useRouter();

  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <View style={[styles.box, accepted && styles.boxAccepted]}>
        {accepted ? <Text style={styles.check}>✓</Text> : null}
      </View>

      <Text style={styles.text}>
        I have read and agree to LastBag&apos;s{' '}
        <Text
          style={styles.link}
          onPress={(e) => {
            e.stopPropagation?.();
            router.push('/legal/terms');
          }}>
          Terms of Service
        </Text>
        {' '}and{' '}
        <Text
          style={styles.link}
          onPress={(e) => {
            e.stopPropagation?.();
            router.push('/legal/privacy');
          }}>
          Privacy Policy
        </Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 2,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  boxAccepted: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primary,
  },
  check: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  text: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    flex: 1,
  },
  link: {
    color: Palette.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
