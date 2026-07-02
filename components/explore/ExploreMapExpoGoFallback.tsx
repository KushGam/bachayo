import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';

export default function ExploreMapExpoGoFallback() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>
        Map view needs a development build. Browse rescue bags on the Home tab for now.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.xl,
    paddingTop: 72,
    gap: Spacing.md,
  },
  title: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  subtitle: {
    ...Type.body,
    color: Palette.textSecondary,
  },
});
