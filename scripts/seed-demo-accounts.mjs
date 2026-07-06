#!/usr/bin/env node
/**
 * ⚠️  NOT SQL — do not paste this file into the Supabase SQL editor.
 *     Run from your terminal:  node scripts/seed-demo-accounts.mjs
 *
 * Seed LastBag demo accounts (run once per Supabase project).
 *
 *   Customer: 9846195558 / gautamkushal34@gmail.com
 *   Partner:  9846195557 / gautamkushal304@gmail.com
 *
 * Requires env vars (never commit the service role key):
 *   SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Also configure in Supabase Dashboard → Authentication → Providers:
 *   - Enable Email and Phone
 *   - Disable "Confirm email" for dev, or confirm demo emails manually
 *
 * Demo password for seeded accounts: demo12345
 *
 * Tip: run pending migrations first for full profile fields:
 *   supabase db push
 *
 * Usage:
 *   node scripts/seed-demo-accounts.mjs
 */

import { createClient } from '@supabase/supabase-js';

const DEMO_PASSWORD = 'demo12345';

const CUSTOMER = {
  digits: '9846195558',
  fullName: 'Demo Customer',
  email: 'gautamkushal34@gmail.com',
  cityId: 'kathmandu',
  areaId: 'thamel',
  homeArea: 'Thamel',
  homeAddress: 'Thamel, Kathmandu',
  homeLatitude: 27.715,
  homeLongitude: 85.31,
  foodPreferences: ['vegetarian', 'bakery'],
};

const PARTNER = {
  digits: '9846195557',
  ownerName: 'Demo Owner',
  email: 'gautamkushal304@gmail.com',
  businessName: 'Demo Kitchen',
  businessNameNp: 'डेमो किचन',
  category: 'restaurant',
  cityId: 'kathmandu',
  areaId: 'thamel',
  address: 'Tridevi Marg',
  latitude: 27.715,
  longitude: 85.31,
  openingStart: '10:00',
  openingEnd: '21:00',
  subscriptionTier: 'medium',
  avgDailyMeals: 80,
};

function phoneE164(digits) {
  return `+977${digits}`;
}

function phoneDigits(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('977') && digits.length === 13) return digits.slice(3);
  return digits;
}

function getEnv(name, fallback) {
  return process.env[name] || (fallback ? process.env[fallback] : undefined);
}

/** Upsert only columns the remote schema accepts (handles partial migrations). */
async function upsertRow(admin, table, row) {
  const coreKeys =
    table === 'partners'
      ? ['id', 'user_id', 'full_name', 'phone', 'role', 'name', 'category', 'latitude', 'longitude', 'address']
      : ['id', 'user_id', 'full_name', 'phone', 'role', 'name', 'category'];

  const optionalKeys = Object.keys(row).filter((k) => !coreKeys.includes(k));

  const core = { ...row };
  for (const key of optionalKeys) delete core[key];

  const { error: coreError } = await admin.from(table).upsert(core);
  if (coreError) throw coreError;

  const extras = {};
  for (const key of optionalKeys) {
    if (row[key] !== undefined) extras[key] = row[key];
  }
  if (Object.keys(extras).length === 0) return;

  const matchCol = table === 'partners' ? 'user_id' : 'id';
  const matchVal = row[matchCol];
  const { error: extraError } = await admin.from(table).update(extras).eq(matchCol, matchVal);

  if (extraError?.code === 'PGRST204') {
    console.warn(`  skipped optional ${table} columns (run supabase db push for full schema)`);
    return;
  }
  if (extraError) throw extraError;
}

