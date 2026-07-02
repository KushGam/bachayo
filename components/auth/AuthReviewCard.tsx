import { Mail, ShieldCheck, Smartphone } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import type { AuthMethod } from '@/components/auth/AuthMethodToggle';

type AuthReviewCardProps = {
  authMethod: AuthMethod;
  identifier: string;
  name: string;
};

export function AuthReviewCard({ authMethod, identifier, name }: AuthReviewCardProps) {
  const Icon = authMethod === 'email' ? Mail : Smartphone;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Icon size={22} color={Palette.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.identifier}>{identifier}</Text>
        </View>
      </View>
      <View style={styles.badge}>
        <ShieldCheck size={14} color={Palette.primaryDark} strokeWidth={2.2} />
        <Text style={styles.badgeText}>Password ready</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    gap: Spacing.lg,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  identifier: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primaryLight,
  },
  badgeText: {
    ...Type.label,
    color: Palette.primaryDark,
    fontWeight: '700',
  },
});
