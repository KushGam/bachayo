import { Clock, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';

type HomeRecentSearchesProps = {
  items: string[];
  title: string;
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
};

export function HomeRecentSearches({ items, title, onSelect, onRemove }: HomeRecentSearchesProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {items.map((term) => (
        <View key={term} style={styles.row}>
          <Pressable
            onPress={() => onSelect(term)}
            style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
            <Clock size={16} color={Palette.textSecondary} strokeWidth={2} />
            <Text numberOfLines={1} style={styles.term}>
              {term}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onRemove(term)}
            hitSlop={8}
            style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}>
            <X size={16} color={Palette.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Palette.white,
    marginTop: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: '#FAFAF8',
  },
  term: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  removeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
