import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/Colors';
import { hapticSuccess } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'find',
    bg: '#D85A30',
    title: 'Find rescue bags near you',
    description:
      'Browse surplus bags from restaurants, cafes and bakeries around you — at up to 70% off.',
    buttonLabel: 'Next →',
    buttonStyle: 'light' as const,
  },
  {
    key: 'reserve',
    bg: '#1A1A1A',
    title: 'Reserve in seconds',
    description:
      'No upfront payment needed. Reserve your bag with just your name and email — completely free.',
    buttonLabel: 'Next →',
    buttonStyle: 'terracotta' as const,
  },
  {
    key: 'pickup',
    bg: '#D85A30',
    title: 'Pick up & pay at counter',
    description:
      "Arrive during the pickup window, show your QR code, pay at the counter. That's it — enjoy!",
    buttonLabel: "Let's rescue food! 🛍",
    buttonStyle: 'light' as const,
  },
];

export default function CustomerOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [slide, setSlide] = useState(0);
  const [saving, setSaving] = useState(false);

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setSlide(index);
  };

  const completeOnboarding = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (userId) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true } as never)
          .eq('id', userId);
      }
      await hapticSuccess();
      router.replace('/(tabs)/customer/home' as never);
    } finally {
      setSaving(false);
    }
  };

  const onPrimary = () => {
    if (slide >= SLIDES.length - 1) {
      void completeOnboarding();
      return;
    }
    goToSlide(slide + 1);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setSlide(index);
  };

  const current = SLIDES[slide] ?? SLIDES[0];

  return (
    <View style={[styles.screen, { backgroundColor: current.bg }]}>
      <StatusBar style="light" />

      {slide < SLIDES.length - 1 ? (
        <Pressable
          onPress={() => void completeOnboarding()}
          style={[styles.skip, { top: insets.top + 12 }]}
          hitSlop={8}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      ) : null}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.pager}
        contentContainerStyle={{ paddingTop: insets.top + 48 }}>
        {/* Slide 1 */}
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <View style={styles.phoneMock}>
            <View style={styles.phoneNotch} />
            <View style={styles.phoneCard}>
              <Text style={styles.phoneCardTitle}>Dal Bhat Set</Text>
              <Text style={styles.phoneCardMeta}>₨150 · Thamel</Text>
            </View>
            <View style={[styles.phoneCard, styles.phoneCardAlt]}>
              <Text style={styles.phoneCardTitle}>Bakery Mix</Text>
              <Text style={styles.phoneCardMeta}>₨99 · Lazimpat</Text>
            </View>
          </View>
          <Text style={styles.title}>{SLIDES[0].title}</Text>
          <Text style={styles.description}>{SLIDES[0].description}</Text>
        </View>

        {/* Slide 2 */}
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>🛍</Text>
          </View>
          <View style={styles.reserveCard}>
            <Text style={styles.reserveTitle}>Dal Bhat Set · ₨150</Text>
            <View style={styles.reservedPill}>
              <Text style={styles.reservedPillText}>Reserved ✓</Text>
            </View>
          </View>
          <Text style={styles.title}>{SLIDES[1].title}</Text>
          <Text style={styles.description}>{SLIDES[1].description}</Text>
        </View>

        {/* Slide 3 */}
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <View style={styles.qrCard}>
            <SvgMock />
          </View>
          <Text style={styles.qrHint}>Show this to the restaurant</Text>
          <Text style={[styles.title, { marginTop: 24 }]}>{SLIDES[2].title}</Text>
          <Text style={styles.description}>{SLIDES[2].description}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots}>
          {SLIDES.map((item, index) => (
            <View
              key={item.key}
              style={[styles.dot, index === slide ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <Pressable
          onPress={onPrimary}
          disabled={saving}
          style={[
            styles.button,
            current.buttonStyle === 'light' ? styles.buttonLight : styles.buttonTerracotta,
            slide === SLIDES.length - 1 && styles.buttonFinal,
          ]}>
          <Text
            style={[
              styles.buttonText,
              current.buttonStyle === 'light'
                ? styles.buttonTextTerracotta
                : styles.buttonTextWhite,
              slide === SLIDES.length - 1 && styles.buttonTextFinal,
            ]}>
            {saving ? 'Starting…' : current.buttonLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SvgMock() {
  return (
    <View style={styles.qrSvg}>
      <View style={styles.qrCorner} />
      <View style={[styles.qrCorner, styles.qrCornerTR]} />
      <View style={[styles.qrCorner, styles.qrCornerBL]} />
      <View style={styles.qrCenter}>
        <Text style={styles.qrCenterText}>LB</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  skip: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '600',
  },
  pager: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  phoneMock: {
    width: 260,
    height: 320,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  phoneNotch: {
    alignSelf: 'center',
    width: 72,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginBottom: 16,
  },
  phoneCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  phoneCardAlt: {
    opacity: 0.92,
  },
  phoneCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  phoneCardMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  emojiCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 72,
  },
  reserveCard: {
    width: 240,
    marginTop: 24,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  reserveTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reservedPill: {
    backgroundColor: '#D1FAE5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  reservedPillText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  qrCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  qrHint: {
    marginTop: 12,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  qrSvg: {
    width: 140,
    height: 140,
    position: 'relative',
  },
  qrCorner: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 6,
    borderColor: '#1A1A1A',
  },
  qrCornerTR: {
    left: undefined,
    right: 8,
  },
  qrCornerBL: {
    top: undefined,
    bottom: 8,
  },
  qrCenter: {
    position: 'absolute',
    top: 54,
    left: 54,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#D85A30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCenterText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  title: {
    marginTop: 32,
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    marginHorizontal: 32,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#FFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  button: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFinal: {
    height: 54,
  },
  buttonLight: {
    backgroundColor: '#FFF',
  },
  buttonTerracotta: {
    backgroundColor: '#D85A30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextFinal: {
    fontWeight: '900',
  },
  buttonTextTerracotta: {
    color: '#D85A30',
  },
  buttonTextWhite: {
    color: '#FFF',
  },
});
