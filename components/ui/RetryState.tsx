import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';

type RetryStateProps = {
  message: string;
  onRetry: () => void;
};

export function RetryState({ message, onRetry }: RetryStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.message}>{message}</Text>
      <Button
        label="Try again"
        onPress={onRetry}
        variant="primary"
        size="md"
        fullWidth={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  message: {
    ...Type.caption,
    color: Palette.dangerText,
    fontWeight: '600',
    textAlign: 'center',
  },
});
