import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PartnerEditHeader } from '@/components/partner/PartnerEditHeader';
import { TimePickerSheet } from '@/components/partner/TimePickerSheet';
import { Palette } from '@/constants/Colors';
import { getAreaById, getCityById } from '@/lib/locations';
import { hapticSuccess } from '@/lib/haptics';
import { decodePartnerMeta, mergePartnerMeta } from '@/lib/partnerMeta';
import type { PartnerProfileRow } from '@/lib/partnerProfile';
import { supabase } from '@/lib/supabase';
import { formatTimeFromDate } from '@/lib/validation/partner';

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

export default function EditHoursScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [partner, setPartner] = useState<PartnerProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [opensAt, setOpensAt] = useState(defaultTime(9, 0));
  const [closesAt, setClosesAt] = useState(defaultTime(22, 0));
  const [showOpensPicker, setShowOpensPicker] = useState(false);
  const [showClosesPicker, setShowClosesPicker] = useState(false);

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
      setOpensAt(timeFromString(meta.opening_start));
      setClosesAt(timeFromString(meta.opening_end));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  const handleSave = async () => {
    if (!partner) return;
    setSaving(true);
    const description = mergePartnerMeta(partner.description, {
      opening_start: formatTimeFromDate(opensAt),
      opening_end: formatTimeFromDate(closesAt),
    });
    const { error } = await supabase
      .from('partners')
      .update({ description })
      .eq('id', partner.id);
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await hapticSuccess();
    router.back();
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
      <PartnerEditHeader title="Opening hours" onSave={() => void handleSave()} saving={saving} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.formCard}>
          <Text style={styles.hint}>When can customers pick up rescue bags?</Text>
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
        </View>
      </ScrollView>

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
    gap: 12,
  },
  hint: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
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
});
