import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';

type TimePickerSheetProps = {
  visible: boolean;
  title: string;
  value: Date;
  mode?: 'time' | 'date';
  minimumDate?: Date;
  maximumDate?: Date;
  onClose: () => void;
  onChange: (date: Date) => void;
};

export function TimePickerSheet({
  visible,
  title,
  value,
  mode = 'time',
  minimumDate,
  maximumDate,
  onClose,
  onChange,
}: TimePickerSheetProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          onClose();
          if (event.type !== 'set' || !date) return;
          onChange(date);
        }}
      />
    );
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        <View style={styles.wheelWrap}>
          <DateTimePicker
            value={value}
            mode={mode}
            display="spinner"
            themeVariant="light"
            textColor="#1A1A1A"
            locale="en-US"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            style={styles.wheel}
            onChange={(_: DateTimePickerEvent, date?: Date) => {
              if (date) onChange(date);
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    elevation: 2000,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  done: {
    color: Palette.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  wheelWrap: {
    width: '100%',
    height: 216,
    overflow: 'hidden',
  },
  wheel: {
    width: '100%',
    height: 216,
  },
});
