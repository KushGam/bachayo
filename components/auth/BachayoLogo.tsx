import { StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Palette } from '@/constants/Colors';

type BachayoLogoProps = {
  size?: 'sm' | 'lg';
};

export function BachayoLogo({ size = 'lg' }: BachayoLogoProps) {
  const isLarge = size === 'lg';

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, isLarge ? styles.iconWrapLg : styles.iconWrapSm]}>
        <SymbolView
          name={{ ios: 'leaf.fill', android: 'eco', web: 'eco' }}
          tintColor={Palette.primary}
          size={isLarge ? 40 : 28}
        />
      </View>
      <Text style={[styles.wordmark, isLarge ? styles.wordmarkLg : styles.wordmarkSm]}>बचायो</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    backgroundColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapLg: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  iconWrapSm: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  wordmark: {
    color: Palette.textPrimary,
    fontWeight: '700',
  },
  wordmarkLg: {
    fontSize: 42,
  },
  wordmarkSm: {
    fontSize: 28,
  },
});
