import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/Colors';

type StarRatingProps = {
  rating: number;
  size?: number;
  variant?: 'filled' | 'outline';
};

export function StarRating({ rating, size = 14, variant = 'filled' }: StarRatingProps) {
  const rounded = Math.round(rating);

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = variant === 'filled' && index < rounded;
        return (
          <Star
            key={index}
            size={size}
            color={filled ? Palette.primary : Palette.border}
            fill={filled ? Palette.primary : 'transparent'}
            strokeWidth={2}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
  },
});
