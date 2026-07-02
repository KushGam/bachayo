import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '@/components/ui/AppImage';

import { AuthButton } from '@/components/auth/AuthButton';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { PartnerListingPreview } from '@/components/partner/PartnerListingPreview';
import { Palette } from '@/constants/Colors';
import { Border, Radius, Spacing, Type } from '@/constants/theme';
import { toDbPartnerCategory, type PartnerCategoryOption } from '@/constants/partnerCategories';
import { hapticStepAdvance } from '@/lib/haptics';
import { formatTimeFromDate } from '@/lib/validation/partner';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 5;

function defaultTime(hours: number, minutes = 0) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export default function PartnerHoursPhotoScreen() {
  const router = useRouter();
  const { partner, setPartner } = useSignupStore();
  const [openingStartDate, setOpeningStartDate] = useState(defaultTime(10, 0));
  const [openingEndDate, setOpeningEndDate] = useState(defaultTime(21, 0));
  const [showOpeningStart, setShowOpeningStart] = useState(false);
  const [showOpeningEnd, setShowOpeningEnd] = useState(false);
  const [coverUri, setCoverUri] = useState<string | null>(partner.coverUri);

  const openingStart = partner.openingStart || formatTimeFromDate(openingStartDate);
  const openingEnd = partner.openingEnd || formatTimeFromDate(openingEndDate);

  const pickCover = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setCoverUri(result.assets[0].uri);
      }
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const onContinue = async () => {
    setPartner({
      openingStart,
      openingEnd,
      coverUri,
    });
    await hapticStepAdvance();
    router.push('/(auth)/signup-partner/verify');
  };

  return (
    <SignupStepShell
      currentStep={4}
      totalSteps={TOTAL_STEPS}
      title="Almost done"
      showBack
      onBack={() => router.back()}
      onContinue={onContinue}>
      <Text style={styles.fieldLabel}>Opening hours</Text>
      <View style={styles.timeRow}>
        <Pressable onPress={() => setShowOpeningStart(true)} style={styles.timeBtn}>
          <Text style={styles.timeLabel}>From</Text>
          <Text style={styles.timeValue}>{openingStart}</Text>
        </Pressable>
        <Pressable onPress={() => setShowOpeningEnd(true)} style={styles.timeBtn}>
          <Text style={styles.timeLabel}>To</Text>
          <Text style={styles.timeValue}>{openingEnd}</Text>
        </Pressable>
      </View>

      {showOpeningStart ? (
        <DateTimePicker
          value={openingStartDate}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_: DateTimePickerEvent, date?: Date) => {
            if (Platform.OS === 'android') setShowOpeningStart(false);
            if (!date) return;
            setOpeningStartDate(date);
            setPartner({ openingStart: formatTimeFromDate(date) });
          }}
        />
      ) : null}
      {showOpeningEnd ? (
        <DateTimePicker
          value={openingEndDate}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_: DateTimePickerEvent, date?: Date) => {
            if (Platform.OS === 'android') setShowOpeningEnd(false);
            if (!date) return;
            setOpeningEndDate(date);
            setPartner({ openingEnd: formatTimeFromDate(date) });
          }}
        />
      ) : null}

      <Text style={[styles.fieldLabel, styles.photoLabel]}>Cover photo</Text>
      <Pressable onPress={() => pickCover('gallery')} style={styles.uploadArea}>
        {coverUri ? (
          <AppImage source={{ uri: coverUri }} style={styles.coverPreview} />
        ) : (
          <Text style={styles.uploadText}>Tap to add cover photo</Text>
        )}
      </Pressable>
      <View style={styles.uploadActions}>
        <AuthButton label="Camera" variant="secondary" onPress={() => pickCover('camera')} />
        <AuthButton label="Gallery" variant="secondary" onPress={() => pickCover('gallery')} />
      </View>

      <Text style={styles.previewLabel}>How customers will see you</Text>
      <PartnerListingPreview
        name={partner.businessName || 'Your restaurant'}
        nameNp={partner.businessNameNp}
        category={toDbPartnerCategory(partner.category as PartnerCategoryOption)}
        address={`${partner.address}${partner.area ? `, ${partner.area}` : ''}`}
        coverUri={coverUri}
        showAvailability
      />
    </SignupStepShell>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginBottom: Spacing.sm,
  },
  photoLabel: {
    marginTop: Spacing.lg,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timeBtn: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: Border.width,
    borderColor: Palette.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  timeLabel: {
    ...Type.label,
    color: Palette.textSecondary,
  },
  timeValue: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  uploadArea: {
    height: 160,
    borderRadius: Radius.lg,
    borderWidth: Border.width,
    borderColor: Palette.border,
    borderStyle: 'dashed',
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadText: {
    ...Type.body,
    color: Palette.textSecondary,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  previewLabel: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: Spacing.sm,
  },
});
