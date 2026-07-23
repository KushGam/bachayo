import Svg, { Line, Path, Rect } from 'react-native-svg';

type LastBagBagIconProps = {
  size?: number;
};

/**
 * Official LastBag bag mark — matches assets/images/lastbag-icon.svg
 */
export function LastBagBagIcon({ size = 36 }: LastBagBagIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityRole="image">
      <Rect width="1024" height="1024" fill="#D85A30" rx="220" />
      <Rect x="332" y="396" width="360" height="292" fill="white" rx="72" />
      <Path
        d="M 436,396 L 436,256 Q 436,148 512,148 Q 588,148 588,256 L 588,396"
        fill="none"
        stroke="white"
        strokeWidth="64"
        strokeLinecap="round"
      />
      <Path
        d="M 512,640 L 512,484 Q 512,412 450,412 Q 450,484 512,484 Q 574,484 574,412 Q 512,412 512,484"
        fill="#D85A30"
      />
      <Line
        x1="512"
        y1="640"
        x2="512"
        y2="490"
        stroke="#D85A30"
        strokeWidth="28"
        strokeLinecap="round"
      />
    </Svg>
  );
}
