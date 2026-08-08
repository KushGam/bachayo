import { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DismissKeyboardView } from '@/components/ui/DismissKeyboardView';
import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';
import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';

type ScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
};

export function Screen({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardBottomInset();
  const backgroundColor = Palette.background;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      backgroundColor,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    style,
  ];

  if (scrollable) {
    return (
      <View style={containerStyle}>
        <KeyboardAvoidingView
          style={[
            styles.flex,
            Platform.OS === 'android' ? { paddingBottom: keyboardInset } : null,
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            onScrollBeginDrag={Keyboard.dismiss}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <DismissKeyboardView style={containerStyle}>
      <View style={[styles.content, contentContainerStyle]}>{children}</View>
    </DismissKeyboardView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
});
