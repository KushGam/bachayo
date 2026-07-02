import { Link, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    ...Type.h1,
  },
  link: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
  },
  linkText: {
    ...Type.bodyMedium,
    color: Palette.primary,
  },
});
