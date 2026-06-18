import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import Colors, { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Screen>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.lightGreenBg }]}>
          <Text style={[styles.avatarText, { color: Palette.primary }]}>B</Text>
        </View>
        <Text style={styles.name}>Guest</Text>
        <Text style={[styles.email, { color: colors.textMuted }]}>Sign in to save your bags</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.lightGreenBg }]}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={[styles.sectionItem, { color: colors.textMuted }]}>Notifications</Text>
        <Text style={[styles.sectionItem, { color: colors.textMuted }]}>Payment methods</Text>
        <Text style={[styles.sectionItem, { color: colors.textMuted }]}>Help & support</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginBottom: 16,
  },
  sectionItem: {
    fontSize: 15,
    paddingVertical: 12,
  },
});
