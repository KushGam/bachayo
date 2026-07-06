import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LastBagLogo } from '@/components/auth/LastBagLogo';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type AuthScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showLogo?: boolean;
};

export function AuthScreenHeader({
  title,
  subtitle,
  onBack,
  showLogo = true,
}: AuthScreenHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />

      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back-ios-new" size={18} color={Palette.textPrimary} />
        </Pressable>
      ) : null}

      <View style={styles.content}>
        {showLogo ? (
          <View style={styles.logoRow}>
            <LastBagLogo size="sm" />
          </View>
        ) : null}

        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -48,
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Palette.primaryLight,
    opacity: 0.45,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  logoRow: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Type.display,
    color: Palette.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    ...Type.body,
    color: Palette.textSecondary,
    marginTop: Spacing.sm,
    maxWidth: 320,
    textAlign: 'center',
  },
});
