import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FormField } from '@/components/auth/FormField';
import { Palette } from '@/constants/Colors';
import { getTodayIsoDateLocal } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import { uploadBagImage } from '@/lib/upload';
import {
  addBagSchema,
  estimateReachCount,
  formatTimeForDb,
  formatTimeFromDate,
  nprToPaisa,
  type AddBagFormValues,
  type AddBagFormInput,
} from '@/lib/validation/partner';

function defaultPickupTime(hours: number, minutes = 0) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export default function AddBagScreen() {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successReach, setSuccessReach] = useState<number | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickupStartDate, setPickupStartDate] = useState(defaultPickupTime(17, 0));
  const [pickupEndDate, setPickupEndDate] = useState(defaultPickupTime(19, 0));

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddBagFormInput, unknown, AddBagFormValues>({
    resolver: zodResolver(addBagSchema),
    defaultValues: {
      title: '',
      title_np: '',
      description: '',
      original_price_npr: '',
      rescue_price_npr: '',
      quantity_available: 1,
      pickup_start: formatTimeFromDate(defaultPickupTime(17, 0)),
      pickup_end: formatTimeFromDate(defaultPickupTime(19, 0)),
      image_url: '',
    },
  });

  const originalPrice = watch('original_price_npr');
  const rescuePrice = watch('rescue_price_npr');

  const discountPct = useMemo(() => {
    const original = Number(originalPrice) || 0;
    const rescue = Number(rescuePrice) || 0;
    if (original <= 0 || rescue <= 0 || rescue >= original) return 0;
    return Math.round(((original - rescue) / original) * 100);
  }, [originalPrice, rescuePrice]);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      setPartnerId(data?.id ?? null);
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setValue('image_url', result.assets[0].uri);
    }
  };

  const onStartTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (!date) return;
    setPickupStartDate(date);
    setValue('pickup_start', formatTimeFromDate(date), { shouldValidate: true });
  };

  const onEndTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (!date) return;
    setPickupEndDate(date);
    setValue('pickup_end', formatTimeFromDate(date), { shouldValidate: true });
  };

  const onSubmit = async (values: AddBagFormValues) => {
    if (!partnerId) {
      setSubmitError('Partner profile not found. Complete onboarding first.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let imageUrl: string | null = null;
      if (imageUri?.startsWith('file')) {
        imageUrl = await uploadBagImage(partnerId, imageUri);
      }

      const { error } = await supabase.from('rescue_bags').insert({
        partner_id: partnerId,
        title: values.title,
        title_np: values.title_np,
        description: values.description?.trim() || null,
        original_price: nprToPaisa(values.original_price_npr),
        rescue_price: nprToPaisa(values.rescue_price_npr),
        quantity_available: values.quantity_available,
        pickup_start: formatTimeForDb(values.pickup_start),
        pickup_end: formatTimeForDb(values.pickup_end),
        available_date: getTodayIsoDateLocal(),
        status: 'active',
        image_url: imageUrl,
      });

      if (error) throw error;

      setSuccessReach(estimateReachCount(discountPct, values.quantity_available));
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to list bag');
    } finally {
      setSubmitting(false);
    }
  };

  if (successReach != null) {
    return (
      <View style={styles.successScreen}>
        <View style={styles.successIcon}>
          <SymbolView
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={36}
            tintColor={Palette.white}
          />
        </View>
        <Text style={styles.successTitle}>Bag is now live!</Text>
        <Text style={styles.successSubtitle}>
          Estimated reach: ~{successReach} nearby customers today
        </Text>
        <Pressable
          onPress={() => router.replace('/(tabs)/partner/dashboard')}
          style={({ pressed }) => [styles.successBtn, pressed && { opacity: 0.9 }]}>
          <Text style={styles.successBtnText}>Back to dashboard</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={Palette.textPrimary}
          />
        </Pressable>
        <Text style={styles.title}>List rescue bag</Text>
        <Text style={styles.subtitle}>Today&apos;s surplus bag for pickup</Text>
      </View>

      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange } }) => (
          <FormField
            label="Bag title (English)"
            value={value}
            onChangeText={onChange}
            error={errors.title?.message}
            placeholder="Dal Bhat Surprise Bag"
          />
        )}
      />

      <Controller
        control={control}
        name="title_np"
        render={({ field: { value, onChange } }) => (
          <FormField
            label="Bag title (Nepali)"
            value={value}
            onChangeText={onChange}
            error={errors.title_np?.message}
            placeholder="दाल भात सरप्राइज ब्याग"
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange } }) => (
          <FormField
            label="Description"
            value={value}
            onChangeText={onChange}
            error={errors.description?.message}
            placeholder="What's inside this surprise bag?"
            multiline
            numberOfLines={4}
            style={styles.multiline}
          />
        )}
      />

      <Text style={styles.label}>Original price (NPR)</Text>
      <Controller
        control={control}
        name="original_price_npr"
        render={({ field: { value, onChange } }) => (
          <View style={styles.priceRow}>
            <Text style={styles.currency}>₨</Text>
            <TextInput
              value={value}
              onChangeText={(text) => onChange(text.replace(/[^\d]/g, ''))}
              keyboardType="number-pad"
              placeholder="500"
              placeholderTextColor={Palette.textMuted}
              style={[styles.priceInput, errors.original_price_npr && styles.inputError]}
            />
          </View>
        )}
      />
      {errors.original_price_npr ? (
        <Text style={styles.fieldError}>{errors.original_price_npr.message}</Text>
      ) : null}

      <Text style={styles.label}>Rescue price (NPR)</Text>
      <Controller
        control={control}
        name="rescue_price_npr"
        render={({ field: { value, onChange } }) => (
          <View>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>₨</Text>
              <TextInput
                value={value}
                onChangeText={(text) => onChange(text.replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
                placeholder="150"
                placeholderTextColor={Palette.textMuted}
                style={[styles.priceInput, errors.rescue_price_npr && styles.inputError]}
              />
              {discountPct > 0 ? (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{discountPct}% off</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
      />
      {errors.rescue_price_npr ? (
        <Text style={styles.fieldError}>{errors.rescue_price_npr.message}</Text>
      ) : null}

      <Text style={styles.label}>Quantity available</Text>
      <Controller
        control={control}
        name="quantity_available"
        render={({ field: { value, onChange } }) => (
          <View style={styles.stepper}>
            <Pressable
              onPress={() => onChange(Math.max(1, value - 1))}
              style={styles.stepperBtn}>
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{value}</Text>
            <Pressable
              onPress={() => onChange(Math.min(20, value + 1))}
              style={styles.stepperBtn}>
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        )}
      />
      {errors.quantity_available ? (
        <Text style={styles.fieldError}>{errors.quantity_available.message}</Text>
      ) : null}

      <Text style={styles.label}>Pickup start time</Text>
      <Pressable onPress={() => setShowStartPicker(true)} style={styles.timeBtn}>
        <SymbolView
          name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
          size={18}
          tintColor={Palette.primary}
        />
        <Text style={styles.timeText}>{watch('pickup_start')}</Text>
      </Pressable>
      {showStartPicker ? (
        <DateTimePicker
          value={pickupStartDate}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartTimeChange}
        />
      ) : null}
      {errors.pickup_start ? (
        <Text style={styles.fieldError}>{errors.pickup_start.message}</Text>
      ) : null}

      <Text style={styles.label}>Pickup end time</Text>
      <Pressable onPress={() => setShowEndPicker(true)} style={styles.timeBtn}>
        <SymbolView
          name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
          size={18}
          tintColor={Palette.primary}
        />
        <Text style={styles.timeText}>{watch('pickup_end')}</Text>
      </Pressable>
      {showEndPicker ? (
        <DateTimePicker
          value={pickupEndDate}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndTimeChange}
        />
      ) : null}
      {errors.pickup_end ? (
        <Text style={styles.fieldError}>{errors.pickup_end.message}</Text>
      ) : null}

      <Text style={styles.label}>Photo (optional)</Text>
      <Pressable onPress={pickImage} style={styles.photoArea}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.photoPreview} />
        ) : (
          <Text style={styles.photoPlaceholder}>Tap to upload from camera roll</Text>
        )}
      </Pressable>

      {submitError ? <Text style={styles.fieldError}>{submitError}</Text> : null}

      <Pressable
        onPress={handleSubmit(onSubmit)}
        disabled={submitting}
        style={({ pressed }) => [
          styles.submitBtn,
          pressed && { opacity: 0.9 },
          submitting && { opacity: 0.6 },
        ]}>
        <Text style={styles.submitBtnText}>{submitting ? 'Publishing…' : 'Publish bag'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Palette.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  currency: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Palette.textPrimary,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: -10,
    marginBottom: 12,
    fontWeight: '600',
  },
  discountBadge: {
    backgroundColor: Palette.lightGreenBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  discountBadgeText: {
    color: Palette.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.white,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.primary,
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.white,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  photoArea: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
    borderStyle: 'dashed',
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  photoPlaceholder: {
    color: Palette.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  submitBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: Palette.white,
    fontWeight: '900',
    fontSize: 16,
  },
  successScreen: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: Palette.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  successBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  successBtnText: {
    color: Palette.white,
    fontWeight: '900',
    fontSize: 15,
  },
});
