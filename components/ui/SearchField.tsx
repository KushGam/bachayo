import { Search } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';

export const SEARCH_FIELD_HEIGHT = 48;

type SearchFieldProps = Omit<TextInputProps, 'style'> & {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: TextInputProps['style'];
  trailing?: ReactNode;
  height?: number;
};

export function SearchField({
  containerStyle,
  inputStyle,
  trailing,
  height = SEARCH_FIELD_HEIGHT,
  placeholderTextColor = Palette.textTertiary,
  ...inputProps
}: SearchFieldProps) {
  return (
    <View style={[styles.row, { height }, containerStyle]}>
      <View style={styles.iconWrap}>
        <Search size={16} color={Palette.textTertiary} strokeWidth={2} />
      </View>
      <TextInput
        placeholderTextColor={placeholderTextColor}
        style={[styles.input, inputStyle]}
        {...inputProps}
      />
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: Palette.textPrimary,
    paddingVertical: 0,
    margin: 0,
    minWidth: 0,
    ...Platform.select({
      ios: {
        lineHeight: 20,
        paddingTop: 0,
        paddingBottom: 0,
      },
      android: {
        textAlignVertical: 'center',
        includeFontPadding: false,
        paddingVertical: 0,
      },
    }),
  },
});
