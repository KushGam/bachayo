import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { LastBagBagIcon } from '@/components/brand/LastBagBagIcon';

type LastBagLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  /** row = header/nav; stack = welcome/hero */
  layout?: 'row' | 'stack';
  style?: ViewStyle;
};

const SIZES = {
  sm: { icon: 28, text: 20, tagline: 11 },
  md: { icon: 36, text: 26, tagline: 13 },
  lg: { icon: 80, text: 36, tagline: 15 },
} as const;

export function LastBagLogo({
  size = 'md',
  variant = 'light',
  showTagline = false,
  layout = 'row',
  style,
}: LastBagLogoProps) {
  const s = SIZES[size];
  const textColor = variant === 'dark' ? '#FFFFFF' : '#1A1A1A';
  const isStack = layout === 'stack';

  return (
    <View
      style={[isStack ? styles.stack : styles.row, style]}
      accessibilityLabel="LastBag"
      accessible>
      <LastBagBagIcon size={s.icon} />
      <View style={isStack ? styles.stackText : undefined}>
        <Text
          style={{
            fontSize: s.text,
            fontWeight: '900',
            letterSpacing: -0.5,
            color: textColor,
            marginTop: isStack ? 16 : 0,
            textAlign: isStack ? 'center' : 'left',
          }}>
          Last
          <Text style={{ color: '#D85A30' }}>Bag</Text>
        </Text>
        {showTagline ? (
          <Text
            style={{
              fontSize: s.tagline,
              color: variant === 'dark' ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
              marginTop: 2,
              textAlign: isStack ? 'center' : 'left',
            }}>
            Rescue food. Save money.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackText: {
    alignItems: 'center',
  },
});
