import { Banknote, CreditCard, Landmark, Smartphone } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  Cash: Banknote,
  eSewa: Smartphone,
  Khalti: CreditCard,
  'Bank transfer': Landmark,
};

type PartnerDetailPaymentsProps = {
  methods: string[];
};

export function PartnerDetailPayments({ methods }: PartnerDetailPaymentsProps) {
  if (methods.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>We accept</Text>
      <View style={styles.row}>
        {methods.map((method) => {
          const Icon = PAYMENT_ICONS[method] ?? CreditCard;
          return (
            <View key={method} style={styles.pill}>
              <Icon size={14} color={Palette.textSecondary} strokeWidth={2} />
              <Text style={styles.pillText}>{method}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.lg,
  },
  title: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.background,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  pillText: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
});
