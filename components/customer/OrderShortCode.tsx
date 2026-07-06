import { Platform, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { getOrderShortCode } from '@/lib/helpers';

type OrderShortCodeProps = {
  qrCode: string;
};

export function OrderShortCode({ qrCode }: OrderShortCodeProps) {
  const code = getOrderShortCode(qrCode);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Pickup code</Text>
      <View style={styles.box}>
        <Text style={styles.code}>{code}</Text>
      </View>
      <Text style={styles.hint}>Use this if the QR doesn&apos;t scan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  label: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  box: {
    backgroundColor: Palette.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    marginTop: 2,
  },
  code: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 6,
    color: Palette.textPrimary,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  hint: {
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'center',
  },
});
