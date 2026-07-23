import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LastBagLogo } from '@/components/LastBagLogo';
import { Palette } from '@/constants/Colors';
import { LANDING_STATS } from '@/constants/stats';
import { Radius } from '@/constants/theme';
import { useSafeBack } from '@/hooks/useSafeBack';
import { useAuthStore } from '@/store/useAuthStore';

const heroImage = require('@/assets/images/landing-hero.jpg');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(SCREEN_HEIGHT * 0.5, 420);
const STEP_CARD_WIDTH = Math.min(168, SCREEN_WIDTH * 0.44);

const STEPS = [
  {
    icon: 'add-box' as const,
    label: 'List a bag',
    detail: 'Photo, price & pickup window',
    accent: Palette.primary,
  },
  {
    icon: 'notifications-active' as const,
    label: 'Get orders',
    detail: 'Customers reserve in seconds',
    accent: Palette.primaryDark,
  },
  {
    icon: 'payments' as const,
    label: 'Get paid',
    detail: 'eSewa or Khalti payout',
    accent: '#EF9F27',
  },
] as const;

const BENEFITS = [
  {
    icon: 'schedule' as const,
    title: '2-minute listings',
    text: 'Snap a photo, set a price, and go live before closing time.',
  },
  {
    icon: 'trending-up' as const,
    title: 'Extra revenue daily',
    text: 'Turn end-of-day surplus into income instead of waste.',
  },
  {
    icon: 'groups' as const,
    title: 'New customers nearby',
    text: 'Reach hungry locals searching for rescue bags in your area.',
  },
] as const;

const TESTIMONIAL = {
  quote: 'We sell 8–12 bags every evening. LastBag turned our leftovers into steady income.',
  name: 'Himalayan Kitchen',
  area: 'Thamel, Kathmandu',
};

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = Date.now();
    let frame = 0;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / durationMs);
      setValue(Math.round(target * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const content = (
    <MaterialIcons name="arrow-back" size={20} color={Palette.white} />
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.backChip, pressed && styles.pressed]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={48} tint="dark" style={styles.backBlur}>
          {content}
        </BlurView>
      ) : (
        <View style={styles.backFallback}>{content}</View>
      )}
    </Pressable>
  );
}

