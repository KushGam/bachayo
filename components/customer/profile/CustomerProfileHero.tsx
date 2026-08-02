import { LinearGradient } from 'expo-linear-gradient';
import { Pencil } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { getInitials } from '@/lib/helpers';
import { getOptimizedImageUrl } from '@/lib/images';

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
      colors={[Palette.primaryDarker, Palette.primaryDark, '#C24F28']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glowA} pointerEvents="none" />
      <View style={styles.glowB} pointerEvents="none" />

      <View style={styles.topRow}>
        <Text style={styles.title}>Profile</Text>
        {isSignedIn ? (
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            accessibilityLabel="Edit profile"
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}>
            <Pencil size={15} color={Palette.white} strokeWidth={2.2} />
          </Pressable>
        ) : (
          <View style={styles.editPlaceholder} />
        )}
      </View>

      <View style={styles.identity}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <AppImage
                source={{ uri: getOptimizedImageUrl(avatarUrl, 'avatar') }}
                style={styles.avatarImage}
                priority="high"
              />
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  glowA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -110,
    right: -70,
  },
  glowB: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,0,0,0.08)',
    bottom: -50,
    left: -40,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.6,
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPlaceholder: {
    width: 38,
    height: 38,
  },
  pressed: {
    opacity: 0.85,
  },
  identity: {
    alignItems: 'center',
    gap: 6,
  },
  avatarRing: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 52,
    padding: 3,
    marginBottom: 6,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.5,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.white,
    textAlign: 'center',
    letterSpacing: -0.45,
  },
  contact: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: '90%',
  },
  loadError: {
    ...Type.caption,
    color: '#FECACA',
    textAlign: 'center',
    marginTop: 4,
  },
});
