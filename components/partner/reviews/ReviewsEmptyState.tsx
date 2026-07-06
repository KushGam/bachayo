import { MessageSquareOff, Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

export function ReviewsEmptyState() {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Star size={30} color={Palette.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>No reviews yet</Text>
      <Text style={styles.subtitle}>
        Complete your first pickups and customers can leave feedback after collection.
      </Text>
      <View style={styles.notePill}>
        <MessageSquareOff size={13} color={Palette.textTertiary} strokeWidth={2} />
        <Text style={styles.noteText}>Reviews unlock after pickup is confirmed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
    maxWidth: 300,
  },
  notePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surfaceMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.lg,
  },
  noteText: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
});
