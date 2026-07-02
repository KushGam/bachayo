import { AlertCircle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type AuthErrorBannerProps = {
  message: string;
};

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  return (
    <View style={styles.banner}>
      <AlertCircle size={16} color={Palette.danger} strokeWidth={2.2} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: Palette.dangerBorder,
  },
  text: {
    flex: 1,
    ...Type.bodyMedium,
    color: Palette.dangerText,
  },
});
