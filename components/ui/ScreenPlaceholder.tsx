import type { ViewProps } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

type ScreenPlaceholderProps = ViewProps & {
  label: string;
};

export function ScreenPlaceholder({ label, style, ...props }: ScreenPlaceholderProps) {
  return (
    <View style={[styles.wrap, style]} {...props}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#F9F9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    color: '#1A1A1A',
  },
});
