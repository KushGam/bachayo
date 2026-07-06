import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, LogOut } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileMenuRow } from '@/components/partner/ProfileMenuRow';
import { SubscriptionStatusCard } from '@/components/partner/SubscriptionStatusCard';
import { AppImage } from '@/components/ui/AppImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { getCategoryById } from '@/constants/partnerCategories';
import { Palette } from '@/constants/Colors';
import { DEFAULT_TIER_PRICING } from '@/constants/subscriptions';
import { formatRsPaisa } from '@/lib/helpers';
import { hapticButtonPress, hapticWarning } from '@/lib/haptics';
import {
  decodePartnerMeta,
  mergePartnerMeta,
} from '@/lib/partnerMeta';
import {
  fetchPartnerProfileStats,
  formatAcceptedPaymentsLabel,
  formatFoodRescued,
  formatOpeningHours,
  formatPartnerLocationLabel,
  formatRatingDisplay,
  PAYMENT_METHOD_OPTIONS,
  type OwnerProfileRow,
  type PartnerProfileRow,
  type PartnerProfileStats,
} from '@/lib/partnerProfile';
import { getStatusLabel } from '@/lib/subscriptions';
import { resolvePartnerCoverUrl } from '@/lib/images';
import { supabase } from '@/lib/supabase';
import { useAuthStore, type Locale } from '@/store/useAuthStore';

const COVER_HEIGHT = 200;
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

const SHARE_MESSAGE =
  "I'm using LastBag to sell my surplus food and reduce waste! Join me — it's free to try for 30 days. Download at lastbag.app 🛍";

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function ProfileSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Skeleton height={200} borderRadius={0} />
      <View style={styles.statsCard}>
        <View style={styles.statsGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.statCell}>
              <Skeleton height={22} width="60%" />
              <Skeleton height={12} width="80%" style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>
      <Skeleton height={72} style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 16 }} />
      <Skeleton height={220} style={{ marginHorizontal: 16, marginTop: 24, borderRadius: 16 }} />
    </View>
  );
}

