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
      colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop }]}>
      <View style={styles.glowPrimary} pointerEvents="none" />
      <View style={styles.glowSecondary} pointerEvents="none" />

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
            <Pencil size={16} color={Palette.white} strokeWidth={2.2} />
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
        <View style={styles.contactPill}>
          <Text style={styles.contact} numberOfLines={1}>
            {contactLine}
          </Text>
        </View>
        {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 4,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
  },
  glowPrimary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -60,
  },
  glowSecondary: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -30,
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
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPlaceholder: {
    width: 40,
    height: 40,
  },
  pressed: {
    opacity: 0.88,
  },
  identity: {
    alignItems: 'center',
    gap: 8,
  },
  avatarRing: {
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 48,
    padding: 3,
    marginBottom: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: -0.5,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.white,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  contactPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxWidth: '92%',
  },
  contact: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadError: {
    ...Type.caption,
    color: '#FECACA',
    textAlign: 'center',
    marginTop: 2,
  },
});
