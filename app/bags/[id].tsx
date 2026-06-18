import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';

export default function BagDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bag Detail</Text>
      <Text style={styles.subtitle}>Bag ID: {id}</Text>
      <Text style={styles.note}>
        This is a placeholder detail screen. Connect this route to full reservation flow next.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Palette.primary,
    fontWeight: '700',
    marginBottom: 16,
  },
  note: {
    fontSize: 14,
    lineHeight: 21,
    color: Palette.textMuted,
  },
});

