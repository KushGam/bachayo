import { View, type ViewStyle } from 'react-native';

import { LastBagBagIcon } from '@/components/brand/LastBagBagIcon';

type AppMarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AppMarkSize, number> = {
  xs: 40,
  sm: 56,
  md: 72,
  lg: 96,
  xl: 120,
};

type AppMarkProps = {
  size?: AppMarkSize;
  /** kept for API compat — icon already includes terracotta tile */
  onDark?: boolean;
  style?: ViewStyle;
};

export function AppMark({ size = 'lg', style }: AppMarkProps) {
  const dimension = SIZES[size];

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <LastBagBagIcon size={dimension} />
    </View>
  );
}
