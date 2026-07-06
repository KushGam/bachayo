import { LinearGradient } from 'expo-linear-gradient';
import { Camera, MapPin, Store } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';

type PartnerProfileHeroProps = {
  coverHeight: number;
  coverUrl: string | null;
  businessName: string;
  categoryLabel: string;
  locationLabel: string;
  topInset: number;
  onEditCover: () => void;
};

export function PartnerProfileHero({
  coverHeight,
  coverUrl,
  businessName,
  categoryLabel,
  locationLabel,
  topInset,
  onEditCover,
}: PartnerProfileHeroProps) {
  return (
    <View style={[styles.wrap, { height: coverHeight }]}>
      {coverUrl ? (
        <AppImage source={{ uri: coverUrl }} style={[styles.cover, { height: coverHeight }]} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[Palette.primaryDarker, Palette.primaryDark, Palette.primary]}
          style={[styles.cover, { height: coverHeight }]}>
          <Store size={40} color="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        </LinearGradient>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.72)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.actions, { top: topInset + Spacing.sm }]}>
        <Pressable onPress={onEditCover} style={({ pressed }) => [styles.cameraBtn, pressed && styles.pressed]}>
          <Camera size={17} color={Palette.white} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.identity}>
        <Text style={styles.businessName} numberOfLines={2}>
          {businessName}
        </Text>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{categoryLabel}</Text>
        </View>
        <View style={styles.locationRow}>
          <MapPin size={13} color="rgba(255,255,255,0.8)" strokeWidth={2} />
          <Text style={styles.location} numberOfLines={1}>
            {locationLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    backgroundColor: Palette.primaryLight,
  },
  cover: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    position: 'absolute',
    right: Spacing.lg,
  },
  cameraBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  identity: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
    gap: 6,
  },
  businessName: {
    fontSize: 26,
    fontWeight: '700',
    color: Palette.white,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    ...Type.label,
    color: Palette.white,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: {
    flex: 1,
    ...Type.caption,
    color: 'rgba(255,255,255,0.82)',
  },
});
