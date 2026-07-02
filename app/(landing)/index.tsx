import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Footprints, Search, ShoppingBag } from 'lucide-react-native';
import { useCallback, useEffect, useMemo } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LandingWordmark } from '@/components/brand/LandingWordmark';
import { AppImage } from '@/components/ui/AppImage';
import { Button } from '@/components/ui/Button';
import { Palette } from '@/constants/Colors';
import { CardChrome, FloatingShadow, Radius, Spacing, Type } from '@/constants/theme';
import { formatCountNumber, LANDING_STATS } from '@/constants/stats';
import { useReanimatedCountUp } from '@/hooks/useReanimatedCountUp';
import { getDeviceLocale, markLandingSeen } from '@/lib/landing';
import { useAuthStore } from '@/store/useAuthStore';

const heroImage = require('@/assets/images/landing-hero.jpg');
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.58;

const COPY = {
  en: {
    badge: 'Kathmandu',
    headline: 'Good food.\nHalf the price.\nZero waste.',
    subtext: "Rescue surplus meals from Kathmandu's best restaurants, cafes & bakeries",
    howItWorks: 'How it works',
    step1: 'Find nearby bags',
    step2: 'Reserve in seconds',
    step3: 'Pick up & enjoy',
    cta: 'Start saving food',
    partner: 'I run a restaurant',
    login: 'Already have an account? Log in',
    statFoodLabel: 'kg food saved',
    statRestaurantsLabel: 'restaurants',
    statCityLabel: 'city',
    trustLine: 'Join thousands rescuing food every week',
  },
  np: {
    badge: 'काठमाडौं',
    headline: 'राम्रो खाना।\nआधा मूल्यमा।\nखेर नफाली।',
    subtext: 'काठमाडौंका राम्रा रेस्टुरेन्ट, क्याफे र बेकरीबाट बचेको खाना किन्नुहोस्',
    howItWorks: 'कसरी काम गर्छ',
    step1: 'नजिकका ब्यागहरू',
    step2: 'छिटो रिजर्भ गर्नुहोस्',
    step3: 'लिएर खानुहोस्',
    cta: 'खाना बचाउन सुरु गर्नुहोस्',
    partner: 'म रेस्टुरेन्ट चलाउँछु',
    login: 'पहिले नै खाता छ? लग इन',
    statFoodLabel: 'किलो खाना बच्यो',
    statRestaurantsLabel: 'रेस्टुरेन्ट',
    statCityLabel: 'शहर',
    trustLine: 'हप्तामा हजारौंले खाना बचाउँदै',
  },
} as const;

