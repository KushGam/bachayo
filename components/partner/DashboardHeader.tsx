import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { MessageIconBadge } from '@/components/ui/MessageIconBadge';
import { NotificationBellBadge } from '@/components/ui/NotificationBellBadge';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { getGreeting } from '@/lib/helpers';

type DashboardHeaderProps = {
  partnerName: string;
  categoryLabel: string;
  categoryIcon: string;
  dateLabel: string;
  paddingTop: number;
  onNotifications: () => void;
  onMessages: () => void;
};

function truncateName(name: string, max = 26) {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function DashboardHeader({
  partnerName,
  categoryLabel,
  categoryIcon,
  dateLabel,
  paddingTop,
  onNotifications,
  onMessages,
}: DashboardHeaderProps) {
  const displayName = truncateName(partnerName);
  const categoryPart =
    categoryLabel.trim().length > 0 ? `${categoryIcon} ${categoryLabel}`.trim() : null;
  const subline = [getGreeting(), categoryPart].filter(Boolean).join(' · ');

  return (
    <LinearGradient
      colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glowPrimary} pointerEvents="none" />
      <View style={styles.glowSecondary} pointerEvents="none" />

      <View style={styles.topRow}>
        <Text style={styles.date}>{dateLabel}</Text>
        <View style={styles.actions}>
          <MessageIconBadge variant="dark" size={18} onPress={onMessages} />
          <NotificationBellBadge variant="dark" size={18} onPress={onNotifications} />
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.businessName}>{displayName}</Text>
        <Text style={styles.subline}>{subline}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.lg + 8,
    borderBottomRightRadius: Radius.lg + 8,
    overflow: 'hidden',
  },
  glowPrimary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -80,
    right: -60,
  },
  glowSecondary: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -40,
    left: -30,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  copy: {
    gap: 6,
  },
  businessName: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  subline: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },
});
