import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Bell,
  Check,
  Clock,
  CreditCard,
  BarChart3,
  FileText,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Info,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Store,
  User,
  Wallet,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PartnerProfileHero } from '@/components/partner/PartnerProfileHero';
import { PartnerProfileStatsCard } from '@/components/partner/PartnerProfileStatsCard';
import { ProfileMenuRow } from '@/components/partner/ProfileMenuRow';
import { SubscriptionStatusCard } from '@/components/partner/SubscriptionStatusCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { getCategoryById } from '@/constants/partnerCategories';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { DEFAULT_TIER_PRICING } from '@/constants/subscriptions';
import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';
import { formatRsPaisa } from '@/lib/helpers';
import { hapticButtonPress, hapticWarning } from '@/lib/haptics';
import {
  decodePartnerMeta,
  mergePartnerMeta,
} from '@/lib/partnerMeta';
import {
  fetchPartnerProfileStats,
  formatAcceptedPaymentsLabel,
  formatOpeningHours,
  formatPartnerLocationLabel,
  PAYMENT_METHOD_OPTIONS,
  statsFromPartnerRating,
  type OwnerProfileRow,
  type PartnerProfileRow,
  type PartnerProfileStats,
} from '@/lib/partnerProfile';
import { getStatusLabel } from '@/lib/subscriptions';
import { resolvePartnerCoverUrl } from '@/lib/images';
import { supabase } from '@/lib/supabase';
import { useAuthStore, type Locale } from '@/store/useAuthStore';
import { usePartnerStore } from '@/store/usePartnerStore';

const COVER_HEIGHT = 200;
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const PROFILE_CACHE_MS = 20_000;

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function ProfileSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <Skeleton height={200 + insets.top} borderRadius={0} />
      <Skeleton height={160} style={{ marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: Radius.lg }} />
      <Skeleton height={72} style={{ marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: Radius.lg }} />
      <Skeleton height={220} style={{ marginHorizontal: Spacing.lg, marginTop: Spacing.xl, borderRadius: Radius.lg }} />
    </View>
  );
}

