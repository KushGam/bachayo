import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/Colors';

type StarRatingProps = {
  rating: number;
  size?: number;
  color?: string;
};

export function StarRating({ rating, size = 14, color = Palette.primary }: StarRatingProps) {
  const rounded = Math.round(rating);

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          color={color}
          fill={index < rounded ? color : 'transparent'}
          strokeWidth={2}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
