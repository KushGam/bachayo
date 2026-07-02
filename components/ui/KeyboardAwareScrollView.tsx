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
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
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