export default function PartnerWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setPendingRole } = useAuthStore();
  const goBack = useSafeBack('/(auth)/welcome');

  const restaurants = useCountUp(LANDING_STATS.restaurantCount);

  const kenBurns = useSharedValue(1.05);

  useEffect(() => {
    kenBurns.value = withRepeat(
      withTiming(1.12, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [kenBurns]);

  const heroImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: kenBurns.value }],
  }));

  const startSignup = () => {
    setPendingRole('partner');
    router.push('/(auth)/signup-partner/basics');
  };

  const signInExisting = () => {
    setPendingRole('partner');
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={[styles.hero, { height: HERO_HEIGHT }]}>
          <Animated.View style={[styles.heroImageWrap, heroImageStyle]}>
            <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
          </Animated.View>

          <View style={styles.heroOverlayTop} />
          <View style={styles.heroOverlayMid} />
          <View style={styles.heroOverlayBottom} />

          <View style={[styles.heroInner, { paddingTop: insets.top + 8 }]}>
            <View style={styles.heroTopRow}>
              <BackButton onPress={goBack} />
              <View style={styles.logoChip}>
                <LastBagLogo size="sm" variant="dark" />
              </View>
              <View style={styles.heroSpacer} />
            </View>

            <Animated.View entering={FadeInUp.delay(80).duration(600)} style={styles.heroCopy}>
              <View style={styles.partnerBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.partnerBadgeText}>For restaurants & bakeries</Text>
              </View>

              <Text style={styles.title}>
                Turn leftover food{'\n'}into{' '}
                <Text style={styles.titleAccent}>revenue</Text>
              </Text>
              <Text style={styles.subtitle}>
                List rescue bags in minutes. Zero upfront cost. Payouts straight to your wallet.
              </Text>

              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Payouts via</Text>
                <View style={styles.payoutPills}>
                  <View style={styles.payoutPill}>
                    <Text style={styles.payoutPillText}>eSewa</Text>
                  </View>
                  <View style={styles.payoutPill}>
                    <Text style={styles.payoutPillText}>Khalti</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(140).duration(500)}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={styles.statIconWrap}>
                <MaterialIcons name="store" size={16} color={Palette.primary} />
              </View>
              <Text style={styles.statValue}>{restaurants}+</Text>
              <Text style={styles.statLabel}>restaurants</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconWrap}>
                <MaterialIcons name="timer" size={16} color={Palette.primary} />
              </View>
              <Text style={styles.statValue}>2 min</Text>
              <Text style={styles.statLabel}>to go live</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconWrap}>
                <MaterialIcons name="verified" size={16} color={Palette.primary} />
              </View>
              <Text style={styles.statValue}>₹0</Text>
              <Text style={styles.statLabel}>listing fee</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <SectionHeader label="How it works" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={STEP_CARD_WIDTH + 12}
            contentContainerStyle={styles.stepsScroll}>
            {STEPS.map((step, index) => (
              <View
                key={step.label}
                style={[styles.stepCard, { width: STEP_CARD_WIDTH }, index === 0 && styles.stepFirst]}>
                <View style={styles.stepTop}>
                  <View style={[styles.stepIcon, { backgroundColor: step.accent }]}>
                    <MaterialIcons name={step.icon} size={22} color={Palette.white} />
                  </View>
                  <Text style={styles.stepIndex}>0{index + 1}</Text>
                </View>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepDetail}>{step.detail}</Text>
                {index < STEPS.length - 1 ? (
                  <View style={styles.stepConnector}>
                    <View style={styles.stepConnectorLine} />
                    <MaterialIcons name="chevron-right" size={14} color={Palette.textMuted} />
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(500)} style={styles.section}>
          <SectionHeader label="Why partners choose us" />
          <View style={styles.benefits}>
            {BENEFITS.map((benefit, index) => (
              <View key={benefit.title} style={styles.benefitCard}>
                <View style={styles.benefitAccentBar} />
                <View style={styles.benefitBody}>
                  <View style={styles.benefitTop}>
                    <View style={styles.benefitIconWrap}>
                      <MaterialIcons name={benefit.icon} size={20} color={Palette.primary} />
                    </View>
                    <Text style={styles.benefitIndex}>0{index + 1}</Text>
                  </View>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360).duration(500)} style={styles.testimonialCard}>
          <View style={styles.quoteIcon}>
            <MaterialIcons name="format-quote" size={22} color={Palette.primary} />
          </View>
          <Text style={styles.quoteText}>&ldquo;{TESTIMONIAL.quote}&rdquo;</Text>
          <View style={styles.quoteFooter}>
            <View style={styles.quoteAvatar}>
              <Text style={styles.quoteAvatarText}>HK</Text>
            </View>
            <View style={styles.quoteMeta}>
              <Text style={styles.quoteName}>{TESTIMONIAL.name}</Text>
              <Text style={styles.quoteArea}>{TESTIMONIAL.area}</Text>
            </View>
            <View style={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <MaterialIcons key={i} name="star" size={14} color={Palette.amber} />
              ))}
            </View>
          </View>
        </Animated.View>

        <View style={styles.trustRow}>
          <LastBagLogo size="sm" />
          <Text style={styles.trustText}>
            Join {LANDING_STATS.restaurantCount}+ Kathmandu venues cutting waste every day
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.bottomGlow} pointerEvents="none" />
        <View style={styles.freeBadge}>
          <MaterialIcons name="check-circle" size={14} color={Palette.primary} />
          <Text style={styles.freeBadgeText}>Free to join · No commission on first 10 bags</Text>
        </View>
        <Pressable
          onPress={startSignup}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
          <Text style={styles.primaryBtnText}>Create my restaurant account</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Palette.white} />
        </Pressable>
        <Pressable onPress={signInExisting} style={styles.signInLink}>
          <Text style={styles.signInMuted}>Already a partner? </Text>
          <Text style={styles.signInAccent}>Sign in</Text>
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
  scrollContent: {
    paddingBottom: 20,
  },
  hero: {
    overflow: 'hidden',
    backgroundColor: Palette.darkGreen,
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Palette.overlay.heroSoft,
  },
  heroOverlayMid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '30%',
    bottom: 0,
    backgroundColor: Palette.overlay.heroMid,
  },
  heroOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
    backgroundColor: Palette.overlay.heroStrong,
  },
  heroInner: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroSpacer: {
    width: 40,
  },
  backChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  backBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  logoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  wordmark: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  submark: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroCopy: {
    marginTop: 'auto',
    paddingBottom: 32,
    gap: 14,
  },
  partnerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6EE7B7',
  },
  partnerBadgeText: {
    color: Palette.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Palette.white,
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  titleAccent: {
    color: '#A8F0D8',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    maxWidth: 340,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  payoutLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
  payoutPills: {
    flexDirection: 'row',
    gap: 8,
  },
  payoutPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  payoutPillText: {
    color: Palette.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    marginHorizontal: 20,
    marginTop: -28,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    zIndex: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: Palette.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: Palette.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: Palette.border,
  },
  section: {
    paddingTop: 32,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Palette.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.textMuted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  stepsScroll: {
    paddingHorizontal: 20,
    paddingRight: 8,
    gap: 12,
  },
  stepFirst: {
    marginLeft: 0,
  },
  stepCard: {
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    gap: 8,
    position: 'relative',
  },
  stepTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndex: {
    fontSize: 28,
    fontWeight: '800',
    color: Palette.lightGreenBg,
    letterSpacing: -1,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textPrimary,
    lineHeight: 19,
  },
  stepDetail: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textMuted,
    lineHeight: 17,
  },
  stepConnector: {
    position: 'absolute',
    right: -10,
    top: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  stepConnectorLine: {
    width: 8,
    height: 1,
    backgroundColor: Palette.border,
  },
  benefits: {
    paddingHorizontal: 20,
    gap: 12,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  benefitAccentBar: {
    width: 4,
    backgroundColor: Palette.primary,
  },
  benefitBody: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  benefitTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  benefitIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIndex: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.lightGreenBg,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.textPrimary,
    lineHeight: 21,
  },
  benefitText: {
    fontSize: 13,
    lineHeight: 19,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  testimonialCard: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: Palette.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 20,
    gap: 14,
  },
  quoteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.lightGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 23,
    color: Palette.textPrimary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  quoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  quoteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteAvatarText: {
    color: Palette.white,
    fontSize: 13,
    fontWeight: '800',
  },
  quoteMeta: {
    flex: 1,
    gap: 2,
  },
  quoteName: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  quoteArea: {
    fontSize: 12,
    color: Palette.textMuted,
    fontWeight: '500',
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Palette.lightGreenBg,
    borderWidth: 1,
    borderColor: Palette.overlay.border,
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: Palette.primaryDark,
    fontWeight: '600',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    backgroundColor: Palette.white,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  bottomGlow: {
    position: 'absolute',
    top: -24,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: 'transparent',
    shadowColor: Palette.primaryDark,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primaryDark,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    paddingVertical: 17,
  },
  primaryBtnText: {
    color: Palette.white,
    fontSize: 16,
    fontWeight: '800',
  },
  signInLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  signInMuted: {
    color: Palette.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  signInAccent: {
    color: Palette.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
