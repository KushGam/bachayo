import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Palette } from '@/constants/Colors';
import { Motion, Radius, Spacing, Type } from '@/constants/theme';
import { hapticButtonPress } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?: boolean;
};

const SIZE_STYLES: Record<ButtonSize, { height: number; paddingHorizontal: number }> = {
  md: { height: 48, paddingHorizontal: Spacing.lg },
  lg: { height: 56, paddingHorizontal: Spacing.xl },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  style,
  labelStyle,
  fullWidth = true,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;
  const sizeStyle = SIZE_STYLES[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withSpring(0.97, { damping: 18, stiffness: 400, duration: Motion.fast });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 400, duration: Motion.fast });
  };

  const handlePress = () => {
    if (isDisabled) return;
    void hapticButtonPress();
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.base,
        { height: sizeStyle.height, paddingHorizontal: sizeStyle.paddingHorizontal },
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        variant === 'link' && styles.link,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'secondary' || variant === 'ghost' ? Palette.primary : Palette.white}
            style={styles.spinner}
          />
        ) : null}
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.primaryLabel,
            variant === 'secondary' && styles.secondaryLabel,
            variant === 'ghost' && styles.ghostLabel,
            variant === 'danger' && styles.dangerLabel,
            variant === 'link' && styles.linkLabel,
            loading && styles.labelHidden,
            labelStyle,
          ]}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: Palette.primary,
  },
  secondary: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.pill,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: Radius.md,
  },
  danger: {
    backgroundColor: Palette.danger,
  },
  link: {
    backgroundColor: 'transparent',
    borderRadius: Radius.md,
    height: 40,
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  spinner: {
    position: 'absolute',
  },
  label: {
    ...Type.bodyMedium,
    fontWeight: '600',
    fontSize: 16,
  },
  labelHidden: {
    opacity: 0,
  },
  primaryLabel: {
    color: Palette.white,
  },
  secondaryLabel: {
    color: Palette.primaryDark,
  },
  ghostLabel: {
    color: Palette.textSecondary,
  },
  dangerLabel: {
    color: Palette.white,
  },
  linkLabel: {
    color: Palette.primary,
    fontWeight: '500',
    fontSize: 15,
  },
});
