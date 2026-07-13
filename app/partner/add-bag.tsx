import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Camera, ChevronLeft, Clock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppSymbol } from '@/components/ui/AppSymbol';
import { BagPreviewCard } from '@/components/partner/BagPreviewCard';
import { ConfettiBurst } from '@/components/partner/ConfettiBurst';
import { Button } from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/Skeleton';
import {
  CATEGORY_BAG_CONFIG,
  MART_BAG_TYPES,
  type BagPreset,
  type MartBagType,
} from '@/constants/partnerBagPresets';
import { getCategoryById, getCategoryQuantityDefaults } from '@/constants/partnerCategories';
import { Palette } from '@/constants/Colors';
import { Spacing } from '@/constants/theme';
import { formatRsNpr, getTodayIsoDateLocal } from '@/lib/helpers';
import { hapticButtonPress, hapticSuccess } from '@/lib/haptics';
import { celebrateMilestoneOnce } from '@/lib/partnerMilestones';
import { resolveBagImageUrl } from '@/lib/images';
import { supabase } from '@/lib/supabase';
import { useBagPrefillStore } from '@/store/useBagPrefillStore';
import {
  addBagSchema,
  estimateDiscountPct,
  estimateSavingsNpr,
  formatTimeForDb,
  formatTimeFromDate,
  nprToPaisa,
  type AddBagFormInput,
  type AddBagFormValues,
} from '@/lib/validation/partner';
import type { PartnerCategory } from '@/types/database';

const PRESET_EMOJI: Record<string, string> = {
  lunch: '🍛',
  dinner: '🍽',
  dalbhat: '🥘',
};

function defaultPickupTime(hours: number, minutes = 0) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function timeFromString(time: string) {
  const [h, m] = time.split(':').map(Number);
  return defaultPickupTime(h ?? 12, m ?? 0);
}

