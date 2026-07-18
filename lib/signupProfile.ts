import { formatNepalPhone } from '@/lib/auth';
import { getAreaById, getCityById } from '@/lib/locations';
import { encodePartnerMeta } from '@/lib/partnerMeta';
import { supabase } from '@/lib/supabase';
import { termsAcceptanceFields } from '@/lib/terms';
import { toDbPartnerCategory, type PartnerCategoryOption } from '@/constants/partnerCategories';
import type { CustomerSignupData, PartnerSignupData } from '@/store/useSignupStore';

export async function createCustomerProfile(
  userId: string,
  data: CustomerSignupData,
  termsAccepted = false,
) {
  const area = getAreaById(data.areaId);
  const city = getCityById(data.cityId);
  const areaLabel = area?.name ?? null;

  return supabase.from('profiles').upsert({
    id: userId,
    full_name: data.fullName.trim(),
    phone: formatNepalPhone(data.phone),
    email: data.email.trim() || null,
    role: 'customer',
    city_id: data.cityId,
    area_id: data.areaId,
    home_area: areaLabel,
    home_address: data.homeAddress.trim() || areaLabel,
    home_latitude: data.homeLatitude,
    home_longitude: data.homeLongitude,
    food_preferences: data.foodPreferences.length > 0 ? data.foodPreferences : null,
    onboarding_completed: true,
    ...termsAcceptanceFields(termsAccepted),
  } as never);
}

export async function createPartnerAccount(
  userId: string,
  data: PartnerSignupData,
  coverUrl: string | null,
  termsAccepted = false,
) {
  const area = getAreaById(data.areaId);
  const city = getCityById(data.cityId);
  const areaLabel = area?.name ?? null;
  const cityLabel = city?.name ?? null;

  const meta = encodePartnerMeta({
    neighborhood: areaLabel ?? undefined,
    opening_start: data.openingStart,
    opening_end: data.openingEnd,
  });

  const website = normalizeWebsite(data.website);

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: data.ownerName.trim(),
    phone: formatNepalPhone(data.phone),
    email: data.email.trim(),
    role: 'partner',
    city_id: data.cityId,
    area_id: data.areaId,
    home_area: areaLabel,
    home_address: data.address.trim(),
    home_latitude: data.latitude,
    home_longitude: data.longitude,
    onboarding_completed: true,
    ...termsAcceptanceFields(termsAccepted),
  } as never);

  if (profileError) return { error: profileError };

  const { error: partnerError } = await supabase.from('partners').insert({
    user_id: userId,
    name: data.businessName.trim(),
    name_np: data.businessNameNp.trim() || null,
    category: toDbPartnerCategory(data.category as PartnerCategoryOption),
    phone: formatNepalPhone(data.businessPhone),
    address: `${data.address.trim()}${areaLabel ? `, ${areaLabel}` : ''}${cityLabel ? `, ${cityLabel}` : ''}`,
    city_id: data.cityId,
    area_id: data.areaId,
    latitude: data.latitude,
    longitude: data.longitude,
    cover_image_url: coverUrl,
    website,
    description: meta,
    subscription_tier: data.subscriptionTier ?? 'small',
    subscription_status: 'trial',
    avg_daily_meals: data.avgDailyMeals,
    trial_started_at: new Date().toISOString(),
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    payment_method_on_file: false,
    is_active: false,
    approval_status: 'pending',
  });

  return { error: partnerError };
}

function normalizeWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}
