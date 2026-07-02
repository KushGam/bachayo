import Constants from 'expo-constants';
import { useRouter, useFocusEffect } from 'expo-router';
import { LogOut, Pencil } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageToggle } from '@/components/auth/LanguageToggle';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { FOOD_PREFERENCE_OPTIONS } from '@/constants/foodPreferences';
import { Palette } from '@/constants/Colors';
import { formatRsPaisa, getInitials } from '@/lib/helpers';
import { getProfileAvatarUrl } from '@/lib/images';
import { hapticWarning } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore, type Locale } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';

type ProfileUser = {
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  foodPreferences: string[] | null;
  isSignedIn: boolean;
};

type ProfileStats = {
  bagsRescued: number;
  moneySavedPaisa: number;
  reviewsGiven: number;
};

type SettingsRowProps = {
  emoji: string;
  label: string;
  subtitle?: string;
  value?: string;
  showChevron?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
  isLast?: boolean;
};

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const SHARE_MESSAGE =
  "I'm rescuing food with Bachayo! Download it to find discounted meals near you 🛍";

function formatFoodPreferences(prefs: string[] | null | undefined) {
  if (!prefs?.length) return 'Not set';
  return prefs
    .map((key) => FOOD_PREFERENCE_OPTIONS.find((option) => option.key === key)?.label ?? key)
    .join(', ');
}

