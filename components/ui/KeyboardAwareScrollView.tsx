import { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';

type KeyboardAwareScrollViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  keyboardVerticalOffset?: number;
};

export function KeyboardAwareScrollView({
  children,
  style,
  contentContainerStyle,
  footer,
  keyboardVerticalOffset = 0,
}: KeyboardAwareScrollViewProps) {
  const keyboardInset = useKeyboardBottomInset();

  return (
    <KeyboardAvoidingView
      style={[
        styles.flex,
        style,
        Platform.OS === 'android' ? { paddingBottom: keyboardInset } : null,
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss}>
        {children}
      </ScrollView>
      {footer}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
