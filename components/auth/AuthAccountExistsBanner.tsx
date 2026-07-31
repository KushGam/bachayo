import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type AuthAccountExistsBannerProps = {
  onGoToLogin: () => void;
};

export function AuthAccountExistsBanner({ onGoToLogin }: AuthAccountExistsBannerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <Text style={styles.emoji}>⚠️</Text>
        <View style={styles.copy}>
          <Text style={styles.title}>Account already exists</Text>
          <Text style={styles.body}>This email is already registered. Please login instead.</Text>
        </View>
      </View>
      <Pressable
        onPress={onGoToLogin}
        style={({ pressed }) => [styles.loginBtn, pressed && styles.pressed]}>
        <Text style={styles.loginText}>Go to login →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  banner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 16,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  body: {
    fontSize: 12,
    color: '#92400E',
    opacity: 0.8,
    marginTop: 2,
  },
  loginBtn: {
    borderWidth: 1.5,
    borderColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  loginText: {
    ...Type.bodyMedium,
    color: Palette.primary,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
