import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryPicker } from '@/components/auth/CategoryPicker';
import { PartnerEditHeader } from '@/components/partner/PartnerEditHeader';
import { PartnerOnlinePresenceFields } from '@/components/partner/PartnerOnlinePresenceFields';
import { TimePickerSheet } from '@/components/partner/TimePickerSheet';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { Palette } from '@/constants/Colors';
import {
  toDbPartnerCategory,
  type PartnerCategoryOption,
} from '@/constants/partnerCategories';
import { formatNepalPhone } from '@/lib/auth';
import { hapticSuccess } from '@/lib/haptics';
import { decodePartnerMeta, getPartnerBio, mergePartnerMeta } from '@/lib/partnerMeta';
import type { PartnerProfileRow } from '@/lib/partnerProfile';
import {
  normalizeFacebook,
  normalizeInstagram,
  normalizeWebsite,
  normalizeWhatsapp,
} from '@/lib/partnerSocial';
import { supabase } from '@/lib/supabase';
import { formatTimeFromDate } from '@/lib/validation/partner';
import { useAuthStore } from '@/store/useAuthStore';
import { usePartnerStore } from '@/store/usePartnerStore';

function defaultTime(hours: number, minutes = 0) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function timeFromString(time?: string) {
  if (!time) return defaultTime(9, 0);
  const [h, m] = time.split(':').map(Number);
  return defaultTime(h ?? 9, m ?? 0);
}

function formatDateTimeDisplay(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function EditBusinessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useAuthStore();

  const [partner, setPartner] = useState<PartnerProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [nameNp, setNameNp] = useState('');
  const [category, setCategory] = useState<PartnerCategoryOption | null>('restaurant');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [opensAt, setOpensAt] = useState(defaultTime(9, 0));
  const [closesAt, setClosesAt] = useState(defaultTime(22, 0));
  const [showOpensPicker, setShowOpensPicker] = useState(false);
  const [showClosesPicker, setShowClosesPicker] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadPartner = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase.from('partners').select('*').eq('user_id', userId).maybeSingle();
    if (data) {
      const row = data as PartnerProfileRow;
      const meta = decodePartnerMeta(row.description);
      setPartner(row);
      setName(row.name ?? '');
      setNameNp(row.name_np ?? '');
      setCategory((row.category ?? 'restaurant') as PartnerCategoryOption);
      setBio(getPartnerBio(row.description));
      setPhone(row.phone?.replace(/^\+977/, '') ?? '');
      setWebsite(row.website ?? '');
      setFacebook(row.facebook ?? '');
      setInstagram(row.instagram ?? '');
      setWhatsapp((row.whatsapp ?? '').replace(/^\+977/, '').replace(/\D/g, '').slice(0, 10));
      setOpensAt(timeFromString(meta.opening_start));
      setClosesAt(timeFromString(meta.opening_end));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSave = async () => {
    if (!partner) return;
    if (!name.trim()) {
      Alert.alert('Business name is required');
      return;
    }

    setSaving(true);
    const description = mergePartnerMeta(partner.description, {
      bio: bio.trim(),
      opening_start: formatTimeFromDate(opensAt),
      opening_end: formatTimeFromDate(closesAt),
    });

    const socialUpdate = {
      website: normalizeWebsite(website),
      facebook: normalizeFacebook(facebook),
      instagram: normalizeInstagram(instagram),
      whatsapp: normalizeWhatsapp(whatsapp),
    };

    const { error } = await supabase
      .from('partners')
      .update({
        name: name.trim(),
        name_np: nameNp.trim() || null,
        category: toDbPartnerCategory(category ?? 'restaurant'),
        phone: phone.trim() ? formatNepalPhone(phone.trim()) : null,
        description,
        ...socialUpdate,
      })
      .eq('id', partner.id);

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    const updatedPartner = {
      name: name.trim(),
      name_np: nameNp.trim() || null,
      category: toDbPartnerCategory(category ?? 'restaurant'),
      phone: phone.trim() ? formatNepalPhone(phone.trim()) : null,
      description,
      ...socialUpdate,
    };

    setPartner((current) => (current ? { ...current, ...updatedPartner } : current));
    usePartnerStore.getState().patchPartner(updatedPartner);
    void usePartnerStore.getState().refreshPartner();

    await hapticSuccess();
    setToast('Business info updated ✓');
    setTimeout(() => router.back(), 600);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={Palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <PartnerEditHeader title="Edit business info" onSave={() => void handleSave()} saving={saving} />

      {toast ? (
        <View style={[styles.toast, { top: insets.top + 8 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 16 }]}
        footer={
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              disabled={saving}
              onPress={() => void handleSave()}
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && { opacity: 0.92 },
                saving && { opacity: 0.7 },
              ]}>
              {saving ? (
                <ActivityIndicator color={Palette.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save changes</Text>
              )}
            </Pressable>
          </View>
        }>
        <View style={styles.formCard}>
          <Text style={styles.label}>Business name (English)</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Himalayan Kitchen"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Business name (Nepali) (optional)</Text>
          <TextInput
            value={nameNp}
            onChangeText={setNameNp}
            style={styles.input}
            placeholder="हिमालयन किचन"
          />

          <Text style={styles.label}>Category</Text>
          <CategoryPicker value={category} onChange={setCategory} locale={locale} />

          <Text style={styles.label}>Short description</Text>
          <TextInput
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, 200))}
            style={[styles.input, styles.multiline]}
            placeholder="Tell customers what makes your place special..."
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>

          <Text style={styles.label}>Business phone</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.phonePrefix}>+977</Text>
            <TextInput
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/[^\d]/g, '').slice(0, 10))}
              style={[styles.input, styles.phoneInput]}
              keyboardType="phone-pad"
              placeholder="98XXXXXXXX"
            />
          </View>

          <Text style={styles.label}>Operating hours</Text>
          <View style={styles.timeRow}>
            <Pressable onPress={() => setShowOpensPicker(true)} style={styles.timeBox}>
              <Text style={styles.timeLabel}>Opens at</Text>
              <Text style={styles.timeValue}>{formatDateTimeDisplay(opensAt)}</Text>
            </Pressable>
            <Pressable onPress={() => setShowClosesPicker(true)} style={styles.timeBox}>
              <Text style={styles.timeLabel}>Closes at</Text>
              <Text style={styles.timeValue}>{formatDateTimeDisplay(closesAt)}</Text>
            </Pressable>
          </View>

          <PartnerOnlinePresenceFields
            compact
            values={{ website, facebook, instagram, whatsapp }}
            onChange={(patch) => {
              if (patch.website !== undefined) setWebsite(patch.website);
              if (patch.facebook !== undefined) setFacebook(patch.facebook);
              if (patch.instagram !== undefined) setInstagram(patch.instagram);
              if (patch.whatsapp !== undefined) setWhatsapp(patch.whatsapp);
            }}
          />
        </View>
      </KeyboardAwareScrollView>

      <TimePickerSheet
        visible={showOpensPicker}
        title="Opens at"
        value={opensAt}
        onClose={() => setShowOpensPicker(false)}
        onChange={setOpensAt}
      />
      <TimePickerSheet
        visible={showClosesPicker}
        title="Closes at"
        value={closesAt}
        onClose={() => setShowClosesPicker(false)}
        onChange={setClosesAt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F3EF' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 20, paddingHorizontal: 16 },
  formCard: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: Palette.white,
  },
  multiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phonePrefix: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  phoneInput: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  timeBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FAFAF9',
  },
  timeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Palette.white,
    borderTopWidth: 0.5,
    borderTopColor: '#F0EDE8',
  },
  saveBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  toastText: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