function formatDateTimeDisplay(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function pickupDurationLabel(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  const hours = minutes / 60;
  if (hours <= 0) return 'Pickup window';
  if (hours === 1) return '1 hour pickup window';
  if (Number.isInteger(hours)) return `${hours} hour pickup window`;
  return `${hours.toFixed(1)} hour pickup window`;
}

function presetDisplayLabel(preset: BagPreset) {
  const emoji = PRESET_EMOJI[preset.id];
  return emoji ? `${emoji} ${preset.label}` : preset.label;
}

function pickupPresetDisplayLabel(label: string) {
  if (label.toLowerCase().includes('lunch')) return `🌅 ${label}`;
  if (label.toLowerCase().includes('dinner')) return `🌆 ${label}`;
  if (label.toLowerCase().includes('morning')) return `🌅 ${label}`;
  if (label.toLowerCase().includes('evening') || label.toLowerCase().includes('afternoon')) {
    return `🌆 ${label}`;
  }
  return label;
}

type SavingsFeedback = {
  variant: 'empty' | 'warn' | 'good' | 'great' | 'error';
  icon: string;
  text: string;
};

type PickerSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function PickerSheet({ visible, title, onClose, children }: PickerSheetProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <View style={styles.pickerOverlay} pointerEvents="box-none">
      <Pressable style={styles.pickerBackdropFill} onPress={onClose} />
      <View style={[styles.pickerSheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.pickerDone}>Done</Text>
          </Pressable>
        </View>
        <View style={styles.pickerWheelWrap}>{children}</View>
      </View>
    </View>
  );
}

function openTimePicker(
  which: 'start' | 'end',
  setters: {
    setShowStartPicker: (v: boolean) => void;
    setShowEndPicker: (v: boolean) => void;
    setShowBestBeforePicker: (v: boolean) => void;
  },
) {
  void hapticButtonPress();
  setters.setShowStartPicker(which === 'start');
  setters.setShowEndPicker(which === 'end');
  setters.setShowBestBeforePicker(false);
}

export default function AddBagScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [partnerCover, setPartnerCover] = useState<string | null>(null);
  const [partnerCategory, setPartnerCategory] = useState<PartnerCategory>('restaurant');
  const [editingBagId, setEditingBagId] = useState<string | null>(null);
  const [loadingPartner, setLoadingPartner] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successPayload, setSuccessPayload] = useState<{
    title: string;
    priceNpr: number;
    pickup: string;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedPickupPreset, setSelectedPickupPreset] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showBestBeforePicker, setShowBestBeforePicker] = useState(false);
  const [pickupStartDate, setPickupStartDate] = useState(defaultPickupTime(12, 0));
  const [pickupEndDate, setPickupEndDate] = useState(defaultPickupTime(14, 0));
  const [bestBeforeDate, setBestBeforeDate] = useState(new Date());
  const [drinkIncluded, setDrinkIncluded] = useState(false);
  const [drinkName, setDrinkName] = useState('');
  const [martBagType, setMartBagType] = useState<MartBagType>('Mixed');
  const [showCo2Impact, setShowCo2Impact] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<'takeaway' | 'dinein' | 'both'>('both');
  const [dineInExtraCharge, setDineInExtraCharge] = useState('0');

  const config = CATEGORY_BAG_CONFIG[partnerCategory] ?? CATEGORY_BAG_CONFIG.restaurant;
  const quantityDefaults = getCategoryQuantityDefaults(partnerCategory);
  const categoryMeta = getCategoryById(partnerCategory);
  const checkScale = useSharedValue(0);

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
      description: '',
      original_price_npr: '',
      rescue_price_npr: '',
      quantity_available: quantityDefaults.default,
      pickup_start: '12:00',
      pickup_end: '14:00',
      image_url: '',
    },
  });

  const title = watch('title');
  const description = watch('description');
  const originalPrice = watch('original_price_npr');
  const rescuePrice = watch('rescue_price_npr');
  const quantity = watch('quantity_available');
  const pickupStart = watch('pickup_start');
  const pickupEnd = watch('pickup_end');

  const savings = useMemo(() => {
    const original = Number(originalPrice) || 0;
    const rescue = Number(rescuePrice) || 0;
    return {
      amount: estimateSavingsNpr(original, rescue),
      pct: estimateDiscountPct(original, rescue),
    };
  }, [originalPrice, rescuePrice]);

  const isFormReady =
    title.trim().length >= 2 &&
    Number(originalPrice) > 0 &&
    Number(rescuePrice) > 0 &&
    Number(rescuePrice) < Number(originalPrice) &&
    quantity >= 1 &&
    pickupStart &&
    pickupEnd;

  useEffect(() => {
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setLoadingPartner(false);
        return;
      }

      const { data } = await supabase
        .from('partners')
        .select('id, name, cover_image_url, category')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setPartnerId(data.id);
        setPartnerName(data.name);
        setPartnerCover(data.cover_image_url);
        const cat = (data.category ?? 'restaurant') as PartnerCategory;
        setPartnerCategory(cat);
        const qtyDefaults = getCategoryQuantityDefaults(cat);
        setValue('quantity_available', qtyDefaults.default);
        const cfg = CATEGORY_BAG_CONFIG[cat] ?? CATEGORY_BAG_CONFIG.restaurant;
        if (cfg.pickupPresets[0]) {
          applyPickupPreset(cfg.pickupPresets[0].start, cfg.pickupPresets[0].end, cfg.pickupPresets[0].label);
        }
      }
      setLoadingPartner(false);
    })();
  }, [setValue]);

  useEffect(() => {
    if (loadingPartner) return;
    const prefill = useBagPrefillStore.getState().consumePrefill();
    if (!prefill) return;

    setValue('title', prefill.title, { shouldValidate: true });
    if (prefill.description) {
      setValue('description', prefill.description, { shouldValidate: true });
    }
    setValue('original_price_npr', String(Math.round(prefill.original_price / 100)), {
      shouldValidate: true,
    });
    setValue('rescue_price_npr', String(Math.round(prefill.rescue_price / 100)), {
      shouldValidate: true,
    });
    setValue('quantity_available', prefill.quantity_available, { shouldValidate: true });
    setPickupStartDate(timeFromString(prefill.pickup_start));
    setPickupEndDate(timeFromString(prefill.pickup_end));
    setValue('pickup_start', prefill.pickup_start, { shouldValidate: true });
    setValue('pickup_end', prefill.pickup_end, { shouldValidate: true });
    if (prefill.id) setEditingBagId(prefill.id);
    if (prefill.image_url) {
      setImageUri(prefill.image_url);
      setImageMimeType(null);
      setValue('image_url', prefill.image_url);
    }
    if (prefill.service_type) setServiceType(prefill.service_type);
    setDineInExtraCharge(String(Math.round((prefill.dinein_extra_charge ?? 0) / 100)));
  }, [loadingPartner, setValue]);

  const applyPickupPreset = (start: string, end: string, label?: string) => {
    setPickupStartDate(timeFromString(start));
    setPickupEndDate(timeFromString(end));
    setValue('pickup_start', start, { shouldValidate: true });
    setValue('pickup_end', end, { shouldValidate: true });
    if (label) setSelectedPickupPreset(label);
  };

  const applyPreset = (preset: BagPreset) => {
    void hapticButtonPress();
    setSelectedPresetId(preset.id);
    setValue('title', preset.title, { shouldValidate: true });
    setValue('description', preset.description, { shouldValidate: true });
    if (preset.originalPrice) setValue('original_price_npr', String(preset.originalPrice));
    if (preset.rescuePrice) setValue('rescue_price_npr', String(preset.rescuePrice));
    applyPickupPreset(preset.pickupStart, preset.pickupEnd);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    void hapticButtonPress();
    const launcher =
      source === 'camera'
        ? ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [16, 9], quality: 0.8 })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });
    const result = await launcher;
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? asset.type;
      if (mimeType && !mimeType.startsWith('image/')) {
        Alert.alert('Please select an image file');
        return;
      }
      setImageUri(asset.uri);
      setImageMimeType(asset.mimeType ?? (asset.type === 'image' ? 'image/jpeg' : null));
      setValue('image_url', asset.uri);
    }
  };

  const showPhotoOptions = () => {
    void hapticButtonPress();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Camera', 'Photo Library', 'Cancel'], cancelButtonIndex: 2 },
        (index) => {
          if (index === 0) void pickImage('camera');
          if (index === 1) void pickImage('gallery');
        },
      );
      return;
    }

    Alert.alert('Add photo', undefined, [
      { text: 'Camera', onPress: () => void pickImage('camera') },
      { text: 'Photo Library', onPress: () => void pickImage('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const buildExtraDescription = (base: string) => {
    const parts = [base.trim()];
    if (partnerCategory === 'cafe' && drinkIncluded && drinkName.trim()) {
      parts.push(`Includes drink: ${drinkName.trim()}`);
    }
    if (partnerCategory === 'mart') {
      parts.push(`Bag type: ${martBagType}`);
      parts.push(`Best before: ${bestBeforeDate.toLocaleDateString('en-NP')}`);
    }
    if (partnerCategory === 'hotel' && showCo2Impact) {
      const rescue = Number(rescuePrice) || 0;
      const co2 = Math.round((rescue / 100) * 0.5 * 10) / 10;
      parts.push(`Estimated CO₂ saved: ~${co2} kg`);
    }
    return parts.filter(Boolean).join('\n');
  };

  const onSubmit = async (values: AddBagFormValues) => {
    if (!partnerId) {
      setSubmitError('Partner profile not found. Complete onboarding first.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (!imageUri) {
        throw new Error('Please add a photo of the rescue bag before listing.');
      }

      const imageUrl = await resolveBagImageUrl(partnerId, imageUri, imageMimeType);
      if (!imageUrl) {
        throw new Error('Could not upload bag photo. Please try again.');
      }

      const bagPayload = {
        title: values.title,
        description: buildExtraDescription(values.description ?? '') || null,
        original_price: nprToPaisa(values.original_price_npr),
        rescue_price: nprToPaisa(values.rescue_price_npr),
        quantity_available: values.quantity_available,
        pickup_start: formatTimeForDb(values.pickup_start),
        pickup_end: formatTimeForDb(values.pickup_end),
        image_url: imageUrl,
        status: 'active' as const,
        service_type: serviceType,
        dinein_extra_charge: Math.max(0, Number(dineInExtraCharge) || 0) * 100,
      };

      const { error } = editingBagId
        ? await supabase.from('rescue_bags').update(bagPayload).eq('id', editingBagId)
        : await supabase.from('rescue_bags').insert({
            ...bagPayload,
            partner_id: partnerId,
            available_date: getTodayIsoDateLocal(),
          });

      if (error) throw error;

      void hapticSuccess();
      if (!editingBagId) {
        const first = await celebrateMilestoneOnce('bagListed');
        if (first) setShowConfetti(true);
      }

      setSuccessPayload({
        title: values.title,
        priceNpr: values.rescue_price_npr,
        pickup: `${values.pickup_start.slice(0, 5)} – ${values.pickup_end.slice(0, 5)}`,
      });
      checkScale.value = withSpring(1, { damping: 12, stiffness: 140, duration: 300 });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to list bag');
    } finally {
      setSubmitting(false);
    }
  };

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const shareWhatsApp = async () => {
    if (!successPayload) return;
    const message = `We just listed a rescue bag on LastBag! Get ${successPayload.title} for only ${formatRsNpr(successPayload.priceNpr)}. Pick up ${successPayload.pickup}. Download LastBag!`;
    try {
      await Share.share({ message });
    } catch {
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    }
  };

  const savingsFeedback = useMemo((): SavingsFeedback => {
    const original = Number(originalPrice) || 0;
    const rescue = Number(rescuePrice) || 0;

    if (rescue > original && original > 0) {
      return {
        variant: 'error',
        icon: '⚠️',
        text: 'Rescue price must be less than original',
      };
    }

    if (!original || !rescue) {
      return {
        variant: 'empty',
        icon: '',
        text: 'Enter prices to see savings',
      };
    }

    if (savings.pct < 30) {
      return {
        variant: 'warn',
        icon: '⚠️',
        text: `Only ${savings.pct}% off — usually 50%+ attracts more customers`,
      };
    }

    if (savings.pct >= 50) {
      return {
        variant: 'great',
        icon: '🎉',
        text: `Great deal! Customers save ${formatRsNpr(savings.amount)} (${savings.pct}% off)`,
      };
    }

    return {
      variant: 'good',
      icon: '✓',
      text: `Customers save ${formatRsNpr(savings.amount)} (${savings.pct}% off)`,
    };
  }, [originalPrice, rescuePrice, savings.amount, savings.pct]);

  if (successPayload) {
    return (
      <View style={[styles.successScreen, { paddingTop: insets.top + Spacing.xl }]}>
        <StatusBar style="light" />
        <ConfettiBurst active={showConfetti} onDone={() => setShowConfetti(false)} />
        <Animated.View style={[styles.successIcon, checkStyle]}>
          <AppSymbol ios="checkmark" android="check" size={40} color={Palette.primary} />
        </Animated.View>
        <Text style={styles.successTitle}>Your bag is live!</Text>
        <Text style={styles.successSubtitle}>Customers nearby can see it now</Text>
        <Button label="Share on WhatsApp" onPress={shareWhatsApp} style={styles.whatsappBtn} />
        <Pressable
          onPress={() => router.replace('/(tabs)/partner/dashboard')}
          style={styles.outlineBtn}>
          <Text style={styles.outlineBtnText}>Back to dashboard</Text>
        </Pressable>
      </View>
    );
  }

  if (loadingPartner) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <ListSkeleton count={2} />
      </View>
    );
  }

  const bestBeforeIsToday =
    partnerCategory === 'mart' && bestBeforeDate.toDateString() === new Date().toDateString();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerTopRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={20} color={Palette.white} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.pageTitle}>
              {editingBagId ? 'Edit rescue bag' : 'List rescue bag'}
            </Text>
            {categoryMeta ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {categoryMeta.icon} {categoryMeta.label}
                </Text>
              </View>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
          <Text style={styles.headerSubtitle}>Goes live immediately after listing</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.presetRow}>
          {config.presets.map((preset) => {
            const active = selectedPresetId === preset.id;
            return (
              <Pressable
                key={preset.id}
                onPress={() => applyPreset(preset)}
                style={[styles.presetPill, active && styles.presetPillActive]}>
                <Text style={[styles.presetText, active && styles.presetTextActive]}>
                  {presetDisplayLabel(preset)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.formCard}>
          <Controller
            control={control}
            name="title"
            render={({ field: { value, onChange } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Bag name</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={value}
                    onChangeText={(text) => onChange(text.slice(0, 50))}
                    placeholder={config.namePlaceholder}
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => setFocusedField('title')}
                    onBlur={() => setFocusedField(null)}
                    style={[
                      styles.input,
                      focusedField === 'title' && styles.inputFocused,
                      errors.title && styles.inputError,
                    ]}
                  />
                  <Text style={styles.charCount}>{Math.min(value.length, 50)}/50</Text>
                </View>
                {errors.title?.message ? (
                  <Text style={styles.fieldError}>{errors.title.message}</Text>
                ) : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>What&apos;s inside</Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder={config.insideHint}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  scrollEnabled={false}
                  textAlignVertical="top"
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  style={[
                    styles.input,
                    styles.multiline,
                    focusedField === 'description' && styles.inputFocused,
                    errors.description && styles.inputError,
                  ]}
                />
                <Text style={styles.hint}>Be honest — it builds trust and better reviews</Text>
                {errors.description?.message ? (
                  <Text style={styles.fieldError}>{errors.description.message}</Text>
                ) : null}
              </View>
            )}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Pricing</Text>
            <Text style={styles.hint}>{config.priceRangeHint}</Text>
            <View style={styles.priceFieldsRow}>
              <Controller
                control={control}
                name="original_price_npr"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.priceField}>
                    <Text style={styles.priceFieldLabel}>Original price</Text>
                    <View
                      style={[
                        styles.priceInputWrap,
                        focusedField === 'original' && styles.inputFocused,
                      ]}>
                      <Text style={styles.currency}>Rs</Text>
                      <TextInput
                        value={value}
                        onChangeText={(text) => onChange(text.replace(/[^\d]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="500"
                        placeholderTextColor="#9CA3AF"
                        onFocus={() => setFocusedField('original')}
                        onBlur={() => setFocusedField(null)}
                        style={styles.priceInput}
                      />
                    </View>
                  </View>
                )}
              />
              <Controller
                control={control}
                name="rescue_price_npr"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.priceField}>
                    <Text style={styles.priceFieldLabel}>Rescue price</Text>
                    <View
                      style={[
                        styles.priceInputWrap,
                        focusedField === 'rescue' && styles.inputFocused,
                      ]}>
                      <Text style={styles.currency}>Rs</Text>
                      <TextInput
                        value={value}
                        onChangeText={(text) => onChange(text.replace(/[^\d]/g, ''))}
                        keyboardType="number-pad"
                        placeholder="150"
                        placeholderTextColor="#9CA3AF"
                        onFocus={() => setFocusedField('rescue')}
                        onBlur={() => setFocusedField(null)}
                        style={styles.priceInput}
                      />
                    </View>
                  </View>
                )}
              />
            </View>

            <View
              style={[
                styles.savingsCard,
                savingsFeedback.variant === 'empty' && styles.savingsEmpty,
                savingsFeedback.variant === 'warn' && styles.savingsWarn,
                savingsFeedback.variant === 'good' && styles.savingsGood,
                savingsFeedback.variant === 'great' && styles.savingsGreat,
                savingsFeedback.variant === 'error' && styles.savingsError,
              ]}>
              {savingsFeedback.icon ? (
                <Text style={styles.savingsIcon}>{savingsFeedback.icon}</Text>
              ) : null}
              <Text
                style={[
                  styles.savingsText,
                  savingsFeedback.variant === 'empty' && styles.savingsTextEmpty,
                  savingsFeedback.variant === 'warn' && styles.savingsTextWarn,
                  (savingsFeedback.variant === 'good' || savingsFeedback.variant === 'great') &&
                    styles.savingsTextGood,
                  savingsFeedback.variant === 'great' && styles.savingsTextGreat,
                  savingsFeedback.variant === 'error' && styles.savingsTextError,
                ]}>
                {savingsFeedback.text}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Number of bags</Text>
            <Controller
              control={control}
              name="quantity_available"
              render={({ field: { value, onChange } }) => (
                <>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => {
                        void hapticButtonPress();
                        onChange(Math.max(quantityDefaults.min, value - 1));
                      }}
                      disabled={value <= quantityDefaults.min}
                      style={[styles.stepperBtn, value <= quantityDefaults.min && styles.stepperBtnDisabled]}>
                      <Text style={styles.stepperMinus}>−</Text>
                    </Pressable>
                    <Text style={styles.stepperValue}>{value}</Text>
                    <Pressable
                      onPress={() => {
                        void hapticButtonPress();
                        onChange(Math.min(quantityDefaults.max, value + 1));
                      }}
                      disabled={value >= quantityDefaults.max}
                      style={[
                        styles.stepperBtnPlus,
                        value >= quantityDefaults.max && styles.stepperBtnDisabled,
                      ]}>
                      <Text style={styles.stepperPlus}>+</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.quantityMaxHint}>
                    Maximum {quantityDefaults.max} bags for your plan
                  </Text>
                </>
              )}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Pickup window</Text>
            {config.pickupPresets.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickupPresetRow}>
                {config.pickupPresets.map((preset) => {
                  const active = selectedPickupPreset === preset.label;
                  return (
                    <Pressable
                      key={preset.label}
                      onPress={() => {
                        void hapticButtonPress();
                        applyPickupPreset(preset.start, preset.end, preset.label);
                      }}
                      style={[styles.presetPill, active && styles.presetPillActive]}>
                      <Text style={[styles.presetText, active && styles.presetTextActive]}>
                        {pickupPresetDisplayLabel(preset.label)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            <View style={styles.timeBoxesRow}>
              <Pressable
                onPress={() =>
                  openTimePicker('start', {
                    setShowStartPicker,
                    setShowEndPicker,
                    setShowBestBeforePicker,
                  })
                }
                style={styles.timeBox}>
                <Text style={styles.timeBoxLabel}>From</Text>
                <View style={styles.timeBoxBottom}>
                  <Text style={styles.timeBoxValue}>{formatDateTimeDisplay(pickupStartDate)}</Text>
                  <Clock size={16} color="#9CA3AF" strokeWidth={2} />
                </View>
              </Pressable>
              <Pressable
                onPress={() =>
                  openTimePicker('end', {
                    setShowStartPicker,
                    setShowEndPicker,
                    setShowBestBeforePicker,
                  })
                }
                style={styles.timeBox}>
                <Text style={styles.timeBoxLabel}>Until</Text>
                <View style={styles.timeBoxBottom}>
                  <Text style={styles.timeBoxValue}>{formatDateTimeDisplay(pickupEndDate)}</Text>
                  <Clock size={16} color="#9CA3AF" strokeWidth={2} />
                </View>
              </Pressable>
            </View>

            <View style={styles.durationPill}>
              <Text style={styles.durationPillText}>
                {pickupDurationLabel(
                  formatTimeFromDate(pickupStartDate),
                  formatTimeFromDate(pickupEndDate),
                )}
              </Text>
            </View>
          </View>

          {partnerCategory === 'cafe' ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Drink included?</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  onPress={() => setDrinkIncluded(false)}
                  style={[styles.toggleBtn, !drinkIncluded && styles.toggleBtnActive]}>
                  <Text style={[styles.toggleText, !drinkIncluded && styles.toggleTextActive]}>No</Text>
                </Pressable>
                <Pressable
                  onPress={() => setDrinkIncluded(true)}
                  style={[styles.toggleBtn, drinkIncluded && styles.toggleBtnActive]}>
                  <Text style={[styles.toggleText, drinkIncluded && styles.toggleTextActive]}>Yes</Text>
                </Pressable>
              </View>
              {drinkIncluded ? (
                <TextInput
                  value={drinkName}
                  onChangeText={setDrinkName}
                  placeholder="What drink? e.g. Tea or coffee"
                  placeholderTextColor="#9CA3AF"
                  onFocus={() => setFocusedField('drink')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.input, focusedField === 'drink' && styles.inputFocused]}
                />
              ) : null}
            </View>
          ) : null}

          {partnerCategory === 'mart' ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Bag category</Text>
              <View style={styles.pickupPresetRowWrap}>
                {MART_BAG_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setMartBagType(type)}
                    style={[styles.presetPill, martBagType === type && styles.presetPillActive]}>
                    <Text style={[styles.presetText, martBagType === type && styles.presetTextActive]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={() => {
                  void hapticButtonPress();
                  setShowStartPicker(false);
                  setShowEndPicker(false);
                  setShowBestBeforePicker(true);
                }}
                style={styles.timeBox}>
                <Text style={styles.timeBoxLabel}>Best before</Text>
                <Text style={styles.timeBoxValue}>
                  {bestBeforeDate.toLocaleDateString('en-NP')}
                </Text>
              </Pressable>
              {bestBeforeIsToday ? (
                <Text style={styles.warnText}>Going fast — list now!</Text>
              ) : null}
            </View>
          ) : null}

          {partnerCategory === 'hotel' ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Show CO₂ impact on listing?</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  onPress={() => setShowCo2Impact(false)}
                  style={[styles.toggleBtn, !showCo2Impact && styles.toggleBtnActive]}>
                  <Text style={[styles.toggleText, !showCo2Impact && styles.toggleTextActive]}>No</Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowCo2Impact(true)}
                  style={[styles.toggleBtn, showCo2Impact && styles.toggleBtnActive]}>
                  <Text style={[styles.toggleText, showCo2Impact && styles.toggleTextActive]}>Yes</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Photo (optional)</Text>
            {imageUri ? (
              <View style={[styles.photoZone, styles.photoZoneWithImage]}>
                <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="contain" />
                <Pressable
                  onPress={() => {
                    setImageUri(null);
                    setImageMimeType(null);
                    setValue('image_url', '');
                  }}
                  style={styles.photoRemoveBtn}
                  hitSlop={8}>
                  <Text style={styles.photoRemoveText}>×</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={showPhotoOptions} style={styles.photoZone}>
                <Camera size={32} color={Palette.primary} strokeWidth={1.8} />
                <Text style={styles.photoTitle}>Add a photo</Text>
                <Text style={styles.photoSubtitle}>Camera or photo library · Optional</Text>
              </Pressable>
            )}
            {!imageUri ? (
              <Text style={styles.hint}>No photo? We&apos;ll use your cover photo</Text>
            ) : null}
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.serviceHeader}>How can customers enjoy this bag?</Text>
            <View style={styles.serviceOptionsRow}>
              {[
                { key: 'takeaway', emoji: '🛍', title: 'Takeaway', subtitle: 'Customers collect' },
                { key: 'dinein', emoji: '🪑', title: 'Dine-in', subtitle: 'Eat here' },
                { key: 'both', emoji: '🍽', title: 'Both', subtitle: 'Customer chooses' },
              ].map((option) => {
                const active = serviceType === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => {
                      void hapticButtonPress();
                      setServiceType(option.key as 'takeaway' | 'dinein' | 'both');
                    }}
                    style={[styles.serviceOption, active && styles.serviceOptionActive]}>
                    <Text style={styles.serviceOptionEmoji}>{option.emoji}</Text>
                    <Text style={styles.serviceOptionTitle}>{option.title}</Text>
                    <Text style={styles.serviceOptionSubtitle}>{option.subtitle}</Text>
                  </Pressable>
                );
              })}
            </View>
            {serviceType !== 'takeaway' ? (
              <View style={styles.dineInChargeWrap}>
                <Text style={styles.dineInChargeLabel}>Extra charge for dine-in? (optional)</Text>
                <View style={styles.dineInChargeRow}>
                  <Text style={styles.dineInCurrency}>₨</Text>
                  <TextInput
                    value={dineInExtraCharge}
                    onChangeText={(text) => setDineInExtraCharge(text.replace(/[^\d]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    style={styles.dineInInput}
                  />
                  <Text style={styles.dineInHelper}>
                    + this amount added to rescue price for dine-in customers
                  </Text>
                </View>
                <View style={styles.dineInPreview}>
                  <Text style={styles.dineInPreviewText}>
                    Takeaway: {formatRsNpr(Number(rescuePrice) || 0)} · Dine-in:{' '}
                    {formatRsNpr((Number(rescuePrice) || 0) + (Number(dineInExtraCharge) || 0))}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Preview</Text>
            <BagPreviewCard
              title={title}
              originalPriceNpr={originalPrice}
              rescuePriceNpr={rescuePrice}
              discountPct={savings.pct}
              imageUri={imageUri}
              coverFallback={partnerCover}
              partnerName={partnerName}
              pickupStart={pickupStart}
              pickupEnd={pickupEnd}
            />
          </View>

          {submitError ? <Text style={styles.fieldError}>{submitError}</Text> : null}
        </View>
      </ScrollView>

      {Platform.OS === 'android' && showStartPicker ? (
        <DateTimePicker
          value={pickupStartDate}
          mode="time"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowStartPicker(false);
            if (event.type !== 'set' || !date) return;
            setPickupStartDate(date);
            setValue('pickup_start', formatTimeFromDate(date), { shouldValidate: true });
            setSelectedPickupPreset(null);
          }}
        />
      ) : null}

      {Platform.OS === 'android' && showEndPicker ? (
        <DateTimePicker
          value={pickupEndDate}
          mode="time"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowEndPicker(false);
            if (event.type !== 'set' || !date) return;
            setPickupEndDate(date);
            setValue('pickup_end', formatTimeFromDate(date), { shouldValidate: true });
            setSelectedPickupPreset(null);
          }}
        />
      ) : null}

      {Platform.OS === 'android' && showBestBeforePicker ? (
        <DateTimePicker
          value={bestBeforeDate}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowBestBeforePicker(false);
            if (event.type !== 'set' || !date) return;
            setBestBeforeDate(date);
          }}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <>
          <PickerSheet
            visible={showStartPicker}
            title="Pickup starts"
            onClose={() => setShowStartPicker(false)}>
            <DateTimePicker
              value={pickupStartDate}
              mode="time"
              display="spinner"
              themeVariant="light"
              textColor="#1A1A1A"
              locale="en-US"
              style={styles.pickerWheel}
              onChange={(_: DateTimePickerEvent, date?: Date) => {
                if (!date) return;
                setPickupStartDate(date);
                setValue('pickup_start', formatTimeFromDate(date), { shouldValidate: true });
                setSelectedPickupPreset(null);
              }}
            />
          </PickerSheet>

          <PickerSheet
            visible={showEndPicker}
            title="Pickup ends"
            onClose={() => setShowEndPicker(false)}>
            <DateTimePicker
              value={pickupEndDate}
              mode="time"
              display="spinner"
              themeVariant="light"
              textColor="#1A1A1A"
              locale="en-US"
              style={styles.pickerWheel}
              onChange={(_: DateTimePickerEvent, date?: Date) => {
                if (!date) return;
                setPickupEndDate(date);
                setValue('pickup_end', formatTimeFromDate(date), { shouldValidate: true });
                setSelectedPickupPreset(null);
              }}
            />
          </PickerSheet>

          <PickerSheet
            visible={showBestBeforePicker}
            title="Best before"
            onClose={() => setShowBestBeforePicker(false)}>
            <DateTimePicker
              value={bestBeforeDate}
              mode="date"
              display="spinner"
              themeVariant="light"
              textColor="#1A1A1A"
              locale="en-US"
              style={styles.pickerWheel}
              onChange={(_: DateTimePickerEvent, date?: Date) => {
                if (!date) return;
                setBestBeforeDate(date);
              }}
            />
          </PickerSheet>
        </>
      ) : null}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          disabled={!isFormReady || submitting}
          onPress={() => {
            void hapticButtonPress();
            void handleSubmit(onSubmit)();
          }}
          style={({ pressed }) => [
            styles.submitBtn,
            (!isFormReady || submitting) && styles.submitBtnDisabled,
            pressed && isFormReady && !submitting && { opacity: 0.92 },
          ]}>
          {submitting ? (
            <View style={styles.submitLoading}>
              <ActivityIndicator color={Palette.white} />
              <Text style={styles.submitText}>Listing...</Text>
            </View>
          ) : (
            <Text style={[styles.submitText, !isFormReady && styles.submitTextDisabled]}>
              {editingBagId
                ? 'Update bag — goes live immediately'
                : 'List bag now — goes live immediately'}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  content: { paddingBottom: 120 },
  header: {
    backgroundColor: Palette.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Palette.white,
    textAlign: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 110,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: Palette.white,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 36,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginTop: 6,
  },
  presetRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  presetPill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F0997B',
    backgroundColor: '#FAECE7',
    justifyContent: 'center',
  },
  presetPillActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.primaryDark,
  },
  presetTextActive: {
    color: Palette.white,
  },
  formCard: {
    backgroundColor: Palette.white,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  serviceHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  serviceOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: Palette.white,
    alignItems: 'center',
  },
  serviceOptionActive: {
    borderColor: Palette.primary,
    backgroundColor: '#FAECE7',
  },
  serviceOptionEmoji: {
    fontSize: 24,
  },
  serviceOptionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 6,
  },
  serviceOptionSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    textAlign: 'center',
  },
  dineInChargeWrap: {
    marginTop: 12,
  },
  dineInChargeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  dineInChargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dineInCurrency: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.primary,
  },
  dineInInput: {
    width: 100,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  dineInHelper: {
    flex: 1,
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  dineInPreview: {
    marginTop: 8,
    backgroundColor: '#F5F3EF',
    borderRadius: 8,
    padding: 8,
  },
  dineInPreviewText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  inputFocused: {
    borderColor: Palette.primary,
    backgroundColor: Palette.white,
  },
  inputError: {
    borderColor: Palette.dangerBorder,
  },
  multiline: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  charCount: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    fontSize: 11,
    color: '#9CA3AF',
  },
  priceFieldsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  priceField: {
    flex: 1,
    gap: 6,
  },
  priceFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  currency: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.primary,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  savingsCard: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  savingsEmpty: {
    backgroundColor: Palette.background,
    borderColor: Palette.background,
    justifyContent: 'center',
  },
  savingsWarn: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  savingsGood: {
    backgroundColor: '#ECFDF5',
    borderColor: '#ECFDF5',
  },
  savingsGreat: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  savingsError: {
    backgroundColor: Palette.dangerSoft,
    borderColor: Palette.dangerBorder,
  },
  savingsIcon: {
    fontSize: 14,
  },
  savingsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  savingsTextEmpty: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  savingsTextWarn: {
    color: '#92400E',
  },
  savingsTextGood: {
    color: '#065F46',
  },
  savingsTextGreat: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '600',
  },
  savingsTextError: {
    color: Palette.dangerText,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: 16,
    padding: 4,
    alignSelf: 'flex-start',
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  stepperBtnPlus: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  stepperMinus: {
    fontSize: 20,
    fontWeight: '600',
    color: Palette.primary,
    lineHeight: 22,
  },
  stepperPlus: {
    fontSize: 20,
    fontWeight: '600',
    color: Palette.white,
    lineHeight: 22,
  },
  stepperValue: {
    width: 56,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  quantityMaxHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  pickupPresetRow: {
    gap: 8,
    marginBottom: 10,
  },
  pickupPresetRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  timeBoxesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  timeBox: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  timeBoxLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  timeBoxBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeBoxValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 2,
  },
  durationPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAECE7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  durationPillText: {
    fontSize: 12,
    color: Palette.primaryDark,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: Palette.white,
  },
  warnText: {
    fontSize: 13,
    color: Palette.amber,
    fontWeight: '700',
    marginTop: 6,
  },
  photoZone: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F0997B',
    borderStyle: 'dashed',
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  photoZoneWithImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: undefined,
    borderStyle: 'solid',
    padding: 0,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.white,
    lineHeight: 18,
  },
  photoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.primary,
  },
  photoSubtitle: {
    fontSize: 12,
    color: '#F0997B',
  },
  previewSection: {
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
    elevation: 2000,
    justifyContent: 'flex-end',
  },
  pickerBackdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pickerDone: {
    color: Palette.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerWheelWrap: {
    width: '100%',
    height: 216,
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  pickerWheel: {
    width: '100%',
    height: 216,
  },
  fieldError: {
    color: Palette.danger,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Palette.white,
    borderTopWidth: 0.5,
    borderTopColor: '#F0EDE8',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  submitBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#F0EDE8',
  },
  submitLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.white,
  },
  submitTextDisabled: {
    color: '#9CA3AF',
  },
  successScreen: {
    flex: 1,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: { fontSize: 24, fontWeight: '700', color: Palette.white },
  successSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  whatsappBtn: { backgroundColor: '#25D366', marginTop: Spacing.lg, alignSelf: 'stretch' },
  outlineBtn: {
    borderWidth: 2,
    borderColor: Palette.white,
    borderRadius: 999,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '700', color: Palette.white },
});
