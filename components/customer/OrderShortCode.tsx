import { Platform, StyleSheet, Text, View } from 'react-native';

import { getOrderShortCode } from '@/lib/helpers';

type OrderShortCodeProps = {
  qrCode: string;
};

export function OrderShortCode({ qrCode }: OrderShortCodeProps) {
  const code = getOrderShortCode(qrCode);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Order code</Text>
      <View style={styles.box}>
        <Text style={styles.code}>{code}</Text>
      </View>
      <Text style={styles.hint}>Show this code if QR doesn&apos;t scan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  box: {
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  code: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 8,
    color: '#1A1A1A',
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  hint: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
});
