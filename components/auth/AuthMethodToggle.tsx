import { Mail, Smartphone } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

export type AuthMethod = 'email' | 'phone';

const OPTIONS: { key: AuthMethod; label: string; Icon: typeof Mail }[] = [
  { key: 'email', label: 'Email', Icon: Mail },
  { key: 'phone', label: 'Phone', Icon: Smartphone },
];

type AuthMethodToggleProps = {
  value: AuthMethod;
  onChange: (method: AuthMethod) => void;
};

export function AuthMethodToggle({ value, onChange }: AuthMethodToggleProps) {
  return (
    <View style={styles.track}>
      {OPTIONS.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.option, active && styles.optionActive]}>
            <Icon
              size={16}
              color={active ? Palette.primaryDark : Palette.textTertiary}
              strokeWidth={2.2}
            />
            <Text style={[styles.optionText, active && styles.optionTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(216, 90, 48, 0.12)',
    marginBottom: Spacing.lg,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  optionActive: {
    backgroundColor: Palette.white,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  optionText: {
    ...Type.bodyMedium,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: Palette.primaryDark,
  },
});
