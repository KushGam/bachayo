import { ReactNode } from 'react';
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type DismissKeyboardViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Dismisses the keyboard when the user taps outside focused inputs. */
export function DismissKeyboardView({ children, style }: DismissKeyboardViewProps) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.flex, style]}>{children}</View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
