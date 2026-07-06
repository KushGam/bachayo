import { Clock, Heart, Package } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, Radius, Spacing, Type } from '@/constants/theme';

const TIPS = [
  {
    icon: Clock,
    text: 'Be ready during your pickup window so customers never wait.',
  },
  {
    icon: Package,
    text: 'Pack bags generously — a little extra turns one-time buyers into regulars.',
  },
  {
    icon: Heart,
    text: 'A warm greeting goes a long way toward earning five stars.',
  },
] as const;

export function ReviewsTipsCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>How to earn great reviews</Text>
      <Text style={styles.subtitle}>
        Higher ratings help you appear higher in customer search results.
      </Text>

      {TIPS.map((tip) => {
        const Icon = tip.icon;
        return (
          <View key={tip.text} style={styles.tipRow}>
            <View style={styles.iconWrap}>
              <Icon size={16} color={Palette.primary} strokeWidth={2} />
            </View>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm + 2,
    marginTop: Spacing.xs,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    ...Type.caption,
    color: Palette.textPrimary,
    lineHeight: 20,
  },
});
