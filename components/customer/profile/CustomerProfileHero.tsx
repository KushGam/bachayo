import { LinearGradient } from 'expo-linear-gradient';
import { Pencil } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import { getInitials } from '@/lib/helpers';

type CustomerProfileHeroProps = {
  name: string;
  contactLine: string;
  avatarUrl: string | null;
  isSignedIn: boolean;
  loadError: string | null;
  paddingTop: number;
  onEdit: () => void;
};

export function CustomerProfileHero({
  name,
  contactLine,
  avatarUrl,
  isSignedIn,
  loadError,
  paddingTop,
  onEdit,
}: CustomerProfileHeroProps) {
  return (
    <LinearGradient
      colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>Profile</Text>
        </View>
        {isSignedIn ? (
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}>
            <Pencil size={17} color={Palette.white} strokeWidth={2.2} />
          </Pressable>
        ) : (
          <View style={styles.editPlaceholder} />
        )}
      </View>

      <View style={styles.identity}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
            )}
          </View>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.contact} numberOfLines={1}>
          {contactLine}
        </Text>
        {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.lg + 8,
    borderBottomRightRadius: Radius.lg + 8,
    overflow: 'hidden',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -70,
    right: -50,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    ...Type.label,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPlaceholder: {
    width: 38,
    height: 38,
  },
  pressed: {
    opacity: 0.88,
  },
  identity: {
    alignItems: 'center',
    gap: 6,
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 44,
    padding: 3,
    marginBottom: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.white,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  contact: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    maxWidth: '90%',
  },
  loadError: {
    ...Type.caption,
    color: '#FECACA',
    textAlign: 'center',
    marginTop: 4,
  },
});