function SettingsRow({
  emoji,
  label,
  subtitle,
  value,
  showChevron = true,
  onPress,
  right,
  isLast = false,
}: SettingsRowProps) {
  const interactive = Boolean(onPress);

  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      style={({ pressed }) => [
        styles.settingsRow,
        !isLast && styles.settingsRowBorder,
        interactive && pressed && { opacity: 0.85 },
      ]}>
      <View style={styles.settingsIconWrap}>
        <Text style={styles.settingsEmoji}>{emoji}</Text>
      </View>

      <View style={styles.settingsCopy}>
        <Text style={styles.settingsLabel}>{label}</Text>
        {subtitle ? <Text style={styles.settingsSubtitle}>{subtitle}</Text> : null}
      </View>

      {right}
      {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
      {showChevron && interactive && !right ? (
        <Text style={styles.settingsChevron}>›</Text>
      ) : null}
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.settingsCard}>{children}</View>;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { areaId, setLocation } = useLocationStore();
  const { locale, setLocale, reset } = useAuthStore();
  const [user, setUser] = useState<ProfileUser>({
    name: 'Guest',
    email: null,
    phone: null,
    avatarUrl: null,
    foodPreferences: null,
    isSignedIn: false,
  });
  const [stats, setStats] = useState<ProfileStats>({
    bagsRescued: 0,
    moneySavedPaisa: 0,
    reviewsGiven: 0,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);

  const languageLabel = locale === 'np' ? 'नेपाली' : 'EN';

  const loadProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const sessionUser = data.session?.user;
      if (!sessionUser) {
        setUser({
          name: 'Guest',
          email: null,
          phone: null,
          avatarUrl: null,
          foodPreferences: null,
          isSignedIn: false,
        });
        setStats({ bagsRescued: 0, moneySavedPaisa: 0, reviewsGiven: 0 });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url, food_preferences')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const profileRow = profile as {
        full_name?: string | null;
        phone?: string | null;
        avatar_url?: string | null;
        food_preferences?: string[] | null;
      } | null;

      setUser({
        name:
          profileRow?.full_name ||
          profileRow?.phone ||
          sessionUser.email?.split('@')[0] ||
          'Bachayo user',
        email: sessionUser.email ?? null,
        phone: profileRow?.phone ?? null,
        avatarUrl: profileRow?.avatar_url ?? null,
        foodPreferences: profileRow?.food_preferences ?? null,
        isSignedIn: true,
      });

      const [{ data: orders }, { count: reviewsCount }] = await Promise.all([
        supabase
          .from('orders')
          .select('quantity, bag:rescue_bags(original_price, rescue_price)')
          .eq('customer_id', sessionUser.id)
          .eq('status', 'picked_up'),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', sessionUser.id),
      ]);

      let bagsRescued = 0;
      let moneySavedPaisa = 0;

      for (const order of orders ?? []) {
        const quantity = order.quantity ?? 1;
        bagsRescued += quantity;
        const bag = order.bag as { original_price: number; rescue_price: number } | null;
        if (bag) {
          moneySavedPaisa += (bag.original_price - bag.rescue_price) * quantity;
        }
      }

      setStats({
        bagsRescued,
        moneySavedPaisa,
        reviewsGiven: reviewsCount ?? 0,
      });
      setLoadError(null);
    } catch (error) {
      console.error('[profile] load failed:', error);
      setLoadError('Could not load profile details');
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const avatarDisplayUrl = getProfileAvatarUrl(user.avatarUrl);

  const signOut = async () => {
    await hapticWarning();
    try {
      await supabase.auth.signOut();
      reset();
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('[profile] sign out failed:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: SHARE_MESSAGE });
    } catch (error) {
      console.error('[profile] share failed:', error);
    }
  };

  const handleRate = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/id0000000000',
      android: 'market://details?id=com.bachayo.app',
      default: 'https://bachayo.com',
    });
    if (storeUrl) void Linking.openURL(storeUrl);
  };

  const handleTerms = () => {
    router.push('/legal/terms');
  };

  const handlePrivacy = () => {
    router.push('/legal/privacy');
  };

  const handleHelp = () => {
    router.push('/support/help');
  };

  const handleAbout = () => {
    router.push('/legal/about');
  };

  const moneySavedLabel = formatRsPaisa(stats.moneySavedPaisa).replace('Rs ', '₨');

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Profile</Text>
            {user.isSignedIn ? (
              <Pressable
                onPress={() => router.push('/profile/edit' as never)}
                hitSlop={8}
                style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.8 }]}>
                <Pencil size={24} color={Palette.white} strokeWidth={2} />
              </Pressable>
            ) : (
              <View style={styles.editButtonPlaceholder} />
            )}
          </View>

          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              {avatarDisplayUrl ? (
                <Image
                  key={avatarDisplayUrl}
                  source={{ uri: avatarDisplayUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
              )}
            </View>
          </View>

          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>
            {user.email ?? user.phone ?? 'Sign in to save your bags'}
          </Text>
          {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}

          {user.isSignedIn ? (
            <View style={styles.headerStatsRow}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{stats.bagsRescued}</Text>
                <Text style={styles.headerStatLabel}>Bags rescued</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{moneySavedLabel}</Text>
                <Text style={styles.headerStatLabel}>Money saved</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>{stats.reviewsGiven}</Text>
                <Text style={styles.headerStatLabel}>Reviews given</Text>
              </View>
            </View>
          ) : null}
        </View>

        {user.isSignedIn ? (
          <View style={styles.statsCard}>
            <View style={styles.statsCardItem}>
              <Text style={styles.statsCardValue}>🛍 {stats.bagsRescued}</Text>
              <Text style={styles.statsCardLabel}>bags rescued</Text>
            </View>
            <View style={styles.statsCardItem}>
              <Text style={styles.statsCardValue}>{moneySavedLabel}</Text>
              <Text style={styles.statsCardLabel}>saved</Text>
            </View>
            <View style={styles.statsCardItem}>
              <Text style={styles.statsCardValue}>⭐ {stats.reviewsGiven}</Text>
              <Text style={styles.statsCardLabel}>reviews</Text>
            </View>
          </View>
        ) : null}

        {user.isSignedIn ? (
          <>
            <SectionLabel>Account</SectionLabel>
            <SettingsCard>
              <SettingsRow
                emoji="👤"
                label="Edit profile"
                onPress={() => router.push('/profile/edit' as never)}
              />
              <View style={[styles.settingsRow, styles.settingsRowBorder]}>
                <View style={styles.settingsIconWrap}>
                  <Text style={styles.settingsEmoji}>📍</Text>
                </View>
                <Text style={[styles.settingsLabel, styles.settingsLabelFlex]}>Home location</Text>
                <LocationPicker
                  variant="valueOnly"
                  value={areaId}
                  onChange={(cityId, nextAreaId) => setLocation(cityId, nextAreaId)}
                  placeholder="Choose location"
                />
                <Text style={styles.settingsChevron}>›</Text>
              </View>
              <SettingsRow
                emoji="🔔"
                label="Notifications"
                subtitle="Manage alerts and reminders"
                onPress={() => router.push('/notifications/preferences')}
              />
              <SettingsRow
                emoji="🌐"
                label="Language"
                value={languageLabel}
                onPress={() => setLanguageOpen(true)}
                isLast
              />
            </SettingsCard>

            <SectionLabel>Food preferences</SectionLabel>
            <SettingsCard>
              <SettingsRow
                emoji="🥗"
                label="My preferences"
                value={formatFoodPreferences(user.foodPreferences)}
                onPress={() => router.push('/(auth)/signup-customer/preferences' as never)}
                isLast
              />
            </SettingsCard>

            <SectionLabel>Support</SectionLabel>
            <SettingsCard>
              <SettingsRow emoji="❓" label="Help & support" onPress={handleHelp} />
              <SettingsRow emoji="⭐" label="Rate Bachayo" onPress={handleRate} />
              <SettingsRow emoji="📤" label="Share Bachayo" onPress={handleShare} />
              <SettingsRow emoji="📋" label="Terms of Service" onPress={handleTerms} />
              <SettingsRow emoji="🔒" label="Privacy Policy" onPress={handlePrivacy} isLast />
            </SettingsCard>

            <SectionLabel>About</SectionLabel>
            <SettingsCard>
              <SettingsRow emoji="ℹ️" label="About Bachayo" onPress={handleAbout} />
              <SettingsRow
                emoji="🇳🇵"
                label="Made in Nepal"
                value={`v${APP_VERSION}`}
                showChevron={false}
                isLast
              />
            </SettingsCard>

            <Pressable
              onPress={signOut}
              style={({ pressed }) => [styles.signOutCard, pressed && { opacity: 0.9 }]}>
              <LogOut size={20} color="#E24B4A" strokeWidth={2} />
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <SectionLabel>Account</SectionLabel>
            <SettingsCard>
              <SettingsRow
                emoji="👤"
                label="Log in or sign up"
                subtitle="Save bags and track orders"
                onPress={() => router.push('/(auth)/login')}
              />
              <SettingsRow emoji="❓" label="Help & support" onPress={handleHelp} isLast />
            </SettingsCard>

            <SectionLabel>App</SectionLabel>
            <SettingsCard>
              <SettingsRow
                emoji="🌐"
                label="Language"
                value={languageLabel}
                onPress={() => setLanguageOpen(true)}
              />
              <View style={[styles.settingsRow, styles.settingsRowBorder]}>
                <View style={styles.settingsIconWrap}>
                  <Text style={styles.settingsEmoji}>📍</Text>
                </View>
                <Text style={[styles.settingsLabel, styles.settingsLabelFlex]}>Home location</Text>
                <LocationPicker
                  variant="valueOnly"
                  value={areaId}
                  onChange={(cityId, nextAreaId) => setLocation(cityId, nextAreaId)}
                  placeholder="Choose location"
                />
                <Text style={styles.settingsChevron}>›</Text>
              </View>
              <SettingsRow
                emoji="🇳🇵"
                label="Made in Nepal"
                value={`v${APP_VERSION}`}
                showChevron={false}
                isLast
              />
            </SettingsCard>
          </>
        )}

        <Text style={styles.footerTagline}>Bachayo · Rescue food, save money 🛍</Text>
        <Text style={styles.footerVersion}>Version {APP_VERSION}</Text>
      </ScrollView>

      <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => setLanguageOpen(false)}>
        <Pressable style={styles.languageBackdrop} onPress={() => setLanguageOpen(false)} />
        <View style={styles.languageSheet}>
          <Text style={styles.languageSheetTitle}>Language</Text>
          <LanguageToggle
            locale={locale}
            onChange={(next: Locale) => {
              setLocale(next);
              setLanguageOpen(false);
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: Palette.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Palette.white,
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 44,
    padding: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.white,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.white,
    textAlign: 'center',
    marginTop: 12,
  },
  email: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 2,
  },
  loadError: {
    fontSize: 13,
    color: '#FECACA',
    marginTop: 8,
    textAlign: 'center',
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  headerStat: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.white,
  },
  headerStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  headerStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsCard: {
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    backgroundColor: Palette.white,
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  statsCardItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statsCardValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Palette.primary,
    textAlign: 'center',
  },
  statsCardLabel: {
    fontSize: 11,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 16,
    marginTop: 28,
    marginBottom: 8,
  },
  settingsCard: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingsRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0EDE8',
  },
  settingsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAECE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsEmoji: {
    fontSize: 16,
  },
  settingsCopy: {
    flex: 1,
    gap: 2,
  },
  settingsLabel: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  settingsLabelFlex: {
    flex: 1,
  },
  settingsSubtitle: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  settingsValue: {
    fontSize: 14,
    color: Palette.textSecondary,
    maxWidth: '42%',
    textAlign: 'right',
  },
  settingsChevron: {
    fontSize: 22,
    color: '#9CA3AF',
    lineHeight: 22,
    marginLeft: 2,
  },
  signOutCard: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: Palette.white,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signOutText: {
    fontSize: 15,
    color: '#E24B4A',
    fontWeight: '500',
  },
  footerTagline: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
  footerVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  languageBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  languageSheet: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '38%',
    backgroundColor: Palette.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  languageSheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