export default function PartnerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardBottomInset();
  const { locale, setLocale, reset } = useAuthStore();
  const storedPartner = usePartnerStore((s) => s.partner);
  const setPartnerInStore = usePartnerStore((s) => s.setPartner);
  const patchPartnerInStore = usePartnerStore((s) => s.patchPartner);
  const clearPartner = usePartnerStore((s) => s.clearPartner);

  const [partner, setPartner] = useState<PartnerProfileRow | null>(
    () => (storedPartner as PartnerProfileRow | null) ?? null,
  );
  const [owner, setOwner] = useState<OwnerProfileRow | null>(null);
  const [stats, setStats] = useState<PartnerProfileStats>(() => ({
    bagsSold: 0,
    totalRevenue: 0,
    foodRescuedKg: 0,
    ...statsFromPartnerRating(storedPartner),
  }));
  const [loading, setLoading] = useState(!storedPartner);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [editEmailValue, setEditEmailValue] = useState('');
  const [savingOwner, setSavingOwner] = useState(false);
  const cacheRef = useRef<{ at: number; partnerId: string | null }>({
    at: 0,
    partnerId: storedPartner?.id ?? null,
  });
  const loadingRef = useRef(false);

  const loadProfile = useCallback(async (opts?: { force?: boolean }) => {
    const force = opts?.force === true;
    if (
      !force &&
      cacheRef.current.partnerId &&
      Date.now() - cacheRef.current.at < PROFILE_CACHE_MS
    ) {
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const [{ data: partnerData }, { data: profileData }] = await Promise.all([
        supabase.from('partners').select('*').eq('user_id', userId).maybeSingle(),
        supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', userId)
          .maybeSingle(),
      ]);

      if (profileData) {
        setOwner(profileData as OwnerProfileRow);
      }

      if (partnerData) {
        const row = partnerData as PartnerProfileRow;
        setPartner(row);
        setPartnerInStore(row);
        setStats((prev) => ({
          ...prev,
          ...statsFromPartnerRating(row),
        }));
        const meta = decodePartnerMeta(partnerData.description);
        setSelectedPayments(meta.accepted_payments ?? ['Cash', 'eSewa', 'Khalti']);
        setLoading(false);
        cacheRef.current = { at: Date.now(), partnerId: row.id };

        // Sales aggregates after paint — don't block the profile shell.
        void fetchPartnerProfileStats(row.id, row)
          .then((partnerStats) => setStats(partnerStats))
          .catch(() => {
            /* keep rating seed if sales fail */
          });
      } else {
        setPartner(null);
        setLoading(false);
        cacheRef.current = { at: Date.now(), partnerId: null };
      }
    } finally {
      loadingRef.current = false;
    }
  }, [setPartnerInStore]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile({ force: true });
    setRefreshing(false);
  };

  const pickCoverPhoto = async () => {
    void hapticButtonPress();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId || !partner) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a cover image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? asset.type;
    if (mimeType && !mimeType.startsWith('image/')) {
      Alert.alert('Please select an image file');
      return;
    }

    try {
      const url = await resolvePartnerCoverUrl(userId, asset.uri, mimeType);
      if (!url) {
        throw new Error('Could not process the selected image');
      }

      const { error } = await supabase
        .from('partners')
        .update({ cover_image_url: url })
        .eq('id', partner.id);
      if (error) throw error;
      setPartner((current) => (current ? { ...current, cover_image_url: url } : current));
      patchPartnerInStore({ cover_image_url: url });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not update cover photo. Please try again.';
      Alert.alert('Upload failed', message);
    }
  };

  const saveAcceptedPayments = async (next: string[]) => {
    if (!partner) return;
    const description = mergePartnerMeta(partner.description, { accepted_payments: next });
    const { error } = await supabase
      .from('partners')
      .update({ description })
      .eq('id', partner.id);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setSelectedPayments(next);
    setPartner((current) => (current ? { ...current, description } : current));
    patchPartnerInStore({ description });
    setPaymentsOpen(false);
  };

  const openPaymentsSheet = () => {
    void hapticButtonPress();
    setPaymentsOpen(true);
  };

  const saveOwnerField = async (field: 'full_name' | 'email', value: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    setSavingOwner(true);
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value.trim() || null })
      .eq('id', userId);
    setSavingOwner(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setOwner((current) =>
      current ? { ...current, [field]: value.trim() || null } : current,
    );
    setEditNameOpen(false);
    setEditEmailOpen(false);
  };

  const signOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void hapticWarning();
          void (async () => {
            const { performSignOut } = await import('@/lib/auth/performSignOut');
            await performSignOut();
            clearPartner();
            reset();
            router.replace('/(auth)/welcome');
          })();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <>
        <StatusBar style="light" />
        <ProfileSkeleton />
      </>
    );
  }

  const category = getCategoryById(partner?.category ?? 'restaurant');
  const categoryLabel = category
    ? locale === 'np'
      ? category.labelNp
      : category.label
    : 'Restaurant';
  const locationLabel = partner
    ? formatPartnerLocationLabel(partner, locale)
    : 'Set your location';
  const meta = decodePartnerMeta(partner?.description);
  const tierLabel = partner?.subscription_tier
    ? DEFAULT_TIER_PRICING[partner.subscription_tier]?.label.split('—')[0].trim() ??
      partner.subscription_tier
    : 'Small';
  const statusLabel = getStatusLabel(partner?.subscription_status ?? 'trial');
  const revenueLabel = formatRsPaisa(stats.totalRevenue).replace('Rs ', '₨');
  const coverHeight = COVER_HEIGHT + insets.top;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <PartnerProfileHero
          coverHeight={coverHeight}
          coverUrl={partner?.cover_image_url ?? null}
          businessName={partner?.name ?? 'Your business'}
          categoryLabel={categoryLabel}
          locationLabel={locationLabel}
          topInset={insets.top}
          onEditCover={() => void pickCoverPhoto()}
        />

        <PartnerProfileStatsCard
          bagsSold={stats.bagsSold}
          revenueLabel={revenueLabel}
          rating={stats.avgRating}
          reviewCount={stats.reviewCount}
          foodRescuedKg={stats.foodRescuedKg}
          tierLabel={tierLabel}
          statusLabel={statusLabel}
        />

        {partner ? <SubscriptionStatusCard partner={partner} /> : null}

        <SectionLabel>Insights</SectionLabel>
        <SettingsCard>
          <ProfileMenuRow
            icon={BarChart3}
            label="Reports"
            subtitle="Today, week, and month performance"
            onPress={() => router.push('/partner/reports')}
            isLast
          />
        </SettingsCard>

        <SectionLabel>Business</SectionLabel>
        <SettingsCard>
          <ProfileMenuRow
            icon={Store}
            label="Business details"
            subtitle={partner?.name ?? 'Not set'}
            onPress={() => router.push('/partner/edit-business')}
          />
          <ProfileMenuRow
            icon={MapPin}
            label="Location"
            subtitle={partner?.address?.slice(0, 48) ?? 'Not set'}
            onPress={() => router.push('/partner/edit-location')}
          />
          <ProfileMenuRow
            icon={Clock}
            label="Opening hours"
            subtitle={formatOpeningHours(partner?.description)}
            onPress={() => router.push('/partner/edit-hours')}
          />
          <ProfileMenuRow
            icon={ImageIcon}
            label="Cover photo"
            subtitle="Tap to change"
            onPress={() => void pickCoverPhoto()}
            isLast
            showChevron={false}
            right={
              partner?.cover_image_url ? (
                <Image source={{ uri: partner.cover_image_url }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Store size={16} color={Palette.primary} strokeWidth={2} />
                </View>
              )
            }
          />
        </SettingsCard>

        <SectionLabel>Owner</SectionLabel>
        <SettingsCard>
          <ProfileMenuRow
            icon={User}
            label="Your name"
            subtitle={owner?.full_name ?? 'Not set'}
            onPress={() => {
              setEditNameValue(owner?.full_name ?? '');
              setEditNameOpen(true);
            }}
          />
          <ProfileMenuRow
            icon={Mail}
            label="Email"
            subtitle={owner?.email ?? 'Not set'}
            onPress={() => {
              setEditEmailValue(owner?.email ?? '');
              setEditEmailOpen(true);
            }}
          />
          <ProfileMenuRow
            icon={Phone}
            label="Phone"
            subtitle={owner?.phone ?? partner?.phone ?? 'Not set'}
            showChevron={false}
            isLast
            right={<Text style={styles.changeLink}>Change</Text>}
            onPress={() =>
              Alert.alert(
                'Change phone',
                'Phone changes require OTP re-verification. Contact support@lastbag.app for help.',
              )
            }
          />
        </SettingsCard>

        <SectionLabel>Payment</SectionLabel>
        <SettingsCard>
          <ProfileMenuRow
            icon={CreditCard}
            label="Subscription & billing"
            subtitle={`${tierLabel} · ${statusLabel}`}
            onPress={() => router.push('/(tabs)/partner/subscription')}
          />
          <ProfileMenuRow
            icon={Wallet}
            label="Accepted payments"
            subtitle={formatAcceptedPaymentsLabel(meta.accepted_payments)}
            onPress={openPaymentsSheet}
            isLast
          />
        </SettingsCard>

        <SectionLabel>Settings</SectionLabel>
        <SettingsCard>
          <ProfileMenuRow
            icon={Bell}
            label="Notifications"
            subtitle="Manage alerts and reminders"
            onPress={() => router.push('/notifications/preferences')}
          />
          <View style={styles.langRow}>
            <View style={styles.langIconWrap}>
              <Globe size={16} color={Palette.primary} strokeWidth={2} />
            </View>
            <Text style={styles.langLabel}>Language</Text>
            <View style={styles.langToggle}>
              {(['en', 'np'] as Locale[]).map((code) => {
                const active = locale === code;
                return (
                  <Pressable
                    key={code}
                    onPress={() => setLocale(code)}
                    style={[styles.langPill, active && styles.langPillActive]}>
                    <Text style={[styles.langText, active && styles.langTextActive]}>
                      {code === 'en' ? 'EN' : 'नेपाली'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </SettingsCard>

        <SectionLabel>Support</SectionLabel>
        <SettingsCard>
          <ProfileMenuRow
            icon={HelpCircle}
            label="Help & support"
            subtitle="FAQ and contact us"
            onPress={() => router.push('/support/help')}
          />
          <ProfileMenuRow
            icon={FileText}
            label="Terms & Privacy"
            onPress={() => router.push('/legal/terms')}
          />
          <ProfileMenuRow
            icon={Info}
            label="About LastBag"
            subtitle="Made in Nepal"
            showChevron={false}
            isLast
            right={<Text style={styles.versionInline}>v{APP_VERSION}</Text>}
            onPress={() => router.push('/legal/about')}
          />
        </SettingsCard>

        <Pressable onPress={signOut} style={({ pressed }) => [styles.signOutCard, pressed && styles.pressed]}>
          <View style={styles.signOutIcon}>
            <LogOut size={18} color={Palette.danger} strokeWidth={2} />
          </View>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.footerTagline}>LastBag · Rescue food, save money</Text>
        <Text style={styles.footerVersion}>Version {APP_VERSION} · Nepal</Text>
      </ScrollView>

      <Modal visible={paymentsOpen} transparent animationType="slide" onRequestClose={() => setPaymentsOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPaymentsOpen(false)} />
          <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Accepted payments</Text>
          {PAYMENT_METHOD_OPTIONS.map((option) => {
            const checked = selectedPayments.includes(option);
            return (
              <Pressable
                key={option}
                onPress={() =>
                  setSelectedPayments((current) =>
                    checked ? current.filter((item) => item !== option) : [...current, option],
                  )
                }
                style={styles.paymentOption}>
                <View style={[styles.paymentCheck, checked && styles.paymentCheckActive]}>
                  {checked ? <Check size={12} color={Palette.white} strokeWidth={3} /> : null}
                </View>
                <Text style={styles.paymentOptionText}>{option}</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => void saveAcceptedPayments(selectedPayments)}
            style={styles.modalSaveBtn}>
            <Text style={styles.modalSaveText}>Save</Text>
          </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={editNameOpen} transparent animationType="slide" onRequestClose={() => setEditNameOpen(false)}>
        <KeyboardAvoidingView
          style={[
            styles.modalRoot,
            Platform.OS === 'android' ? { paddingBottom: keyboardInset } : null,
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditNameOpen(false)} />
          <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Your name</Text>
          <TextInput
            value={editNameValue}
            onChangeText={setEditNameValue}
            style={styles.modalInput}
            placeholder="Full name"
            autoCapitalize="words"
          />
          <Pressable
            disabled={savingOwner}
            onPress={() => void saveOwnerField('full_name', editNameValue)}
            style={styles.modalSaveBtn}>
            <Text style={styles.modalSaveText}>{savingOwner ? 'Saving…' : 'Save'}</Text>
          </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={editEmailOpen} transparent animationType="slide" onRequestClose={() => setEditEmailOpen(false)}>
        <KeyboardAvoidingView
          style={[
            styles.modalRoot,
            Platform.OS === 'android' ? { paddingBottom: keyboardInset } : null,
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditEmailOpen(false)} />
          <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Email</Text>
          <TextInput
            value={editEmailValue}
            onChangeText={setEditEmailValue}
            style={styles.modalInput}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Pressable
            disabled={savingOwner}
            onPress={() => void saveOwnerField('email', editEmailValue)}
            style={styles.modalSaveBtn}>
            <Text style={styles.modalSaveText}>{savingOwner ? 'Saving…' : 'Save'}</Text>
          </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  sectionLabel: {
    ...Type.label,
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  card: {
    ...CardChrome,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
    ...FloatingShadow,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
  },
  thumbPlaceholder: {
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeLink: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.primary,
  },
  langRow: {
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  langIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langLabel: {
    flex: 1,
    ...Type.bodyMedium,
    fontWeight: '500',
    color: Palette.textPrimary,
  },
  langToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceMuted,
  },
  langPillActive: {
    backgroundColor: Palette.primary,
  },
  langText: {
    ...Type.label,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  langTextActive: {
    color: Palette.white,
  },
  versionInline: {
    ...Type.label,
    color: Palette.textTertiary,
  },
  signOutCard: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    ...CardChrome,
    borderRadius: Radius.lg,
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...FloatingShadow,
  },
  pressed: {
    opacity: 0.9,
  },
  signOutIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    ...Type.bodyMedium,
    fontWeight: '600',
    color: Palette.danger,
  },
  footerTagline: {
    ...Type.caption,
    color: Palette.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  footerVersion: {
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 40,
    opacity: 0.7,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  modalTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Type.body,
    color: Palette.textPrimary,
    backgroundColor: Palette.background,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  paymentCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Palette.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCheckActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  paymentOptionText: {
    ...Type.body,
    color: Palette.textPrimary,
  },
  modalSaveBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalSaveText: {
    ...Type.bodyMedium,
    color: Palette.white,
    fontWeight: '600',
  },
});
