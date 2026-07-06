import { ChevronDown, Search } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import type { FaqItem } from '@/constants/supportFaq';
import { hapticButtonPress } from '@/lib/haptics';

export type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

function FaqRow({
  item,
  expanded,
  isLast,
  onToggle,
}: {
  item: FaqItem;
  expanded: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 200 });
  }, [expanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View>
      <Pressable
        onPress={() => {
          void hapticButtonPress();
          onToggle();
        }}
        style={({ pressed }) => [
          styles.faqRow,
          !isLast && styles.faqRowBorder,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={18} color={Palette.textTertiary} strokeWidth={2.5} />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.faqAnswerWrap}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function HelpFaqSection({
  section,
  expandedId,
  onToggle,
}: {
  section: FaqSection;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  if (section.items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>{section.title}</Text>
      <View style={styles.card}>
        {section.items.map((item, index) => (
          <FaqRow
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            isLast={index === section.items.length - 1}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

export function HelpFaqEmpty() {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Search size={24} color={Palette.primary} strokeWidth={2} />
      </View>
      <Text style={styles.emptyTitle}>No topics found</Text>
      <Text style={styles.emptyText}>Try a different search or send us a message below.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionEyebrow: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginHorizontal: Spacing.lg,
    marginLeft: Spacing.lg + 2,
  },
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  faqRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  pressed: {
    opacity: 0.92,
  },
  faqQuestion: {
    flex: 1,
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
    lineHeight: 20,
  },
  faqAnswerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: 2,
    backgroundColor: Palette.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  faqAnswer: {
    ...Type.caption,
    color: Palette.textSecondary,
    lineHeight: 21,
  },
  emptyCard: {
    ...CardChrome,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    ...FloatingShadow,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  emptyText: {
    ...Type.caption,
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
});
