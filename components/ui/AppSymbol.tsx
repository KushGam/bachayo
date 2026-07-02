import { MaterialIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { Platform, type ColorValue } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

type AppSymbolProps = {
  ios: SFSymbol;
  android: React.ComponentProps<typeof MaterialIcons>['name'];
  size?: number;
  color?: ColorValue;
};

/** SF Symbol on iOS, Material icon elsewhere. Never pass platform objects to SymbolView. */
export function AppSymbol({ ios, android, size = 24, color }: AppSymbolProps) {
  if (Platform.OS === 'ios') {
    return <SymbolView name={ios} size={size} tintColor={color} />;
  }

  return <MaterialIcons name={android} size={size} color={color} />;
}
