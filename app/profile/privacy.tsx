import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SuccessToast } from '@/components/ui/SuccessToast';
import { Palette } from '@/constants/Colors';
import { Radius, Spacing, Type } from '@/constants/theme';
import {
  DEFAULT_PRIVACY_SETTINGS,
  normalizePrivacySettings,
  type NameDisplayMode,
} from '@/lib/privacy';
import { supabase } from '@/lib/supabase';

const NAME_OPTIONS: Array<{
  value: NameDisplayMode;
  label: string;
  example: string;
}> = [
  { value: 'full', label: 'Full name', example: 'e.g. Kushal Gautam' },
  { value: 'first', label: 'First name only', example: 'e.g. Kushal' },
  { value: 'initials', label: 'Initials', example: 'e.g. K.G.' },
  { value: 'anonymous', label: 'Anonymous', example: 'e.g. Customer #A3F2' },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('Customer');
  const [showPhone, setShowPhone] = useState(DEFAULT_PRIVACY_SETTINGS.show_phone);
  const [nameDisplay, setNameDisplay] = useState<NameDisplayMode>('full');
  const [toastVisible, setToastVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const id = sessionData.session?.user?.id ?? null;
      setUserId(id);
      if (!id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, privacy_settings')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      const row = data as {
        full_name?: string | null;
        privacy_settings?: Parameters<typeof normalizePrivacySettings>[0];
      } | null;

      setFullName(row?.full_name?.trim() || 'Customer');
      const normalized = normalizePrivacySettings(row?.privacy_settings);
      setShowPhone(normalized.show_phone);
      setNameDisplay(normalized.name_display as NameDisplayMode);
    } catch (error) {
      console.error('[privacy] load failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const exampleName = useMemo(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (nameDisplay === 'first') return parts[0] || 'Kushal';
    if (nameDisplay === 'initials') {
      if (parts.length >= 2) return parts.map((p) => `${p[0]?.toUpperCase() ?? ''}.`).join('');
      return `${(parts[0] ?? 'K')[0]?.toUpperCase() ?? 'K'}.`;
    }
    if (nameDisplay === 'anonymous') return 'Customer';
    return fullName;
  }, [fullName, nameDisplay]);

  const save = async () => {
    if (!userId || saving) return;
    setSaving(true);
    try {
      const privacy_settings = {
        show_phone: showPhone,
        show_full_name: nameDisplay === 'full',
        name_display: nameDisplay,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings } as never)
        .eq('id', userId);

      if (error) throw error;

      setToastVisible(true);
      setTimeout(() => {
        router.back();
      }, 700);
    } catch (error) {
      console.error('[privacy] save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SuccessToast
        visible={toastVisible}
        title="Privacy settings saved ✓"
        onHide={() => setToastVisible(false)}
      />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={22} color={Palette.white} strokeWidth={2.4} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Privacy & Safety</Text>
          <Text style={styles.headerSubtitle}>Control what restaurants see</Text>
        </View>
        <View style={styles.backBtnPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>PHONE NUMBER</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <Text style={styles.rowTitle}>Show phone to restaurants</Text>
                <Text style={styles.rowSubtitle}>
                  Restaurants see your number for pickup coordination
                </Text>
              </View>
              <Switch
                value={showPhone}
                onValueChange={setShowPhone}
                trackColor={{ false: '#E5E7EB', true: Palette.primary }}
                thumbColor={Palette.white}
              />
            </View>
            {!showPhone ? (
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  ⚠️ Hiding your phone may make it harder for restaurants to contact you if
                  there&apos;s an issue with your pickup.
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>YOUR NAME</Text>
          <View style={styles.card}>
            <Text style={styles.namePrompt}>How restaurants see your name</Text>
            <Text style={styles.livePreview}>Preview: {exampleName}</Text>
            {NAME_OPTIONS.map((option, index) => {
              const selected = nameDisplay === option.value;
              const isLast = index === NAME_OPTIONS.length - 1;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setNameDisplay(option.value)}
                  style={[styles.optionRow, !isLast && styles.optionBorder]}>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.rowTitle}>{option.label}</Text>
                    <Text style={styles.rowSubtitle}>{option.example}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>EMAIL ADDRESS</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <Text style={styles.rowTitle}>Show email to restaurants</Text>
                <Text style={styles.rowSubtitle}>
                  Your email is never shared with restaurants
                </Text>
              </View>
              <View style={styles.lockWrap}>
                <Lock size={16} color={Palette.textTertiary} strokeWidth={2.2} />
              </View>
            </View>
            <Text style={styles.emailInfo}>
              🔒 Your email is always private and never shared.
            </Text>
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={() => void save()}
          disabled={saving || loading || !userId}
          style={({ pressed }) => [
            styles.saveBtn,
            (saving || loading || !userId) && styles.saveBtnDisabled,
            pressed && !saving && { opacity: 0.92 },
          ]}>
          {saving ? (
            <ActivityIndicator color={Palette.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save privacy settings</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3EF',
  },
  header: {
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 8,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  backBtnPlaceholder: {
    width: 40,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: Palette.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: Spacing.xl,
  },
  sectionLabel: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Palette.textTertiary,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toggleCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  warnBox: {
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
  },
  warnText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  namePrompt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  livePreview: {
    fontSize: 12,
    color: Palette.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE8',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Palette.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.primary,
  },
  optionCopy: {
    flex: 1,
    marginLeft: 12,
  },
  lockWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailInfo: {
    marginTop: 8,
    fontSize: 12,
    color: Palette.textTertiary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: '#F5F3EF',
    borderTopWidth: 1,
    borderTopColor: '#E8E4DC',
  },
  saveBtn: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '700',
  },
});
