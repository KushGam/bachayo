import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/Colors';

type LastBagLeafIconProps = {
  size?: number;
  color?: string;
};

/**
 * Leaf + rescue-bag mark — matches generated app icon assets.
 */
export function LastBagLeafIcon({
  size = 24,
  color = Palette.white,
}: LastBagLeafIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M50 14 L62 30 L58 44 L54 48 L62 50 L66 56 L78 58 L82 68 L80 80 L50 88 L20 80 L18 68 L22 58 L34 56 L38 50 L46 48 L42 44 L38 30 Z"
        fill={color}
      />
      <Path
        d="M50 18 L50 46"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}
