import { Pressable, StyleSheet, Text, View } from 'react-native';

type ProfileMenuRowProps = {
  emoji: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
  labelColor?: string;
};

export function ProfileMenuRow({
  emoji,
  label,
  subtitle,
  onPress,
  right,
  showChevron = true,
  isLast = false,
  labelColor = '#1A1A1A',
}: ProfileMenuRowProps) {
  const interactive = Boolean(onPress);

  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        interactive && pressed && { opacity: 0.88 },
      ]}>
      <View style={styles.iconWrap}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
      {showChevron && interactive && !right ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE8',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 16,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chevron: {
    fontSize: 16,
    color: '#C4C0B8',
    fontWeight: '500',
  },
});
