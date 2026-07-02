import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';

import { CategoryPicker } from '@/components/auth/CategoryPicker';
import { FormField } from '@/components/auth/FormField';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { SignupFieldGroup } from '@/components/auth/SignupFieldGroup';
import { SignupStepShell } from '@/components/auth/SignupStepShell';
import { SubscriptionTierPicker } from '@/components/partner/SubscriptionTierPicker';
import type { PartnerCategoryOption } from '@/constants/partnerCategories';
import type { SubscriptionTier } from '@/constants/subscriptions';
import { Palette } from '@/constants/Colors';
import { Spacing, Type } from '@/constants/theme';
import { hapticStepAdvance } from '@/lib/haptics';
import { partnerBusinessSchema, type PartnerBusinessValues } from '@/lib/validation/signup';
import { useSignupStore } from '@/store/useSignupStore';

const TOTAL_STEPS = 5;

export default function PartnerBusinessScreen() {
  const router = useRouter();
  const { partner, partnerAuthMethod, phoneOtpVerified, setPartner } = useSignupStore();

  useEffect(() => {
    if (partnerAuthMethod === 'phone' && !phoneOtpVerified) {
      router.replace('/(auth)/signup-partner/basics');
    }
  }, [partnerAuthMethod, phoneOtpVerified, router]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<PartnerBusinessValues>({
    resolver: zodResolver(partnerBusinessSchema),
    mode: 'onChange',
    defaultValues: {
      businessName: partner.businessName,
      businessNameNp: partner.businessNameNp,
      category: partner.category,
      businessPhone: partner.businessPhone || partner.phone,
      subscriptionTier: partner.subscriptionTier ?? undefined,
      avgDailyMeals: partner.avgDailyMeals ?? undefined,
    },
  });

  const onContinue = handleSubmit(async (values) => {
    setPartner({
      businessName: values.businessName.trim(),
      businessNameNp: values.businessNameNp?.trim() ?? '',
      category: values.category,
      businessPhone: values.businessPhone,
      subscriptionTier: values.subscriptionTier,
      avgDailyMeals: values.avgDailyMeals,
    });
    await hapticStepAdvance();
    router.push('/(auth)/signup-partner/location');
  });

  return (
    <SignupStepShell
      currentStep={2}
      totalSteps={TOTAL_STEPS}
      title="Tell us about your business"
      subtitle="Store name and contact — location comes on the next step"
      showBack
      onBack={() => router.back()}
      onContinue={onContinue}
      continueDisabled={!isValid}>
      <SignupFieldGroup label="Business name (English)" hint="How customers will see your store" required>
        <Controller
          control={control}
          name="businessName"
          render={({ field: { value, onChange, onBlur } }) => (
            <FormField
              label=""
              hideLabel
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Himalayan Kitchen"
              autoCapitalize="words"
              maxLength={100}
              error={errors.businessName?.message}
            />
          )}
        />
      </SignupFieldGroup>

      <SignupFieldGroup label="Business name (Nepali)" hint="Optional — shown to Nepali-speaking customers">
        <Controller
          control={control}
          name="businessNameNp"
          render={({ field: { value, onChange, onBlur } }) => (
            <FormField
              label=""
              hideLabel
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="हिमालयन किचन (optional)"
              maxLength={100}
              error={errors.businessNameNp?.message}
            />
          )}
        />
      </SignupFieldGroup>

      <SignupFieldGroup label="Business category" hint="What type of food business do you run?" required>
        <CategoryPicker
          locale="en"
          value={watch('category') as PartnerCategoryOption}
          onChange={(value) => setValue('category', value, { shouldValidate: true })}
        />
        {errors.category ? <Text style={styles.error}>{errors.category.message}</Text> : null}
      </SignupFieldGroup>

      <SignupFieldGroup
        label="How many meals do you serve on an average day?"
        hint="We'll recommend the right plan — you keep 100% of every sale"
        required>
        <SubscriptionTierPicker
          value={(watch('subscriptionTier') as SubscriptionTier | undefined) ?? null}
          onChange={(tier, avgDailyMeals) => {
            setValue('subscriptionTier', tier, { shouldValidate: true });
            setValue('avgDailyMeals', avgDailyMeals, { shouldValidate: true });
          }}
          error={errors.subscriptionTier?.message}
        />
      </SignupFieldGroup>

      <SignupFieldGroup
        label="Business phone"
        hint="Customers may call about pickup — defaults to your signup number"
        required>
        <Controller
          control={control}
          name="businessPhone"
          render={({ field: { value, onChange } }) => (
            <PhoneInput
              value={value}
              onChange={onChange}
              placeholder="98XXXXXXXX"
              error={errors.businessPhone?.message}
            />
          )}
        />
      </SignupFieldGroup>
    </SignupStepShell>
  );
}

const styles = StyleSheet.create({
  error: {
    ...Type.caption,
    color: Palette.danger,
    marginTop: -Spacing.sm,
  },
});
