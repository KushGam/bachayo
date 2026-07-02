import { StyleSheet, Text, View } from 'react-native';

import { AppSymbol } from '@/components/ui/AppSymbol';
import { Button } from '@/components/ui/Button';
import { Palette } from '@/constants/Colors';

type PartnerEmptyStateProps = {
  ios?: 'bag.fill' | 'star.fill' | 'fork.knife' | 'qrcode' | 'clock';
  android?: 'shopping-bag' | 'star' | 'restaurant' | 'qr-code' | 'schedule';
  emoji?: string;
  emojiInCircle?: boolean;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  dashed?: boolean;
  compact?: boolean;
};

export function PartnerEmptyState({
  ios,
  android,
  emoji,
  emojiInCircle = false,
  title,
  subtitle,
  actionLabel,
  onAction,
  dashed = false,
  compact = false,
}: PartnerEmptyStateProps) {
  return (
    <View
      style={[
        styles.card,
        dashed && styles.cardDashed,
        compact && styles.cardCompact,
      ]}>
      {emoji ? (
        emojiInCircle ? (
          <View style={styles.iconWrap}>
            <Text style={styles.emojiInCircle}>{emoji}</Text>
          </View>
        ) : (
          <Text style={styles.emoji}>{emoji}</Text>
        )
      ) : ios && android ? (
        <View style={styles.iconWrap}>
          <AppSymbol ios={ios} android={android} size={24} color={Palette.primary} />
        </View>
      ) : null}
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} size="md" onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 24,
    alignItems: 'center',
  },
  cardCompact: {
    padding: 20,
  },
  cardDashed: {
    borderWidth: 1.5,
    borderColor: '#F0EDE8',
    borderStyle: 'dashed',
  },
  emoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  emojiInCircle: {
    fontSize: 24,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  btn: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
});
