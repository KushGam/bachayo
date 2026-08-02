import { MapPin, RefreshCw } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

type HomeLocationChipProps = {
  neighbourhood: string | null;
  hasLocation: boolean;
  refreshing?: boolean;
  locale: 'en' | 'np';
  onPress: () => void;
};

export function HomeLocationChip({
  neighbourhood,
  hasLocation,
  refreshing = false,
  locale,
  onPress,
}: HomeLocationChipProps) {
  const isNp = locale === 'np';
  const title = hasLocation
    ? neighbourhood || (isNp ? 'तपाईंको स्थान' : 'Your area')
    : isNp
      ? 'स्थान सक्रिय गर्नुहोस्'
      : 'Enable location';
  const subtitle = hasLocation
    ? isNp
      ? 'नजिकका ब्यागहरू देखाउँदै'
      : 'Showing bags near you'
    : isNp
      ? 'नजिकका ब्याग हेर्न ट्याप गर्नुहोस्'
      : 'Tap to find bags near you';

  return (
    <Pressable
      onPress={onPress}
      disabled={refreshing}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, !hasLocation && styles.iconWrapMuted]}>
        {refreshing ? (
          <ActivityIndicator size="small" color={Palette.primary} />
        ) : (
          <MapPin
            size={16}
            color={hasLocation ? Palette.primary : '#9CA3AF'}
            strokeWidth={2.4}
          />
        )}
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, !hasLocation && styles.titleMuted]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {hasLocation ? (
        <View style={styles.refreshWrap}>
          <RefreshCw size={14} color={Palette.primary} strokeWidth={2.2} />
        </View>
      ) : (
        <View style={styles.ctaPill}>
          <Text style={styles.ctaText}>{isNp ? 'अनुमति' : 'Allow'}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(216,90,48,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...FloatingShadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapMuted: {
    backgroundColor: '#F3F4F6',
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.2,
  },
  titleMuted: {
    color: Palette.textSecondary,
  },
  subtitle: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '500',
  },
  refreshWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPill: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ctaText: {
    ...Type.label,
    color: Palette.white,
    fontWeight: '700',
  },
});
