import { Clock } from 'lucide-react-native';
import { StyleSheet, Text, View, Image } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';
import { Palette } from '@/constants/Colors';
import { formatRsNpr } from '@/lib/helpers';
import { isLocalImageUri } from '@/lib/images';

type BagPreviewCardProps = {
  title: string;
  description?: string;
  originalPriceNpr?: string | number;
  rescuePriceNpr?: string | number;
  discountPct?: number;
  imageUri?: string | null;
  coverFallback?: string | null;
  partnerName?: string;
  pickupStart?: string;
  pickupEnd?: string;
};

function formatPickupDisplay(start?: string, end?: string) {
  if (!start || !end) return 'Pickup time';
  const format = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  return `${format(start)} – ${format(end)}`;
}

export function BagPreviewCard({
  title,
  originalPriceNpr,
  rescuePriceNpr,
  discountPct = 0,
  imageUri,
  coverFallback,
  partnerName,
  pickupStart,
  pickupEnd,
}: BagPreviewCardProps) {
  const original = Number(originalPriceNpr) || 0;
  const rescue = Number(rescuePriceNpr) || 0;
  const photoUri = imageUri || coverFallback || null;
  const hasPhoto = Boolean(photoUri);

  return (
    <View style={styles.card}>
      {hasPhoto ? (
        isLocalImageUri(photoUri) ? (
          <Image source={{ uri: photoUri! }} style={styles.image} resizeMode="cover" />
        ) : (
          <AppImage
            source={{
              uri:
                photoUri ||
                'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=60',
            }}
            style={styles.image}
            resizeMode="cover"
          />
        )
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderEmoji}>🛍</Text>
        </View>
      )}

      <View style={styles.body}>
        {partnerName ? <Text style={styles.partnerName}>{partnerName}</Text> : null}
        <Text numberOfLines={2} style={styles.title}>
          {title.trim() || 'Bag name...'}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.rescuePrice}>
            {rescue > 0 ? formatRsNpr(rescue) : 'Rs —'}
          </Text>
          {original > 0 ? (
            <Text style={styles.originalPrice}>{formatRsNpr(original)}</Text>
          ) : null}
          {discountPct > 0 ? (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>{discountPct}% off</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.pickupRow}>
          <Clock size={14} color="#9CA3AF" strokeWidth={2} />
          <Text style={styles.pickupText}>{formatPickupDisplay(pickupStart, pickupEnd)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#FAECE7',
  },
  imagePlaceholder: {
    aspectRatio: 16 / 9,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  body: {
    padding: 12,
    gap: 6,
  },
  partnerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  rescuePrice: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.primary,
  },
  originalPrice: {
    fontSize: 13,
    color: Palette.textSecondary,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  savingsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pickupText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
