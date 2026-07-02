import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  KATHMANDU_NEIGHBORHOODS,
  type KathmanduNeighborhood,
} from '@/constants/partnerAreas';
import { Palette } from '@/constants/Colors';
import { FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

type AreaSelectFieldProps = {
  value: KathmanduNeighborhood | null;
  onChange: (value: KathmanduNeighborhood) => void;
  placeholder?: string;
  error?: string;
};

export function AreaSelectField({
  value,
  onChange,
  placeholder = 'Select your area',
  error,
}: AreaSelectFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={[styles.trigger, error ? styles.triggerError : null]}>
        <MaterialIcons name="location-on" size={20} color={value ? Palette.primary : Palette.textMuted} />
        <Text style={[styles.triggerText, !value && styles.placeholder]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={22} color={Palette.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }, FloatingShadow]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Select area</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {KATHMANDU_NEIGHBORHOODS.map((area) => {
              const selected = value === area;
              return (
                <Pressable
                  key={area}
                  onPress={() => {
                    onChange(area);
                    setOpen(false);
                  }}
                  style={[styles.option, selected && styles.optionSelected]}>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{area}</Text>
                  {selected ? (
                    <MaterialIcons name="check" size={20} color={Palette.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  triggerError: {
    borderColor: Palette.dangerBorder,
  },
  triggerText: {
    flex: 1,
    ...Type.bodyMedium,
    color: Palette.textPrimary,
  },
  placeholder: {
    color: Palette.textMuted,
    fontWeight: '500',
  },
  error: {
    marginTop: Spacing.sm,
    ...Type.caption,
    color: Palette.dangerText,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    maxHeight: '62%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.border,
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    ...Type.h2,
    fontWeight: '800',
    color: Palette.textPrimary,
    marginBottom: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  optionSelected: {
    backgroundColor: Palette.lightGreenBg,
    marginHorizontal: -Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderBottomColor: 'transparent',
  },
  optionText: {
    ...Type.body,
    fontWeight: '500',
    color: Palette.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '700',
    color: Palette.primaryDark,
  },
});