const STEPS = [
  { key: 'step1' as const, Icon: Search, delay: 0 },
  { key: 'step2' as const, Icon: ShoppingBag, delay: 80 },
  { key: 'step3' as const, Icon: Footprints, delay: 160 },
];

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setPendingRole } = useAuthStore();
  const locale = useMemo(() => getDeviceLocale(), []);
  const copy = COPY[locale];

  const foodSaved = useReanimatedCountUp(LANDING_STATS.foodSavedKg, { durationMs: 1200 });
  const restaurants = useReanimatedCountUp(LANDING_STATS.restaurantCount, { durationMs: 1200 });

  const kenBurns = useSharedValue(1.04);

  useEffect(() => {
    void markLandingSeen();
  }, []);

  useEffect(() => {
    kenBurns.value = withRepeat(
      withTiming(1.08, { duration: 22000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [kenBurns]);

  const heroImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: kenBurns.value }],
  }));

  const navigateAfterSeen = useCallback(
    (
      href:
        | '/(auth)/signup-customer/basics'
        | '/(auth)/signup-partner/basics'
        | '/(auth)/login',
    ) => {
      router.push(href);
    },
    [router],
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={[styles.hero, { height: HERO_HEIGHT }]}>
          <Animated.View style={[styles.heroImageWrap, heroImageStyle]}>
            <AppImage source={heroImage} style={styles.heroImage} resizeMode="cover" />
          </Animated.View>

          <LinearGradient
            colors={['rgba(0,0,0,0.42)', 'transparent', 'transparent', Palette.overlay.heroEnd]}
            locations={[0, 0.28, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.heroTop, { paddingTop: insets.top + Spacing.md }]}>
            <Animated.View entering={FadeIn.duration(500)}>
              <LandingWordmark height={30} />
            </Animated.View>
            <Animated.View entering={FadeIn.delay(120).duration(400)} style={styles.localeBadge}>
              <Text style={styles.localeBadgeText}>{copy.badge}</Text>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInUp.delay(180).duration(650)} style={styles.heroCopy}>
            <Text style={styles.headline}>{copy.headline}</Text>
            <Text style={styles.subtext}>{copy.subtext}</Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(280).duration(550)}
          style={[styles.statsCard, FloatingShadow]}>
          <StatCell value={formatCountNumber(foodSaved)} label={copy.statFoodLabel} />
          <View style={styles.statDivider} />
          <StatCell value={formatCountNumber(restaurants)} label={copy.statRestaurantsLabel} />
          <View style={styles.statDivider} />
          <StatCell value={LANDING_STATS.city} label={copy.statCityLabel} />
        </Animated.View>

        <Text style={styles.trustLine}>{copy.trustLine}</Text>

        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>{copy.howItWorks}</Text>
          <View style={[styles.stepsCard, CardChrome]}>
            {STEPS.map((step, index) => (
              <Animated.View
                key={step.key}
                entering={FadeInDown.delay(360 + step.delay).duration(500)}
                style={styles.stepCard}>
                <View style={styles.stepIconCircle}>
                  <step.Icon size={22} color={Palette.primary} strokeWidth={2.2} />
                </View>
                <Text style={styles.stepLabel}>{copy[step.key]}</Text>
                {index < STEPS.length - 1 ? <View style={styles.stepConnector} /> : null}
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomActions,
          FloatingShadow,
          { paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.sm },
        ]}>
        <Button
          label={copy.cta}
          onPress={() => {
            setPendingRole('customer');
            navigateAfterSeen('/(auth)/signup-customer/basics');
          }}
        />
        <Button
          label={copy.partner}
          variant="secondary"
          size="md"
          onPress={() => {
            setPendingRole('partner');
            navigateAfterSeen('/(auth)/signup-partner/basics');
          }}
        />
        <Button
          label={copy.login}
          variant="ghost"
          size="md"
          onPress={() => navigateAfterSeen('/(auth)/login')}
          style={styles.loginBtn}
          labelStyle={styles.loginLabel}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  hero: {
    overflow: 'hidden',
    justifyContent: 'space-between',
    backgroundColor: Palette.primaryDark,
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    zIndex: 2,
  },
  localeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  localeBadgeText: {
    ...Type.label,
    color: Palette.white,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  heroCopy: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    zIndex: 2,
    gap: Spacing.md,
  },
  headline: {
    color: Palette.white,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 36 * 1.12,
    letterSpacing: -0.5,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0,0,0,0.25)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
      },
      default: {},
    }),
  },
  subtext: {
    color: 'rgba(255,255,255,0.92)',
    ...Type.body,
    maxWidth: 320,
    lineHeight: 22,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.xxxl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    zIndex: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statNumber: {
    color: Palette.primary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  statLabel: {
    ...Type.label,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Palette.borderSubtle,
  },
  trustLine: {
    ...Type.caption,
    color: Palette.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginHorizontal: Spacing.xl,
  },
  stepsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Type.label,
    color: Palette.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  stepsCard: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  stepCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    position: 'relative',
  },
  stepIconCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnector: {
    position: 'absolute',
    top: 26,
    right: -Spacing.sm,
    width: Spacing.lg,
    height: 1,
    backgroundColor: Palette.border,
  },
  stepLabel: {
    ...Type.caption,
    fontWeight: '600',
    color: Palette.textPrimary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xs,
  },
  bottomActions: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.lg + 4,
    borderTopRightRadius: Radius.lg + 4,
    borderTopWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  loginBtn: {
    height: 40,
    marginTop: Spacing.xs,
  },
  loginLabel: {
    ...Type.caption,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
});
