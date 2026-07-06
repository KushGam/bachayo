import { Clock, MapPin, Phone } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';

type PartnerDetailInfoCardProps = {
  locationLabel: string;
  hours: string;
  phone: string | null;
  onOpenMaps: () => void;
  onCall: () => void;
};

export function PartnerDetailInfoCard({
  locationLabel,
  hours,
  phone,
  onOpenMaps,
  onCall,
}: PartnerDetailInfoCardProps) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onOpenMaps} style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
        <View style={styles.iconCircle}>
          <MapPin size={16} color={Palette.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value} numberOfLines={2}>
          {locationLabel}
        </Text>
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.cell}>
        <View style={styles.iconCircle}>
          <Clock size={16} color={Palette.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.label}>Hours</Text>
        <Text style={styles.value} numberOfLines={2}>
          {hours}
        </Text>
      </View>

      <View style={styles.divider} />

      <Pressable onPress={onCall} style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
        <View style={styles.iconCircle}>
          <Phone size={16} color={Palette.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.label}>Call</Text>
        <Text style={[styles.value, !phone && styles.valueMuted]} numberOfLines={2}>
          {phone ?? 'Not listed'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...CardChrome,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'stretch',
    ...FloatingShadow,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.88,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  divider: {
    width: 1,
    backgroundColor: Palette.borderSubtle,
    marginVertical: 2,
  },
  label: {
    ...Type.label,
    color: Palette.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    ...Type.caption,
    fontWeight: '700',
    color: Palette.textPrimary,
    textAlign: 'center',
  },
  valueMuted: {
    color: Palette.textTertiary,
    fontWeight: '500',
  },
});
