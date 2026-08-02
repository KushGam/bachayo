import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Eye, Lock, Phone } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { CardChrome, Radius, Spacing, Type } from '@/constants/theme';
import { hapticSuccess } from '@/lib/haptics';
import {
  DEFAULT_PRIVACY_SETTINGS,
  getAnonymousDisplayName,
  getDisplayName,
  normalizePrivacySettings,
  type NameDisplayMode,
} from '@/lib/privacy';
import { supabase } from '@/lib/supabase';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('Customer');
  const [showPhone, setShowPhone] = useState(DEFAULT_PRIVACY_SETTINGS.show_phone);
  const [nameDisplay, setNameDisplay] = useState<NameDisplayMode>('full');
  const [savedShowPhone, setSavedShowPhone] = useState(DEFAULT_PRIVACY_SETTINGS.show_phone);
  const [savedNameDisplay, setSavedNameDisplay] = useState<NameDisplayMode>('full');
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
      const mode = normalized.name_display as NameDisplayMode;
      setShowPhone(normalized.show_phone);
      setNameDisplay(mode);
      setSavedShowPhone(normalized.show_phone);
      setSavedNameDisplay(mode);
    } catch (error) {
      console.error('[privacy] load failed:', error);
      Alert.alert(
        'Couldn’t load settings',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const nameOptions = useMemo(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const first = parts[0] || 'Kushal';
    const initials =
      parts.length >= 2
        ? parts.map((p) => `${p[0]?.toUpperCase() ?? ''}.`).join('')
        : `${first[0]?.toUpperCase() ?? 'K'}.`;

    return [
      { value: 'full' as const, label: 'Full name', example: fullName },
      { value: 'first' as const, label: 'First name only', example: first },
      { value: 'initials' as const, label: 'Initials', example: initials },
      {
        value: 'anonymous' as const,
        label: 'Anonymous',
        example: getAnonymousDisplayName(userId),
      },
    ];
  }, [fullName, userId]);

  const previewName = useMemo(
    () =>
      getDisplayName({
        id: userId,
        full_name: fullName,
        privacy_settings: { name_display: nameDisplay },
      }),
    [fullName, nameDisplay, userId],
  );

  const hasChanges = showPhone !== savedShowPhone || nameDisplay !== savedNameDisplay;
  const canSave = Boolean(userId) && hasChanges && !saving && !loading;

  const save = async () => {
    if (!canSave || !userId) return;
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

      setSavedShowPhone(showPhone);
      setSavedNameDisplay(nameDisplay);
      await hapticSuccess();
      setToastVisible(true);
      setTimeout(() => {
        router.back();
      }, 700);
    } catch (error) {
      console.error('[privacy] save failed:', error);
      Alert.alert(
        'Couldn’t save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SuccessToast
        visible={toastVisible}
        title="Privacy settings saved"
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
      ) : !userId ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Sign in required</Text>
          <Text style={styles.emptyBody}>
            Sign in to manage what restaurants can see about you.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 110 },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.previewCard}>
            <View style={styles.previewIcon}>
              <Eye size={16} color={Palette.primaryDark} strokeWidth={2.2} />
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewLabel}>Restaurants see you as</Text>
              <Text style={styles.previewName} numberOfLines={1}>
                {previewName}
              </Text>
              <Text style={styles.previewMeta}>
                {showPhone ? 'Phone visible for pickup' : 'Phone hidden'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Phone number</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.rowIcon}>
                <Phone size={16} color={Palette.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.toggleCopy}>
                <Text style={styles.rowTitle}>Show phone to restaurants</Text>
                <Text style={styles.rowSubtitle}>
                  Used for pickup coordination if something comes up
                </Text>
              </View>
              <Switch
                value={showPhone}
                onValueChange={setShowPhone}
                trackColor={{ false: Palette.border, true: Palette.primary }}
                thumbColor={Palette.white}
                ios_backgroundColor={Palette.border}
              />
            </View>
            {!showPhone ? (
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>
                  Hiding your phone can make it harder for restaurants to reach you about pickup
                  issues. Chat in the app still works.
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Your name</Text>
          <View style={styles.card}>
            <Text style={styles.namePrompt}>How restaurants see your name</Text>
            {nameOptions.map((option, index) => {
              const selected = nameDisplay === option.value;
              const isLast = index === nameOptions.length - 1;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setNameDisplay(option.value)}
                  style={[
                    styles.optionRow,
                    selected && styles.optionRowSelected,
                    !isLast && styles.optionBorder,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.rowSubtitle}>{option.example}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Email address</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={[styles.rowIcon, styles.lockIcon]}>
                <Lock size={16} color={Palette.textTertiary} strokeWidth={2.2} />
              </View>
              <View style={styles.toggleCopy}>
                <Text style={styles.rowTitle}>Always private</Text>
                <Text style={styles.rowSubtitle}>
                  Your email is never shared with restaurants
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={() => void save()}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveBtn,
            !canSave && styles.saveBtnDisabled,
            pressed && canSave && { opacity: 0.92 },
          ]}>
          {saving ? (
            <ActivityIndicator color={Palette.white} />
          ) : (
            <Text style={styles.saveBtnText}>
              {hasChanges ? 'Save privacy settings' : 'No changes to save'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  emptyBody: {
    ...Type.body,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  content: {
    paddingTop: Spacing.lg,
  },
  previewCard: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCopy: {
    flex: 1,
    gap: 2,
  },
  previewLabel: {
    ...Type.caption,
    color: Palette.textTertiary,
    fontWeight: '600',
  },
  previewName: {
    ...Type.h2,
    color: Palette.textPrimary,
  },
  previewMeta: {
    ...Type.caption,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Type.label,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Palette.textTertiary,
    fontWeight: '700',
  },
  sectionSpacing: {
    marginTop: Spacing.xl,
  },
  card: {
    ...CardChrome,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    backgroundColor: Palette.surfaceMuted,
  },
  toggleCopy: {
    flex: 1,
  },
  rowTitle: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  rowTitleSelected: {
    color: Palette.primaryDark,
  },
  rowSubtitle: {
    marginTop: 2,
    ...Type.caption,
    color: Palette.textSecondary,
  },
  warnBox: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Palette.warningBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  warnText: {
    ...Type.caption,
    color: Palette.warning,
    lineHeight: 18,
  },
  namePrompt: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.textPrimary,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  optionRowSelected: {
    backgroundColor: Palette.primaryLight,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.borderSubtle,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Palette.border,
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
    marginLeft: Spacing.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Palette.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.border,
  },
  saveBtn: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '700',
  },
});
