import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

type RememberMeToggleProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  label?: string;
};

export function RememberMeToggle({
  value,
  onChange,
  label = 'Remember me',
}: RememberMeToggleProps) {
  return (
    <Pressable
      onPress={() => {
        void hapticButtonPress();
        onChange(!value);
      }}
      hitSlop={8}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}>
      <View style={[styles.box, value && styles.boxOn]}>
        {value ? <Check size={12} color={Palette.white} strokeWidth={3} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  label: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
});