export default function PartnerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale, setLocale, reset } = useAuthStore();

  const [partner, setPartner] = useState<PartnerProfileRow | null>(null);
  const [owner, setOwner] = useState<OwnerProfileRow | null>(null);
  const [stats, setStats] = useState<PartnerProfileStats>({
    bagsSold: 0,
    totalRevenue: 0,
    foodRescuedKg: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [editEmailValue, setEditEmailValue] = useState('');
  const [savingOwner, setSavingOwner] = useState(false);

  const loadProfile = useCallback(async () => {
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

    if (partnerData) {
      setPartner(partnerData as PartnerProfileRow);
      const partnerStats = await fetchPartnerProfileStats(partnerData.id);
      setStats(partnerStats);
      const meta = decodePartnerMeta(partnerData.description);
      setSelectedPayments(meta.accepted_payments ?? ['Cash', 'eSewa', 'Khalti']);
    }

    if (profileData) {
      setOwner(profileData as OwnerProfileRow);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
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
          void supabase.auth.signOut().then(() => {
            reset();
            router.replace('/(auth)/welcome');
          });
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
    ? `${category.icon} ${locale === 'np' ? category.labelNp : category.label}`
    : '🍛 Restaurant';
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
        <View style={[styles.coverWrap, { height: coverHeight }]}>
          {partner?.cover_image_url ? (
            <AppImage
              source={{ uri: partner.cover_image_url }}
              style={[styles.cover, { height: coverHeight }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder, { height: coverHeight }]}>
              <Text style={styles.coverEmoji}>🏪</Text>
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.65)']}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.headerActions, { top: insets.top + 12 }]}>
            <Pressable onPress={() => void pickCoverPhoto()} style={styles.headerIconBtn}>
              <Camera size={18} color={Palette.white} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={styles.identityOverlay}>
            <Text style={styles.businessName}>{partner?.name ?? 'Your business'}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
            </View>
            <Text style={styles.locationOverlay}>{locationLabel}</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsHead}>
            <Text style={styles.statsTitle}>Today&apos;s performance</Text>
            <View style={styles.statsPill}>
              <Text style={styles.statsPillText}>
                {tierLabel} · {statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>🛍 {stats.bagsSold}</Text>
              <Text style={styles.statLabel}>Bags sold</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{revenueLabel}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>⭐ {formatRatingDisplay(partner?.rating ?? 0)}</Text>
              <Text style={styles.statLabel}>Avg rating</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>🌱 {formatFoodRescued(stats.foodRescuedKg)}</Text>
              <Text style={styles.statLabel}>Food rescued</Text>
            </View>
          </View>
        </View>

        {partner ? <SubscriptionStatusCard partner={partner} /> : null}

        <SectionLabel>Business</SectionLabel>
        <SettingsCard>
          <ProfileMenuRow
            emoji="🏪"
            label="Business details"
            subtitle={partner?.name ?? 'Not set'}
            onPress={() => router.push('/partner/edit-business')}
          />
          <ProfileMenuRow
            emoji="📍"
            label="Location"
            subtitle={partner?.address?.slice(0, 48) ?? 'Not set'}
            onPress={() => router.push('/partner/edit-location')}
          />
          <ProfileMenuRow
            emoji="🕐"
            label="Opening hours"
            subtitle={formatOpeningHours(partner?.description)}
            onPress={() => router.push('/partner/edit-hours')}
          />
          <ProfileMenuRow
            emoji="📸"
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
                  <Text>🏪</Text>
                </View>
              )
            }
          />
        </SettingsCard>

        <SectionLabel>Owner</SectionLabel>
        <SettingsCard>
          <ProfileMenuRow
            emoji="👤"
            label="Your name"
            subtitle={owner?.full_name ?? 'Not set'}
            onPress={() => {
              setEditNameValue(owner?.full_name ?? '');
              setEditNameOpen(true);
            }}
          />
          <ProfileMenuRow
            emoji="📧"
            label="Email"
            subtitle={owner?.email ?? 'Not set'}
            onPress={() => {
              setEditEmailValue(owner?.email ?? '');
              setEditEmailOpen(true);
            }}
          />
          <ProfileMenuRow
            emoji="📱"
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
            emoji="💳"
            label="Subscription & billing"
            subtitle={`${tierLabel} · ${statusLabel}`}
            onPress={() => router.push('/(tabs)/partner/subscription')}
          />
          <ProfileMenuRow
            emoji="💵"
            label="Accepted payments"
            subtitle={formatAcceptedPaymentsLabel(meta.accepted_payments)}
            onPress={openPaymentsSheet}
            isLast
          />
        </SettingsCard>

        <SectionLabel>Settings</SectionLabel>
        <SettingsCard>
          <ProfileMenuRow
            emoji="🔔"
            label="Notifications"
            subtitle="Manage alerts and reminders"
            onPress={() => router.push('/notifications/preferences')}
          />
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.iconWrap}>
              <Text style={styles.emoji}>🌐</Text>
            </View>
            <Text style={styles.rowLabel}>Language</Text>
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
          <ProfileMenuRow
            emoji="📤"
            label="Tell other restaurants"
            subtitle="Invite via WhatsApp"
            onPress={() => void Share.share({ message: SHARE_MESSAGE })}
            isLast
          />
        </SettingsCard>

        <SectionLabel>Support</SectionLabel>
        <SettingsCard>
          <ProfileMenuRow
            emoji="❓"
            label="Help & support"
            subtitle="FAQ and contact us"
            onPress={() => router.push('/support/help')}
          />
          <ProfileMenuRow
            emoji="📋"
            label="Terms & Privacy"
            onPress={() => router.push('/legal/terms')}
          />
          <ProfileMenuRow
            emoji="ℹ️"
            label="About LastBag"
            subtitle="Made in Nepal 🇳🇵"
            showChevron={false}
            isLast
            right={<Text style={styles.versionInline}>v{APP_VERSION}</Text>}
            onPress={() => router.push('/legal/about')}
          />
        </SettingsCard>

        <Pressable onPress={signOut} style={({ pressed }) => [styles.signOutCard, pressed && { opacity: 0.9 }]}>
          <View style={styles.signOutIcon}>
            <LogOut size={18} color="#E24B4A" strokeWidth={2} />
          </View>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.footerTagline}>LastBag · Rescue food, save money 🛍</Text>
        <Text style={styles.footerVersion}>Version {APP_VERSION} · Nepal 🇳🇵</Text>
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
                <Text style={styles.paymentOptionText}>
                  {checked ? '✓ ' : '○ '}
                  {option}
                </Text>
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
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
    backgroundColor: '#F5F3EF',
  },
  coverWrap: {
    position: 'relative',
    backgroundColor: '#FAECE7',
  },
  cover: {
    width: '100%',
    backgroundColor: '#FAECE7',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: {
    fontSize: 48,
  },
  headerActions: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    gap: 6,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.white,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: Palette.white,
    fontWeight: '600',
  },
  locationOverlay: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  statsCard: {
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Palette.white,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  statsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statsPill: {
    backgroundColor: '#FAECE7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statsPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.primaryDark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statTile: {
    width: '48.5%',
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#F0EDE8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 19,
    fontWeight: '600',
    color: Palette.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 16,
    marginTop: 28,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  thumbPlaceholder: {
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primary,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE8',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 16,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  langToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F5F3EF',
  },
  langPillActive: {
    backgroundColor: Palette.primary,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  langTextActive: {
    color: Palette.white,
  },
  versionInline: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  signOutCard: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Palette.white,
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signOutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E24B4A',
  },
  footerTagline: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
  footerVersion: {
    fontSize: 11,
    color: '#C4C0B8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 40,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  paymentOption: {
    paddingVertical: 10,
  },
  paymentOptionText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  modalSaveBtn: {
    marginTop: 8,
    backgroundColor: Palette.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
