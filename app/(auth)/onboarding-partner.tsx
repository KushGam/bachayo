import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import { AuthButton } from '@/components/auth/AuthButton';
import { CategoryPicker } from '@/components/auth/CategoryPicker';
import { FormField } from '@/components/auth/FormField';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { StepProgress } from '@/components/auth/StepProgress';
import { Screen } from '@/components/Screen';
import { t } from '@/constants/i18n';
import { track } from '@/lib/analytics';
import { Palette } from '@/constants/Colors';
import { uploadPartnerCover } from '@/lib/upload';
import {
  partnerStep1Schema,
  partnerStep2Schema,
  partnerStep3Schema,
  type PartnerStep1Values,
  type PartnerStep2Values,
  type PartnerStep3Values,
} from '@/lib/validation/auth';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { PartnerCategory } from '@/types/database';

const KATHMANDU: Region = {
  latitude: 27.7172,
  longitude: 85.324,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const TOTAL_STEPS = 3;

export default function OnboardingPartnerScreen() {
  const router = useRouter();
  const { locale, pendingPhone } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [region, setRegion] = useState(KATHMANDU);
  const [marker, setMarker] = useState({ latitude: KATHMANDU.latitude, longitude: KATHMANDU.longitude });

  const step1Form = useForm<PartnerStep1Values>({
    resolver: zodResolver(partnerStep1Schema),
    defaultValues: {
      name: '',
      name_np: '',
      category: 'restaurant',
      phone: pendingPhone || '',
    },
  });

  const step2Form = useForm<PartnerStep2Values>({
    resolver: zodResolver(partnerStep2Schema),
    defaultValues: {
      address: '',
      latitude: KATHMANDU.latitude,
      longitude: KATHMANDU.longitude,
    },
  });

  const step3Form = useForm<PartnerStep3Values>({
    resolver: zodResolver(partnerStep3Schema),
    defaultValues: { cover_image_url: '' },
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        router.replace('/(auth)/welcome');
      }
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setMarker(coords);
      setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      step2Form.setValue('latitude', coords.latitude);
      step2Form.setValue('longitude', coords.longitude);
    })();
  }, [step2Form]);

  const stepTitles = [
    t(locale, 'partnerStep1Title'),
    t(locale, 'partnerStep2Title'),
    t(locale, 'partnerStep3Title'),
  ];

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
      step3Form.setValue('cover_image_url', result.assets[0].uri, { shouldValidate: true });
    }
  };

  const goNext = async () => {
    setSubmitError(null);

    if (step === 1) {
      const valid = await step1Form.trigger();
      if (valid) setStep(2);
      return;
    }

    if (step === 2) {
      step2Form.setValue('latitude', marker.latitude);
      step2Form.setValue('longitude', marker.longitude);
      const valid = await step2Form.trigger();
      if (valid) setStep(3);
      return;
    }

    if (step === 3) {
      const valid = await step3Form.trigger();
      if (!valid) return;
      await savePartner();
    }
  };

  const savePartner = async () => {
    setLoading(true);
    setSubmitError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const step1 = step1Form.getValues();
      const step2 = step2Form.getValues();
      const step3 = step3Form.getValues();

      let coverUrl = step3.cover_image_url;
      if (coverUri && coverUri.startsWith('file')) {
        coverUrl = await uploadPartnerCover(userId, coverUri);
      }

      const { error } = await supabase.from('partners').insert({
        user_id: userId,
        name: step1.name,
        name_np: step1.name_np,
        category: step1.category,
        phone: `+977${step1.phone}`,
        address: step2.address,
        latitude: step2.latitude,
        longitude: step2.longitude,
        cover_image_url: coverUrl,
      });

      if (error) throw error;

      track('partner_onboarded', { category: step1.category, partner_name: step1.name });

      router.replace('/(tabs)');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t(locale, 'authError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      <StepProgress
        current={step}
        total={TOTAL_STEPS}
        label={t(locale, 'step', { current: step, total: TOTAL_STEPS })}
      />

      <Text style={styles.title}>{stepTitles[step - 1]}</Text>

      {step === 1 && (
        <View>
          <FormField
            label={t(locale, 'nameEn')}
            value={step1Form.watch('name')}
            onChangeText={(text) => step1Form.setValue('name', text, { shouldValidate: true })}
            error={step1Form.formState.errors.name?.message}
          />
          <FormField
            label={t(locale, 'nameNp')}
            value={step1Form.watch('name_np')}
            onChangeText={(text) => step1Form.setValue('name_np', text, { shouldValidate: true })}
            error={step1Form.formState.errors.name_np?.message}
          />
          <Text style={styles.fieldLabel}>{t(locale, 'category')}</Text>
          <CategoryPicker
            locale={locale}
            value={step1Form.watch('category') as PartnerCategory}
            onChange={(value) => step1Form.setValue('category', value, { shouldValidate: true })}
            error={step1Form.formState.errors.category?.message}
          />
          <Controller
            control={step1Form.control}
            name="phone"
            render={({ field: { value, onChange } }) => (
              <PhoneInput
                value={value}
                onChange={onChange}
                placeholder={t(locale, 'phonePlaceholder')}
                error={step1Form.formState.errors.phone?.message}
              />
            )}
          />
        </View>
      )}

      {step === 2 && (
        <View>
          <FormField
            label={t(locale, 'address')}
            value={step2Form.watch('address')}
            onChangeText={(text) => step2Form.setValue('address', text, { shouldValidate: true })}
            error={step2Form.formState.errors.address?.message}
            multiline
            numberOfLines={3}
            style={styles.addressInput}
          />
          <Text style={styles.mapHint}>{t(locale, 'selectLocation')}</Text>
          {Platform.OS !== 'web' ? (
            <MapView
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={(e) => {
                const coords = e.nativeEvent.coordinate;
                setMarker(coords);
                step2Form.setValue('latitude', coords.latitude);
                step2Form.setValue('longitude', coords.longitude);
              }}>
              <Marker
                coordinate={marker}
                draggable
                onDragEnd={(e) => {
                  const coords = e.nativeEvent.coordinate;
                  setMarker(coords);
                  step2Form.setValue('latitude', coords.latitude);
                  step2Form.setValue('longitude', coords.longitude);
                }}
              />
            </MapView>
          ) : (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackText}>
                Map picker available on iOS and Android
              </Text>
            </View>
          )}
        </View>
      )}

      {step === 3 && (
        <View>
          <Text style={styles.fieldLabel}>{t(locale, 'coverPhoto')}</Text>
          <Pressable onPress={pickCover} style={styles.uploadArea}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverPreview} />
            ) : (
              <Text style={styles.uploadText}>{t(locale, 'tapToUpload')}</Text>
            )}
          </Pressable>
          {step3Form.formState.errors.cover_image_url ? (
            <Text style={styles.error}>{step3Form.formState.errors.cover_image_url.message}</Text>
          ) : null}
        </View>
      )}

      {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

      <View style={styles.actions}>
        {step > 1 ? (
          <AuthButton
            label={t(locale, 'back')}
            variant="ghost"
            onPress={() => setStep((s) => s - 1)}
            style={styles.backBtn}
          />
        ) : null}
        <AuthButton
          label={step === TOTAL_STEPS ? (loading ? t(locale, 'saving') : t(locale, 'finish')) : t(locale, 'next')}
          onPress={goNext}
          loading={loading}
          disabled={loading}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.textPrimary,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  addressInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  mapHint: {
    fontSize: 13,
    color: Palette.textMuted,
    marginBottom: 10,
  },
  map: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mapFallback: {
    height: 160,
    borderRadius: 16,
    backgroundColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mapFallbackText: {
    color: Palette.textMuted,
    fontSize: 14,
  },
  uploadArea: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Palette.lightGreenBg,
    borderStyle: 'dashed',
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadText: {
    color: Palette.textMuted,
    fontSize: 15,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  actions: {
    marginTop: 24,
    gap: 8,
  },
  backBtn: {
    marginBottom: 4,
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