async function ensureAuthUser(admin, { digits, fullName, email }) {
  const phone = phoneE164(digits);
  const normalizedEmail = email.trim().toLowerCase();

  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  const existing = list.users.find(
    (u) =>
      phoneDigits(u.phone) === digits ||
      u.email?.toLowerCase() === normalizedEmail,
  );

  if (existing) {
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      phone,
      phone_confirm: true,
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (updateError) throw updateError;
    console.log(`  auth user exists: ${phone} (${existing.id}) — updated`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    phone,
    phone_confirm: true,
    email: normalizedEmail,
    email_confirm: true,
    password: DEMO_PASSWORD,
    user_metadata: { full_name: fullName },
  });

  if (error?.code === 'phone_exists' || error?.code === 'email_exists') {
    const retry = list.users.find(
      (u) =>
        phoneDigits(u.phone) === digits ||
        u.email?.toLowerCase() === normalizedEmail,
    );
    if (retry) {
      const { error: updateError } = await admin.auth.admin.updateUserById(retry.id, {
        password: DEMO_PASSWORD,
        phone,
        phone_confirm: true,
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (updateError) throw updateError;
      console.log(`  auth user exists: ${phone} (${retry.id}) — updated after conflict`);
      return retry.id;
    }
  }

  if (error) throw error;
  console.log(`  created auth user: ${phone} (${data.user.id})`);
  return data.user.id;
}

async function upsertCustomer(admin, userId) {
  await upsertRow(admin, 'profiles', {
    id: userId,
    full_name: CUSTOMER.fullName,
    phone: phoneE164(CUSTOMER.digits),
    role: 'customer',
    email: CUSTOMER.email,
    city_id: CUSTOMER.cityId,
    area_id: CUSTOMER.areaId,
    home_area: CUSTOMER.homeArea,
    home_address: CUSTOMER.homeAddress,
    home_latitude: CUSTOMER.homeLatitude,
    home_longitude: CUSTOMER.homeLongitude,
    food_preferences: CUSTOMER.foodPreferences,
    onboarding_completed: true,
  });
  console.log('  profile upserted (customer)');
}

async function upsertPartner(admin, userId) {
  const meta = JSON.stringify({
    neighborhood: 'Thamel',
    opening_start: PARTNER.openingStart,
    opening_end: PARTNER.openingEnd,
  });

  await upsertRow(admin, 'profiles', {
    id: userId,
    full_name: PARTNER.ownerName,
    phone: phoneE164(PARTNER.digits),
    role: 'partner',
    email: PARTNER.email,
    city_id: PARTNER.cityId,
    area_id: PARTNER.areaId,
    home_area: 'Thamel',
    home_address: `${PARTNER.address}, Thamel, Kathmandu`,
    home_latitude: PARTNER.latitude,
    home_longitude: PARTNER.longitude,
    onboarding_completed: true,
  });
  console.log('  profile upserted (partner)');

  const trialEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: existing, error: fetchError } = await admin
    .from('partners')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  const partnerRow = {
    user_id: userId,
    name: PARTNER.businessName,
    name_np: PARTNER.businessNameNp,
    category: PARTNER.category,
    phone: phoneE164(PARTNER.digits),
    address: `${PARTNER.address}, Thamel, Kathmandu`,
    city_id: PARTNER.cityId,
    area_id: PARTNER.areaId,
    latitude: PARTNER.latitude,
    longitude: PARTNER.longitude,
    description: meta,
    subscription_tier: PARTNER.subscriptionTier,
    subscription_status: 'trial',
    avg_daily_meals: PARTNER.avgDailyMeals,
    trial_started_at: new Date().toISOString(),
    trial_ends_at: trialEnds,
    payment_method_on_file: false,
    is_active: true,
  };

  if (existing?.id) {
    const { error: updateError } = await admin
      .from('partners')
      .update(partnerRow)
      .eq('user_id', userId);
    if (updateError) throw updateError;
    console.log('  partner row updated');
    return;
  }

  const { error: insertError } = await admin.from('partners').insert(partnerRow);
  if (insertError?.code === '23505') {
    const { error: updateError } = await admin
      .from('partners')
      .update(partnerRow)
      .eq('user_id', userId);
    if (updateError) throw updateError;
    console.log('  partner row updated (conflict)');
    return;
  }
  if (insertError) throw insertError;
  console.log('  partner row created');
}

async function verify(admin) {
  for (const digits of [CUSTOMER.digits, PARTNER.digits]) {
    const { data, error } = await admin.rpc('phone_profile_exists', {
      p_phone: phoneE164(digits),
    });
    if (error) throw error;
    console.log(`  ${phoneE164(digits)} registered: ${data ? 'yes' : 'NO'}`);
  }
}

async function main() {
  const url = getEnv('SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceKey) {
    console.error(
      'Missing SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.',
    );
    console.error('Get the service role key from Supabase → Project Settings → API.');
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('\nSeeding demo customer (+9779846195558)…');
  const customerId = await ensureAuthUser(admin, {
    digits: CUSTOMER.digits,
    fullName: CUSTOMER.fullName,
    email: CUSTOMER.email,
  });
  await upsertCustomer(admin, customerId);

  console.log('\nSeeding demo partner (+9779846195557)…');
  const partnerId = await ensureAuthUser(admin, {
    digits: PARTNER.digits,
    fullName: PARTNER.ownerName,
    email: PARTNER.email,
  });
  await upsertPartner(admin, partnerId);

  console.log('\nVerifying login lookup…');
  await verify(admin);

  console.log('\nDone. Demo password: demo12345');
  console.log('  Customer — phone 9846195558 or email gautamkushal34@gmail.com');
  console.log('  Partner  — phone 9846195557 or email gautamkushal304@gmail.com\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
