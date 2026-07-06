import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type PartnerDetailAboutProps = {
  text: string;
};

export function PartnerDetailAbout({ text }: PartnerDetailAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const height = useSharedValue(66);

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: height.value,
    overflow: 'hidden',
  }));

  const onTextLayout = (event: LayoutChangeEvent) => {
    if (!expanded && event.nativeEvent.layout.height > 66) {
      setTruncated(true);
    }
  };

  const toggle = () => {
    void hapticButtonPress();
    const next = !expanded;
    setExpanded(next);
    height.value = withTiming(next ? 500 : 66, { duration: 220 });
  };

  if (!text.trim()) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>About</Text>
      <Animated.View style={animatedStyle}>
        <Text style={styles.body} onLayout={onTextLayout}>
          {text}
        </Text>
      </Animated.View>
      {truncated || expanded ? (
        <Pressable onPress={toggle} hitSlop={8}>
          <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
    marginBottom: Spacing.sm,
  },
  body: {
    ...Type.body,
    color: Palette.textSecondary,
    lineHeight: 22,
  },
  readMore: {
    marginTop: Spacing.sm,
    ...Type.caption,
    fontWeight: '700',
    color: Palette.primary,
  },
});
