import Constants from 'expo-constants';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Bell,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Shield,
  Store,
  User,
  UtensilsCrossed,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageToggle } from '@/components/auth/LanguageToggle';
import { CustomerProfileHero } from '@/components/customer/profile/CustomerProfileHero';
import { CustomerProfileImpactCard } from '@/components/customer/profile/CustomerProfileImpactCard';
import { ProfileMenuRow } from '@/components/partner/ProfileMenuRow';
import { FOOD_PREFERENCE_OPTIONS } from '@/constants/foodPreferences';
import { Palette } from '@/constants/Colors';
import { CardChrome, Radius, Spacing, Type } from '@/constants/theme';
import { fetchCustomerImpactStats } from '@/lib/customerStats';
import { formatRsPaisa } from '@/lib/helpers';
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

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function formatFoodPreferences(prefs: string[] | null | undefined) {
  if (!prefs?.length) return 'Not set';
  return prefs
    .map((key) => FOOD_PREFERENCE_OPTIONS.find((option) => option.key === key)?.label ?? key)
    .join(', ');
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.settingsCard}>{children}</View>;
}

function ProfileLocationRow() {
  const { neighbourhood, isDefault, requestLocation } = useLocationStore();
  const [refreshing, setRefreshing] = useState(false);
  const hasLocation = !isDefault;

  const handleRefresh = () => {
    if (refreshing) return;
    void (async () => {
      setRefreshing(true);
      try {
        const ok = await requestLocation();
        if (!ok) {
          Alert.alert(
            'Location',
            'Enable location in Settings so we can show bags near you.',
            [
              { text: 'Open Settings', onPress: () => void Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' },
            ],
          );
        }
      } finally {
        setRefreshing(false);
      }
    })();
  };

  return (
    <View style={[styles.locationRow, styles.rowBorder]}>
      <View style={[styles.locationIconWrap, !hasLocation && styles.locationIconWrapMuted]}>
        <MapPin
          size={16}
          color={hasLocation ? Palette.primary : Palette.textTertiary}
          strokeWidth={2.2}
        />
      </View>
      <View style={styles.locationCopy}>
        <Text style={styles.locationLabel}>Location</Text>
        <Text
          style={[styles.locationValue, !hasLocation && styles.locationValueMuted]}
          numberOfLines={1}>
          {hasLocation ? (neighbourhood ?? 'Nepal') : 'Not detected yet'}
        </Text>
      </View>
      <Pressable
        onPress={handleRefresh}
        disabled={refreshing}
        hitSlop={8}
        style={({ pressed }) => [styles.locationRefresh, pressed && styles.pressed]}>
        {refreshing ? (
          <ActivityIndicator size="small" color={Palette.primary} />
        ) : (
          <Text style={styles.locationRefreshText}>
            {hasLocation ? 'Refresh' : 'Detect'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const languageLabel = locale === 'np' ? 'नेपाली' : 'English';

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
          'LastBag user',
        email: sessionUser.email ?? null,
        phone: profileRow?.phone ?? null,
        avatarUrl: profileRow?.avatar_url ?? null,
        foodPreferences: profileRow?.food_preferences ?? null,
        isSignedIn: true,
      });

      const impact = await fetchCustomerImpactStats(sessionUser.id);
      setStats({
        bagsRescued: impact.bagsRescued,
        moneySavedPaisa: impact.moneySavedPaisa,
        reviewsGiven: impact.reviewsGiven,
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
            reset();
            router.replace('/(auth)/welcome');
          })();
        },
      },
    ]);
  };

  const moneySavedLabel = formatRsPaisa(stats.moneySavedPaisa).replace('Rs ', '₨');
  const contactLine = user.email ?? user.phone ?? 'Sign in to save your bags and track orders';
  const avatarDisplayUrl = getProfileAvatarUrl(user.avatarUrl);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <CustomerProfileHero
          name={user.name}
          contactLine={contactLine}
          avatarUrl={avatarDisplayUrl}
          isSignedIn={user.isSignedIn}
          loadError={loadError}
          paddingTop={insets.top + Spacing.sm}
          onEdit={() => router.push('/profile/edit' as never)}
        />

        {user.isSignedIn ? (
          <CustomerProfileImpactCard
            bagsRescued={stats.bagsRescued}
            moneySavedLabel={moneySavedLabel}
            reviewsGiven={stats.reviewsGiven}
          />
        ) : null}

        {user.isSignedIn ? (
          <>
            <SectionLabel>Account</SectionLabel>
            <SettingsCard>
              <ProfileMenuRow
                icon={User}
                label="Edit profile"
                onPress={() => router.push('/profile/edit' as never)}
              />
              <ProfileLocationRow />
              <ProfileMenuRow
                icon={Store}
                label="Browse restaurants"
                subtitle="Partners in your area"
                onPress={() => router.push('/partners')}
              />
              <ProfileMenuRow
                icon={Bell}
                label="Notifications"
                subtitle="Manage alerts and reminders"
                onPress={() => router.push('/notifications/preferences')}
              />
              <ProfileMenuRow
                icon={Lock}
                label="Privacy & Safety"
                subtitle="Control what restaurants see"
                onPress={() => router.push('/profile/privacy')}
              />
              <ProfileMenuRow
                icon={Globe}
                label="Language"
                right={<Text style={styles.valueInline}>{languageLabel}</Text>}
                showChevron={false}
                onPress={() => setLanguageOpen(true)}
                isLast
              />
            </SettingsCard>

            <SectionLabel>Food preferences</SectionLabel>
            <SettingsCard>
              <ProfileMenuRow
                icon={UtensilsCrossed}
                label="My preferences"
                subtitle={formatFoodPreferences(user.foodPreferences)}
                onPress={() => router.push('/(auth)/signup-customer/preferences' as never)}
                isLast
              />
            </SettingsCard>

            <SectionLabel>Support</SectionLabel>
            <SettingsCard>
              <ProfileMenuRow icon={HelpCircle} label="Help & support" onPress={() => router.push('/support/help')} />
              <ProfileMenuRow icon={FileText} label="Terms of Service" onPress={() => router.push('/legal/terms')} />
              <ProfileMenuRow icon={Shield} label="Privacy Policy" onPress={() => router.push('/legal/privacy')} isLast />
            </SettingsCard>

            <SectionLabel>About</SectionLabel>
            <SettingsCard>
              <ProfileMenuRow
                icon={Info}
                label="About LastBag"
                subtitle="Made in Nepal"
                right={<Text style={styles.valueInline}>v{APP_VERSION}</Text>}
                showChevron={false}
                onPress={() => router.push('/legal/about')}
                isLast
              />
            </SettingsCard>

            <Pressable
              onPress={signOut}
              style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}>
              <LogOut size={16} color={Palette.danger} strokeWidth={2.2} />
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <SectionLabel>Get started</SectionLabel>
            <SettingsCard>
              <ProfileMenuRow
                icon={Store}
                label="Browse restaurants"
                subtitle="Partners in your area"
                onPress={() => router.push('/partners')}
              />
              <ProfileMenuRow
                icon={LogIn}
                label="Log in or sign up"
                subtitle="Save bags and track your orders"
                onPress={() => router.push('/(auth)/login')}
              />
              <ProfileMenuRow icon={HelpCircle} label="Help & support" onPress={() => router.push('/support/help')} isLast />
            </SettingsCard>

            <SectionLabel>App</SectionLabel>
            <SettingsCard>
              <ProfileMenuRow
                icon={Globe}
                label="Language"
                right={<Text style={styles.valueInline}>{languageLabel}</Text>}
                showChevron={false}
                onPress={() => setLanguageOpen(true)}
              />
              <ProfileLocationRow />
              <ProfileMenuRow
                icon={Info}
                label="About LastBag"
                subtitle="Made in Nepal"
                right={<Text style={styles.valueInline}>v{APP_VERSION}</Text>}
                showChevron={false}
                onPress={() => router.push('/legal/about')}
                isLast
              />
            </SettingsCard>
          </>
        )}

        <Text style={styles.footerTagline}>LastBag · Rescue food, save money</Text>
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
  sectionLabel: {
    ...Type.label,
    color: Palette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginLeft: Spacing.lg + 4,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  settingsCard: {
    ...CardChrome,
    borderRadius: 18,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
  },
  locationRow: {
    minHeight: 58,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconWrapMuted: {
    backgroundColor: Palette.surfaceMuted,
  },
  locationCopy: {
    flex: 1,
    gap: 2,
  },
  locationLabel: {
    ...Type.bodyMedium,
    fontWeight: '600',
    letterSpacing: -0.15,
    color: Palette.textPrimary,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  locationValueMuted: {
    color: Palette.textTertiary,
  },
  locationRefresh: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    minWidth: 56,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  locationRefreshText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
  },
  valueInline: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '600',
  },
  signOutBtn: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  signOutText: {
    ...Type.bodyMedium,
    fontWeight: '700',
    color: Palette.danger,
  },
  footerTagline: {
    ...Type.caption,
    color: Palette.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontWeight: '500',
  },
  footerVersion: {
    ...Type.label,
    color: Palette.textTertiary,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.65,
  },
  languageBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.4)',
  },
  languageSheet: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    top: '36%',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  languageSheetTitle: {
    ...Type.h2,
    color: Palette.textPrimary,
    fontWeight: '700',
  },
});
